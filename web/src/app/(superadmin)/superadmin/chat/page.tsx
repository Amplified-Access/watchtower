"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat();
  const isLoading = false; // Simplified for now

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Card className="h-[80vh]">
        <CardHeader>
          <CardTitle>AI Knowledge Base Chat</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask questions or add knowledge to the RAG system. Try saying "My
            favorite food is pizza" to add knowledge, then ask "What is my
            favorite food?" to retrieve it.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          <ScrollArea className="flex-1 space-y-4 pr-4">
            {messages.map((m) => (
              <div key={m.id} className="mb-4">
                <div className="font-semibold text-sm mb-2 capitalize">
                  {m.role}
                </div>
                <div className="space-y-2">
                  {m.parts.map((part, index) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <div
                            key={index}
                            className="prose prose-sm max-w-none"
                          >
                            <p className="whitespace-pre-wrap">{part.text}</p>
                          </div>
                        );
                      case "tool-addResource":
                      case "tool-getInformation":
                        return (
                          <div key={index} className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-2">
                              {part.state === "output-available"
                                ? "Called"
                                : "Calling"}{" "}
                              tool: {part.type}
                            </p>
                            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                              {JSON.stringify(part.input, null, 2)}
                            </pre>
                            {part.state === "output-available" && (
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1">
                                  Output: Operation completed
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  AI is thinking...
                </span>
              </div>
            )}
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: input }],
                });
                setInput("");
              }
            }}
            className="flex space-x-2 mt-4"
          >
            <Input
              value={input}
              placeholder="Ask a question or add knowledge..."
              onChange={(e) => setInput(e.currentTarget.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
