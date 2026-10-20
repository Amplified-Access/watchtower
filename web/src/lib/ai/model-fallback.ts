import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
} from "@ai-sdk/provider";

/**
 * Routes a call across several models, falling back when one is out of quota
 * or overloaded.
 *
 * Gemini's free tier allows a fixed number of requests per day *per model*,
 * and every tool call is a separate request — so one data question can cost
 * several. Chaining models multiplies the daily allowance, and a model that
 * answers a 429 is skipped until its cooldown expires rather than being
 * retried on every step of every conversation. A 503 "high demand" answer is
 * treated the same way with a short cooldown: those spikes are per model and
 * usually pass in minutes, so the next model can take the request meanwhile.
 *
 * The cooldown lives in the process, so each server instance learns
 * separately and forgets on restart. That is deliberate: it is a way to stop
 * wasting requests, not a source of truth about quota.
 */

/** How long a model is skipped after a per-day quota error. */
export const DAILY_COOLDOWN_MS = 6 * 60 * 60 * 1000;
/** How long it is skipped after a per-minute quota error. */
export const BURST_COOLDOWN_MS = 60 * 1000;
/** How long it is skipped after answering that it is overloaded. */
export const OVERLOAD_COOLDOWN_MS = 2 * 60 * 1000;

export type FailoverReason = "quota" | "overloaded";

export type FallbackOptions = {
  /** Called when a model is set aside, for logging. */
  onExhausted?: (modelId: string, cooldownMs: number, reason: FailoverReason) => void;
  /** Overridable for tests. */
  now?: () => number;
};

function statusOf(error: unknown): number | undefined {
  return (error as { statusCode?: number })?.statusCode ?? (error as { status?: number })?.status;
}

/** True when an error means "this model has no quota right now". */
export function isQuotaError(error: unknown): boolean {
  if (statusOf(error) === 429) return true;

  const text = describe(error).toLowerCase();
  return (
    text.includes("resource_exhausted") ||
    text.includes("exceeded your current quota") ||
    text.includes("rate limit")
  );
}

/** True when an error means "this model is too busy to answer right now". */
export function isOverloadError(error: unknown): boolean {
  if (statusOf(error) === 503) return true;

  const text = describe(error).toLowerCase();
  return text.includes("high demand") || text.includes("overloaded");
}

/** Why a model should be set aside for this error, or null to rethrow it. */
export function failoverReason(error: unknown): FailoverReason | null {
  if (isQuotaError(error)) return "quota";
  if (isOverloadError(error)) return "overloaded";
  return null;
}

/**
 * Per-day quotas reset overnight, so a model that hits one is worth skipping
 * for hours; a per-minute burst limit clears in seconds.
 */
export function cooldownFor(error: unknown): number {
  if (failoverReason(error) === "overloaded") return OVERLOAD_COOLDOWN_MS;
  const text = describe(error).toLowerCase();
  const perDay = text.includes("perday") || text.includes("per day") || text.includes("requestsperday");
  return perDay ? DAILY_COOLDOWN_MS : BURST_COOLDOWN_MS;
}

function describe(error: unknown): string {
  if (error == null) return "";
  const parts = [String((error as { message?: string }).message ?? error)];
  for (const key of ["responseBody", "data", "cause"] as const) {
    const value = (error as Record<string, unknown>)[key];
    if (typeof value === "string") parts.push(value);
    else if (value != null) {
      try {
        parts.push(JSON.stringify(value));
      } catch {
        // A value that can't be serialised tells us nothing; skip it.
      }
    }
  }
  return parts.join(" ");
}

export function createFallbackModel(
  models: LanguageModelV2[],
  { onExhausted, now = Date.now }: FallbackOptions = {},
): LanguageModelV2 {
  if (models.length === 0) {
    throw new Error("createFallbackModel needs at least one model");
  }

  // modelId -> the time its cooldown expires.
  const cooling = new Map<string, number>();

  /** Models to try, in order: available ones first, then the soonest to free up. */
  function order(): LanguageModelV2[] {
    const available = models.filter((m) => (cooling.get(m.modelId) ?? 0) <= now());
    if (available.length > 0) return available;
    // Everything is cooling down. Rather than fail without trying, ask the
    // one whose cooldown ends first — our record may be stale or wrong.
    return [...models].sort(
      (a, b) => (cooling.get(a.modelId) ?? 0) - (cooling.get(b.modelId) ?? 0),
    );
  }

  async function attempt<T>(run: (model: LanguageModelV2) => PromiseLike<T>): Promise<T> {
    const candidates = order();
    let lastError: unknown;

    for (const model of candidates) {
      try {
        return await run(model);
      } catch (error) {
        const reason = failoverReason(error);
        if (!reason) throw error;
        const cooldownMs = cooldownFor(error);
        cooling.set(model.modelId, now() + cooldownMs);
        onExhausted?.(model.modelId, cooldownMs, reason);
        lastError = error;
      }
    }
    throw lastError;
  }

  const first = models[0];
  return {
    specificationVersion: "v2",
    provider: first.provider,
    // The first model's id is what shows in logs; the one that answered is
    // reported through onExhausted when it isn't this one.
    modelId: first.modelId,
    supportedUrls: first.supportedUrls,
    doGenerate: (options: LanguageModelV2CallOptions) =>
      attempt((model) => model.doGenerate(options)),
    doStream: (options: LanguageModelV2CallOptions) =>
      attempt((model) => model.doStream(options)),
  };
}
