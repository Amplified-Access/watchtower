"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  getSpeechRecognition,
  type SpeechRecognition,
  type SpeechRecognitionErrorEvent,
  type SpeechRecognitionEvent,
} from "@/types/speech-recognition";
import { useState, useEffect, Suspense, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MutatingDots } from "react-loader-spinner";
import {
  MessageCircle,
  Brain,
  Database,
  Plus,
  ArrowLeft,
  MoveUp,
  ArrowDown,
  Mic,
  MicOff,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import Container from "@/components/common/container";
import TextComponent from "@/components/common/text-component";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Loader from "@/components/ai/chat/loader";
import { toast } from "sonner";

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
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
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

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  const submitMessage = useCallback(
    async (messageText: string) => {
      const nextInput = messageText.trim();
      if (!nextInput || isLoading) {
        return;
      }

      stopListening();
      setInput("");
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
    [isLoading, scrollToBottom, sendMessage, stopListening],
  );

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = getSpeechRecognition();

      if (SpeechRecognition) {
        const initRecognition = () => {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = "en-US";
          recognitionRef.current.maxAlternatives = 1;

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const results = event.results;
            const transcript = results[results.length - 1][0].transcript;

            setInput((prev) => prev + transcript + " ");
          };

          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.log("Speech recognition error:", event.error);

            if (event.error === "not-allowed") {
              shouldListenRef.current = false;
              setIsListening(false);
              toast.error(
                "Microphone access denied. Please allow microphone access.",
              );
            } else if (event.error === "aborted") {
              shouldListenRef.current = false;
              setIsListening(false);
            } else {
              console.log(
                `Speech error (${event.error}), will auto-restart if still listening`,
              );
            }
          };

          recognitionRef.current.onend = () => {
            if (shouldListenRef.current) {
              try {
                setTimeout(() => {
                  if (shouldListenRef.current && recognitionRef.current) {
                    recognitionRef.current.start();
                  }
                }, 100);
              } catch (error) {
                console.log("Could not restart recognition:", error);
                setIsListening(false);
                shouldListenRef.current = false;
              }
            } else {
              setIsListening(false);
            }
          };
        };

        initRecognition();
      }
    }

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      shouldListenRef.current = false;
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        toast.success("Voice dictation stopped");
      } catch (error) {
        console.log("Error stopping recognition:", error);
        setIsListening(false);
      }
    } else {
      shouldListenRef.current = true;
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening... Speak now");
      } catch (error) {
        console.log("Error starting recognition:", error);
        shouldListenRef.current = false;
        setIsListening(false);
        toast.error("Failed to start voice dictation. Please try again.");
      }
    }
  };

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

  // Check if AI is currently using knowledge base tools.
  const isSearchingKnowledge = useMemo(() => {
    if (!isLoading || messages.length === 0) {
      return false;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") {
      return false;
    }

    return lastMessage.parts.some(
      (part) =>
        part.type === "tool-addResource" || part.type === "tool-getInformation",
    );
  }, [isLoading, messages]);

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
                                <div
                                  key={`${message.id}-${i}`}
                                  className="prose prose-sm max-w-none"
                                >
                                  <ReactMarkdown
                                    components={{
                                      h1: ({ children }) => (
                                        <h1 className="text-2xl font-bold mt-4 mb-2">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-xl font-semibold mt-4 mb-2">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-lg font-semibold mt-3 mb-2">
                                          {children}
                                        </h3>
                                      ),
                                      p: ({ children }) => (
                                        <p className="leading-relaxed ">
                                          {children}
                                        </p>
                                      ),
                                      code: ({ children }) => (
                                        <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-sm">
                                          {children}
                                        </code>
                                      ),
                                      pre: ({ children }) => (
                                        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm my-4">
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

              {isLoading && (
                <div className="flex items-center py-4">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Loader />
                  </div>
                </div>
              )}

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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitMessage(input);
            }}
            className="w-full"
          >
            <div className="w-full rounded-lg border border-dark/5 bg-[#fafafa] p-3 shadow-[0_6px_24px_-8px_rgba(0,153,153,0.25)] md:p-4">
              <Textarea
                value={input}
                placeholder="Ask me about WatchTower"
                onChange={(e) => {
                  setInput(e.currentTarget.value);
                  // Stop listening if user starts typing
                  if (isListening) {
                    stopListening();
                  }
                }}
                onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    void submitMessage(input);
                  }
                }
                }}
                disabled={isLoading}
                className="min-h-12 resize-none border-none bg-transparent px-1 font-title text-base text-dark shadow-none placeholder:text-dark/70 focus-visible:ring-0 md:text-lg"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={"ghost"}
                  className="order-1 size-8 cursor-pointer text-dark hover:bg-dark/5"
                  onClick={() => {
                    // Media attachment functionality to be implemented later
                    console.log("Media attachment clicked");
                  }}
                  disabled={isLoading}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                </div>
              {input.trim() ? (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="size-10 cursor-pointer rounded-full bg-primary text-white hover:bg-primary/90"
                  size={"icon"}
                >
                  <MoveUp />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={"ghost"}
                  className={cn(
                    "size-10 cursor-pointer rounded-full text-white hover:bg-primary/90",
                    isListening ? "animate-pulse bg-red-500 hover:bg-red-600" : "bg-primary",
                  )}
                  size={"icon"}
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                  title={isListening ? "Stop dictation" : "Voice dictation"}
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              )}
              </div>
            </div>
          </form>
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
