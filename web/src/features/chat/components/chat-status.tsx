"use client";

import { isToolUIPart, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import Loader from "@/components/ai/chat/loader";

type StatusKey =
  | "statusThinking"
  | "statusSearchingKnowledge"
  | "statusCheckingData"
  | "statusAnalysing"
  | "statusFindingReports"
  | "statusReadingReport"
  | "statusReviewing";

// One label per tool in app/api/chat/route.ts, shown while that tool runs.
// A tool added there without an entry here falls back to "Thinking".
const TOOL_STATUS: Record<string, StatusKey> = {
  "tool-getInformation": "statusSearchingKnowledge",
  "tool-getDataOverview": "statusCheckingData",
  "tool-queryIncidentStats": "statusAnalysing",
  "tool-findIncidents": "statusFindingReports",
  "tool-getIncidentDetail": "statusReadingReport",
};

// Reads the phase off the reply's latest part. Null once the answer is
// streaming, since the words arriving are progress enough.
const getChatStatus = (messages: UIMessage[]): StatusKey | null => {
  const last = messages[messages.length - 1];
  if (last?.role !== "assistant") {
    return "statusThinking";
  }

  // step-start only marks a new model call, so it says nothing of the phase.
  const parts = last.parts.filter((part) => part.type !== "step-start");
  const part = parts[parts.length - 1];
  if (!part) {
    return "statusThinking";
  }
  if (part.type === "text") {
    return part.state === "streaming" ? null : "statusThinking";
  }
  if (isToolUIPart(part)) {
    // A finished tool leaves the model reading its results before the next
    // step, often the longest quiet stretch of a reply.
    if (part.state === "output-available" || part.state === "output-error") {
      return "statusReviewing";
    }
    return TOOL_STATUS[part.type] ?? "statusThinking";
  }
  return "statusThinking";
};

const ChatStatus = ({ messages }: { messages: UIMessage[] }) => {
  const t = useTranslations("ChatPage");
  const status = getChatStatus(messages);

  return (
    <div role="status" className="flex items-center gap-3 py-4 text-sm text-dark/60">
      <Loader />
      {/* mode="wait" lets the old label leave before the next arrives, so
          two phases never overlap mid-swap. */}
      <AnimatePresence mode="wait" initial={false}>
        {status && (
          <motion.span
            key={status}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {t(status)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatStatus;
