import type { LanguageModelV2 } from "@ai-sdk/provider";

import {
  BURST_COOLDOWN_MS,
  DAILY_COOLDOWN_MS,
  createFallbackModel,
  cooldownFor,
  isQuotaError,
} from "./model-fallback";

/** A quota rejection shaped like the one the Gemini provider throws. */
function quotaError(perDay = true) {
  return Object.assign(new Error("Failed after 3 attempts. Last error: You exceeded your current quota"), {
    statusCode: 429,
    responseBody: JSON.stringify({
      error: {
        code: 429,
        status: "RESOURCE_EXHAUSTED",
        details: [
          {
            violations: [
              {
                quotaId: perDay
                  ? "GenerateRequestsPerDayPerProjectPerModel-FreeTier"
                  : "GenerateRequestsPerMinutePerProjectPerModel-FreeTier",
              },
            ],
          },
        ],
      },
    }),
  });
}

type FakeModel = LanguageModelV2 & { calls: number };

function fakeModel(modelId: string, behaviour: () => unknown = () => "ok"): FakeModel {
  const model = {
    specificationVersion: "v2",
    provider: "google",
    modelId,
    supportedUrls: {},
    calls: 0,
    async doGenerate() {
      model.calls++;
      const result = behaviour();
      if (result instanceof Error) throw result;
      return result;
    },
    async doStream() {
      model.calls++;
      const result = behaviour();
      if (result instanceof Error) throw result;
      return result;
    },
  } as unknown as FakeModel;
  return model;
}

describe("isQuotaError", () => {
  it("recognises a quota rejection", () => {
    expect(isQuotaError(quotaError())).toBe(true);
    expect(isQuotaError(Object.assign(new Error("slow down"), { statusCode: 429 }))).toBe(true);
  });

  it("leaves other failures alone", () => {
    expect(isQuotaError(new Error("network unreachable"))).toBe(false);
    expect(isQuotaError(Object.assign(new Error("bad request"), { statusCode: 400 }))).toBe(false);
  });
});

describe("cooldownFor", () => {
  it("skips a model for hours on a per-day quota, seconds on a burst limit", () => {
    expect(cooldownFor(quotaError(true))).toBe(DAILY_COOLDOWN_MS);
    expect(cooldownFor(quotaError(false))).toBe(BURST_COOLDOWN_MS);
  });
});

describe("createFallbackModel", () => {
  it("uses the first model while it works", async () => {
    const first = fakeModel("a");
    const second = fakeModel("b");
    const model = createFallbackModel([first, second]);

    await model.doStream({} as never);
    await model.doStream({} as never);

    expect(first.calls).toBe(2);
    expect(second.calls).toBe(0);
  });

  it("falls back to the next model when one is out of quota", async () => {
    const first = fakeModel("a", () => quotaError());
    const second = fakeModel("b");
    const exhausted: string[] = [];
    const model = createFallbackModel([first, second], {
      onExhausted: (id) => exhausted.push(id),
    });

    await expect(model.doStream({} as never)).resolves.toBe("ok");
    expect(exhausted).toEqual(["a"]);
  });

  it("stops asking an exhausted model until its cooldown expires", async () => {
    let clock = 0;
    const first = fakeModel("a", () => quotaError());
    const second = fakeModel("b");
    const model = createFallbackModel([first, second], { now: () => clock });

    await model.doStream({} as never);
    expect(first.calls).toBe(1);

    await model.doStream({} as never);
    await model.doStream({} as never);
    expect(first.calls).toBe(1); // skipped, not retried on every request
    expect(second.calls).toBe(3);

    clock += DAILY_COOLDOWN_MS + 1;
    await model.doStream({} as never);
    expect(first.calls).toBe(2); // tried again once its quota should have reset
  });

  it("passes other errors straight through without burning the chain", async () => {
    const boom = new Error("invalid request");
    const first = fakeModel("a", () => boom);
    const second = fakeModel("b");
    const model = createFallbackModel([first, second]);

    await expect(model.doStream({} as never)).rejects.toThrow("invalid request");
    expect(second.calls).toBe(0);
  });

  it("still tries the soonest-free model when every model is cooling down", async () => {
    const first = fakeModel("a", () => quotaError());
    const second = fakeModel("b", () => quotaError(false));
    const model = createFallbackModel([first, second]);

    await expect(model.doStream({} as never)).rejects.toBeDefined();
    // b's burst cooldown is the shorter one, so it is asked first next time.
    await expect(model.doStream({} as never)).rejects.toBeDefined();
    expect(second.calls).toBe(2);
  });

  it("reports the last error when nothing can answer", async () => {
    const model = createFallbackModel([fakeModel("a", () => quotaError())]);
    await expect(model.doStream({} as never)).rejects.toThrow("exceeded your current quota");
  });
});
