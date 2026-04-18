"use client";

import { useConversation } from "@elevenlabs/react";
import { useCallback } from "react";
import { Button } from "./ui/button";
import { AudioLines, Dot, Mic } from "lucide-react";
import Loader from "./common/loader";

export function Conversation() {
  const conversation = useConversation({
    onConnect: () => console.log("Connected"),
    onDisconnect: () => console.log("Disconnected"),
    onMessage: (message) => console.log("Message:", message),
    onError: (error) => console.error("Error:", error),
  });

  const agentId = process.env.ELEVEN_LABS_AGENT_ID;

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: 'agent_4001k3jyeawcf8z9cs2f5aqvjx25', // Replace with your agent ID
        // @ts-ignore
        userd: "YOUR_CUSTOMER_USER_ID", // Optional field for tracking your end user IDs
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleConversation = useCallback(async () => {
    if (conversation.status === "connected") {
      await stopConversation();
    } else {
      await startConversation();
    }
  }, [conversation, startConversation, stopConversation]);

  return (
    <div className="flex flex-col items-center gap-4 fixed right-6 bottom-6">
      <div className="flex gap-2">
        {/* <button
          onClick={startConversation}
          disabled={conversation.status === "connected"}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== "connected"}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Conversation
        </button> */}
        <div
          onClick={toggleConversation}
          className="w-fit rounded-full bg-primary text-white p-4 hover:cursor-pointer"
        >
          {conversation.isSpeaking ? (
            <AudioLines />
          ) : conversation.status == "connecting" ? (
            <Loader />
          ) : conversation.status == "connected" ? (
            <Dot />
          ) : (
            <Mic size={20} strokeWidth={1.5} />
          )}
        </div>
      </div>

      {/* <div className="flex flex-col items-center">
        <p>Status: {conversation.status}</p>
        <p>Agent is {conversation.isSpeaking ? "speaking" : "listening"}</p>
      </div> */}
    </div>
  );
}
