"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import ChatComposer from "@/features/chat/components/chat-composer";
import ChatStatus from "@/features/chat/components/chat-status";

// Custom hook for smooth auto-scrolling chat to bottom
function useChatScroll(messages: UIMessage[]) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth: boolean = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is updated with new message
    const timeoutId = setTimeout(() => {
      scrollToBottom(true);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  return { ref: scrollContainerRef, bottomRef, scrollToBottom };
}

function ChatContent() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const processedStarterRef = useRef<string | null>(null);
  const { messages, sendMessage } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: (message) => {
      console.log("Chat finished:", message);
    },
  });
  const searchParams = useSearchParams();
  const { ref: chatRef, bottomRef, scrollToBottom } = useChatScroll(messages);

  const submitMessage = useCallback(
    async (messageText: string) => {
      const nextInput = messageText.trim();
      if (!nextInput || isLoading) {
        return;
      }

      setIsLoading(true);

      try {
        await sendMessage({
          role: "user",
          parts: [{ type: "text", text: nextInput }],
        });
        requestAnimationFrame(() => scrollToBottom(true));
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, scrollToBottom, sendMessage],
  );

  // Get the conversation starter from URL params
  const starter = searchParams.get("starter");
  const topic = searchParams.get("topic");

  // Auto-send the conversation starter when the conversation is still empty.
  useEffect(() => {
    if (!starter || messages.length !== 0 || isLoading) {
      return;
    }
    if (processedStarterRef.current === starter) {
      return;
    }

    processedStarterRef.current = starter;
    void submitMessage(starter);
  }, [isLoading, messages.length, starter, submitMessage]);

  // Scroll to bottom when loading state changes (response received)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [isLoading, scrollToBottom, messages.length]);

  return (
    <>
      {/* Header */}
      {/* <section className="sticky top-0 shadow-xs w-full z-5 pt-20 pb-3 bg-white">
        <Container size="xs" className="">
          <div className="flex items-center gap-4">
            <Link href="/chat" className="">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <TextComponent className="text-sm">
                {topic
                  ? `Talking about: ${topic}`
                  : "Chat with Amy about anything on the WatchTower"}
              </TextComponent>
            </div>
          </div>
        </Container>
      </section> */}

      <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
          <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
          <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
        </div>
        {/* The site header is suppressed on this route, so the conversation
            owns the full viewport and this slim bar carries the way back. */}
        {/* The scroller spans the full width so its scrollbar rides the edge of
            the screen rather than cutting down the middle of the thread; the
            column width is applied to the content inside it instead. */}
        <div className="relative flex h-[calc(100dvh/var(--viewport-scale))] flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
            <div className="mx-auto max-w-3xl px-6 pt-4">
              <Link
                href="/chat"
                aria-label="Back to chat"
                title="Back to chat"
                className="pointer-events-auto flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/80 text-dark backdrop-blur transition-colors hover:bg-dark/5"
              >
                <ArrowLeft className="size-5" />
              </Link>
            </div>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto chat-scrollbar">
            <div className="mx-auto max-w-3xl px-6 pt-16 pb-6">
              <div className="space-y-6">
                {/* {messages.length === 0 && starter && (
                  <div className="flex justify-center">
                    <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                      Starting conversation: "{starter}"
                    </div>
                  </div>
                )} */}

                {/* {messages.length === 0 && !starter && (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Try saying something like:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="bg-blue-50 rounded-lg p-3 text-blue-800">
                        "My favorite food is pizza" (to add knowledge)
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-green-800">
                        "What is my favorite food?" (to search)
                      </div>
                    </div>
                  </div>
                )} */}

                {messages.map((message) => (
                  <div key={message.id} className="mb-6">
                    <div
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl text-dark",
                          message.role === "user"
                            ? "bg-muted/10 px-4 py-3"
                            : "bg-transparent py-1",
                        )}
                      >
                        {/* <div className="font-medium text-xs mb-2 opacity-75">
                        {message.role === "user" ? "" : ""}
                      </div> */}
                        {message.parts.map((part, i) => {
                          switch (part.type) {
                            case "text":
                              return (
                                // No typography plugin, so sizes are set per
                                // element: text-sm body, like the composer.
                                <div
                                  key={`${message.id}-${i}`}
                                  className="text-sm"
                                >
                                  <ReactMarkdown
                                    components={{
                                      h1: ({ children }) => (
                                        <h1 className="text-lg font-semibold mt-4 mb-2">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-base font-semibold mt-4 mb-2">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-sm font-semibold mt-3 mb-2">
                                          {children}
                                        </h3>
                                      ),
                                      p: ({ children }) => (
                                        <p className="leading-relaxed ">
                                          {children}
                                        </p>
                                      ),
                                      code: ({ children }) => (
                                        <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">
                                          {children}
                                        </code>
                                      ),
                                      pre: ({ children }) => (
                                        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs my-4">
                                          {children}
                                        </pre>
                                      ),
                                      a: ({ href, children }) => (
                                        <a
                                          href={href}
                                          className="text-blue-600 hover:underline"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          {children}
                                        </a>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="list-disc pl-6 mb-3">
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal pl-6 mb-3">
                                          {children}
                                        </ol>
                                      ),
                                      li: ({ children }) => (
                                        <li className="mb-1">{children}</li>
                                      ),
                                      strong: ({ children }) => (
                                        <strong className="font-semibold">
                                          {children}
                                        </strong>
                                      ),
                                      em: ({ children }) => (
                                        <em className="italic">{children}</em>
                                      ),
                                      blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                                          {children}
                                        </blockquote>
                                      ),
                                    }}
                                  >
                                    {part.text}
                                  </ReactMarkdown>
                                </div>
                              );
                            case "tool-addResource":
                            case "tool-getInformation":
                              // Don't show tool usage to users - hide these parts
                              return null;
                            default:
                              return null;
                          }
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {isLoading && <ChatStatus messages={messages} />}

              {/* Invisible element to scroll to */}
              <div ref={bottomRef} className="h-1" />
            </div>
          </div>

        {/* Scroll to bottom button - only show when there are messages */}
        {/* {messages.length > 0 && (
          <div className="absolute bottom-20 right-8">
            <Button
              onClick={() => scrollToBottom(true)}
              size="sm"
              variant="outline"
              className="rounded-full bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )} */}

          <div className="mx-auto w-full max-w-3xl shrink-0 px-6 pt-3 pb-6">
          <ChatComposer
            onSubmit={(question) => void submitMessage(question)}
            disabled={isLoading}
            showStarters={false}
          />
          </div>
        </div>
      </section>
    </>
  );
}

export default function Chat() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading conversation...</div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
