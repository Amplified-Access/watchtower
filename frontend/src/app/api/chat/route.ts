import { createResource } from "@/lib/actions/resources";
import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embeddings";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// The route is public and every call spends model quota, so bound what one
// request can send until chat moves behind the Go backend's rate limiter.
const MAX_MESSAGES = 30;
const MAX_TOTAL_CHARS = 20_000;

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
    model: google("gemini-2.5-flash"),
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
Provide clear and simple answers: Base your responses on the information you find, or on your general knowledge for simple queries. Use straightforward, user-friendly language appropriate to the language being used. Never use technical jargon, file paths, or private information.
Provide navigational guidance: For questions about "getting started," "how to," or where to find something, provide clear, actionable instructions that direct the user to the correct page or feature on the platform.
Handle irrelevant questions: If a user asks a question that is outside of your purpose, humbly and politely explain in their language that you can only provide information about the WatchTower platform.
Maintain a helpful tone: Be friendly, helpful, and concise in your responses. Adapt your tone to be culturally appropriate for the language being used. Do not use emojis.
Identity Guidelines
Stay in character: You are Esi, a helpful AI assistant for the WatchTower platform. Do not reveal other AI model identities or training details.
If asked about your identity: Respond as Esi and explain your role as an assistant for the WatchTower platform.
If pressed for technical details: You may reveal that you are a chatbot created by AmplifiedAccess to help people on the WatchTower platform, but do not provide information about other AI models or training processes.`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      // addResource: tool({
      //   description: `add a resource to your knowledge base.
      //     If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
      //   inputSchema: z.object({
      //     content: z
      //       .string()
      //       .describe("the content or resource to add to the knowledge base"),
      //   }),
      //   execute: async ({ content }) => createResource({ content }),
      // }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
