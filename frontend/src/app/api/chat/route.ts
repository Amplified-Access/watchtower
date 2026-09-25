import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { assistantApi } from "@/lib/api/assistant";
import { analyticsApi } from "@/lib/api/analytics";
import { mapApi, type MapPeriod } from "@/lib/api/map";
import { createFallbackModel } from "@/lib/ai/model-fallback";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Gemini's free tier counts requests per day per model, and every tool call
// is a request — so the chat runs through a chain rather than one model. A
// model that answers "out of quota" or "high demand" is skipped until its
// cooldown expires, and the next one takes over mid-conversation. Newest first; override with
// GEMINI_MODEL_CHAIN (comma-separated) to change the order or add models.
const MODEL_CHAIN = (
  process.env.GEMINI_MODEL_CHAIN ??
  "gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// Built once per server instance so the cooldowns it learns are remembered
// between requests.
const chatModel = createFallbackModel(
  MODEL_CHAIN.map((id) => google(id)),
  {
    onExhausted: (modelId, cooldownMs, reason) =>
      console.warn(
        `[chat] ${modelId} is ${reason === "quota" ? "out of quota" : "overloaded"}; skipping it for ${Math.round(cooldownMs / 60000)} min`,
      ),
  },
);

// The route is public and every call spends model quota, so bound what one
// request can send until chat moves behind the Go backend's rate limiter.
const MAX_MESSAGES = 30;
const MAX_TOTAL_CHARS = 20_000;
// Individual reports are heavier than counts, so the model gets few of them.
const MAX_INCIDENTS = 10;

// Mirrors the Go handler's accepted values, so the model can't invent a
// grouping or window the backend would reject.
const groupBySchema = z.enum(["country", "type", "day", "week", "month"]);
// Periods are windows counted back from now: "month" is the last 30 days and
// "year" the last 365, never a calendar month or year. For "in 2026" or "in
// March", the model should use from/to instead.
const periodSchema = z
  .enum(["24h", "7d", "30d", "week", "month", "year"])
  .describe("window counted back from now; 'year' means the last 365 days, not the calendar year");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD");

const messageChars = (message: UIMessage) =>
  message.parts.reduce(
    (total, part) => total + ("text" in part && typeof part.text === "string" ? part.text.length : 0),
    0,
  );

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { messages?: UIMessage[] } | null;
  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return Response.json({ error: "messages are required" }, { status: 400 });
  }
  // Older turns beyond the cap are dropped rather than rejected, so long
  // conversations keep working.
  const messages = body.messages.slice(-MAX_MESSAGES);
  if (messages.reduce((total, m) => total + messageChars(m), 0) > MAX_TOTAL_CHARS) {
    return Response.json({ error: "conversation is too long" }, { status: 413 });
  }

  const result = streamText({
    model: chatModel,
    // The chain already tries every model; the SDK's own retries would only
    // repeat a chain that has just been exhausted.
    maxRetries: 1,
    system: `You are Esi, a helpful multilingual AI assistant for the WatchTower platform.
Your Purpose
Answer user questions about the platform and provide navigational guidance in the user's preferred language. You are specifically designed to excel in these languages:

English: The primary language for the platform and international communication
Swahili (Kiswahili): Widely spoken across Kenya, Tanzania, Uganda, Rwanda, and the Democratic Republic of Congo
Luganda: The most widely spoken language in Uganda, particularly in the central region
Amharic: The official working language of Ethiopia
Kinyarwanda: The national language of Rwanda
Kikuyu (Gikuyu): A Bantu language spoken primarily by the Kikuyu people of central Kenya
Punjabi: Widely spoken in Pakistan and India, particularly in Punjab regions
Urdu: The national language of Pakistan and widely spoken in India

Language Guidelines

Respond naturally: Communicate directly in the language the user chooses - no translations needed
Stay in the chosen language: Once a language is established, continue the entire conversation in that language unless the user switches
Be culturally appropriate: Use natural expressions and communication patterns appropriate for each language
One language per response: Avoid mixing languages or providing translations unless specifically requested

Core Functionality
When to use the knowledge base: Use the getInformation tool only when a user's question specifically requires details about the WatchTower platform, its features, or how to navigate it.

Answering questions about incident data
WatchTower's reports change daily, so never answer a question about what has been reported from memory - always use the data tools, even if a similar question was answered earlier in the conversation.

getDataOverview: how many reports exist, the dates they span, and the exact country and incident type names available. Call it first when you do not already know the right names to filter by, or when asked what data exists.
queryIncidentStats: the main tool. Counts reports, injuries and fatalities, optionally split by country, type, day, week or month. Use groupBy to rank ("which country reports most" - groupBy country) or to show change over time ("is it rising" - groupBy month).
findIncidents: a few individual reports, for "what happened recently in X".
getIncidentDetail: the full public detail of one report, when the user asks about a specific one.

Rules for data answers
Relative windows versus calendar dates: period counts backwards from now, so "year" is the last 365 days. For a named month or calendar year ("in March", "in 2026"), pass from and to instead, and say which you used.
Use exact names: country and type filters match names exactly. Take them from getDataOverview; do not guess or translate them.
State what you counted: every figure must say the period and any country or type filter behind it, in the user's language.
Never estimate or extrapolate: report only the numbers the tools return. If a count is zero, say plainly that no reports match - do not fall back on general knowledge about the country or the topic.
Mind the source: these are reports submitted to WatchTower, not a complete record of everything that happened. Say "reports submitted" rather than implying full coverage.
Chain tools when needed: a comparison may need two queries. Make them, then answer once.
Be careful with sensitive detail: individual reports can describe violence. Summarise plainly and without dramatisation, and do not repeat identifying details of individuals.
Provide clear and simple answers: Base your responses on the information you find, or on your general knowledge for simple queries. Use straightforward, user-friendly language appropriate to the language being used. Never use technical jargon, file paths, or private information.
Provide navigational guidance: For questions about "getting started," "how to," or where to find something, provide clear, actionable instructions that direct the user to the correct page or feature on the platform.
Handle irrelevant questions: If a user asks a question that is outside of your purpose, humbly and politely explain in their language that you can only provide information about the WatchTower platform.
Maintain a helpful tone: Be friendly, helpful, and concise in your responses. Adapt your tone to be culturally appropriate for the language being used. Do not use emojis.
Identity Guidelines
Stay in character: You are Esi, a helpful AI assistant for the WatchTower platform. Do not reveal other AI model identities or training details.
If asked about your identity: Respond as Esi and explain your role as an assistant for the WatchTower platform.
If pressed for technical details: You may reveal that you are a chatbot created by AmplifiedAccess to help people on the WatchTower platform, but do not provide information about other AI models or training processes.`,
    messages: convertToModelMessages(messages),
    // Enough steps for an overview, two queries and an answer.
    stopWhen: stepCountIs(8),
    tools: {
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe("the users question"),
        }),
        // The Go backend owns the knowledge base. If the search fails the
        // assistant still answers, just without citing it.
        execute: async ({ question }) => {
          const res = await assistantApi.searchKnowledge(question);
          return res.success ? (res.data ?? []) : [];
        },
      }),

      getDataOverview: tool({
        description:
          "What incident report data exists: total reports, the dates they span, and the exact country and incident type names that can be filtered on. Call before querying when unsure of a name.",
        inputSchema: z.object({}),
        execute: async () => {
          const res = await analyticsApi.getOverview();
          return res.success ? res.data : { error: res.error ?? "Data is unavailable right now." };
        },
      }),

      queryIncidentStats: tool({
        description:
          "Count reported incidents, injuries and fatalities, with optional filters and one grouping. Use groupBy to rank countries or types, or to see change over day, week or month.",
        inputSchema: z.object({
          groupBy: groupBySchema
            .optional()
            .describe("split the counts by this dimension; omit for totals only"),
          country: z.string().optional().describe("exact country name from getDataOverview"),
          category: z.string().optional().describe("exact incident type name from getDataOverview"),
          period: periodSchema
            .optional()
            .describe("relative window; omit for all time, or use from/to instead"),
          from: dateSchema.optional().describe("start date YYYY-MM-DD, instead of period"),
          to: dateSchema.optional().describe("end date YYYY-MM-DD inclusive, instead of period"),
          q: z.string().optional().describe("free-text search of places and descriptions"),
          limit: z.number().int().min(1).max(100).optional().describe("maximum buckets, default 20"),
        }),
        execute: async (query) => {
          const res = await analyticsApi.queryIncidents(query);
          return res.success ? res.data : { error: res.error ?? "That query could not be run." };
        },
      }),

      findIncidents: tool({
        description:
          "List individual reported incidents matching a filter, newest first, for questions about what was reported recently or in a place.",
        inputSchema: z.object({
          country: z.string().optional().describe("exact country name from getDataOverview"),
          category: z.string().optional().describe("exact incident type name from getDataOverview"),
          period: periodSchema.optional(),
          q: z.string().optional().describe("free-text search of places and descriptions"),
          limit: z.number().int().min(1).max(MAX_INCIDENTS).optional(),
        }),
        execute: async ({ limit, ...filter }) => {
          const res = await mapApi.getPoints({ ...filter, period: filter.period as MapPeriod });
          if (!res.success || !res.data) {
            return { error: res.error ?? "Reports could not be loaded." };
          }
          const features = res.data.features.slice(0, limit ?? 5);
          return {
            matching: res.data.features.length,
            // Slim rows: enough to say what and where, not the whole report.
            incidents: features.map((f) => ({
              id: f.properties.id,
              place: f.properties.name,
              country: f.properties.country,
              reportedAt: f.properties.createdAt,
            })),
          };
        },
      }),

      getIncidentDetail: tool({
        description:
          "The public detail of one reported incident by id, including its description and casualty figures. Ids come from findIncidents.",
        inputSchema: z.object({
          id: z.string().describe("the incident id from findIncidents"),
        }),
        execute: async ({ id }) => {
          const res = await mapApi.getReport(id);
          return res.success ? res.data : { error: res.error ?? "That report could not be found." };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
