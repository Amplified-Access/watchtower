"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, Suspense, useRef } from "react";
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
import ReactMarkdown from "react-markdown";
import Loader from "@/components/ai/chat/loader";
import { toast } from "sonner";

// Custom hook for smooth auto-scrolling chat to bottom
function useChatScroll(messages: any[]) {
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
  const [processedStarter, setProcessedStarter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearchingKnowledge, setIsSearchingKnowledge] =
    useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const { messages, sendMessage } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
    onFinish: (message) => {
      console.log("Chat finished:", message);
    },
  });
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const { ref: chatRef, bottomRef, scrollToBottom } = useChatScroll(messages);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const initRecognition = () => {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = "en-US";
          recognitionRef.current.maxAlternatives = 1;

          recognitionRef.current.onresult = (event: any) => {
            const results = event.results;
            const transcript = results[results.length - 1][0].transcript;

            setInput((prev) => prev + transcript + " ");
          };

          recognitionRef.current.onerror = (event: any) => {
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
      } catch (error: any) {
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

  // Auto-send the conversation starter when component mounts (form-based approach)
  useEffect(() => {
    console.log("Conversation starter effect:", {
      starter,
      processedStarter,
      messagesLength: messages.length,
    });

    if (starter && starter !== processedStarter && messages.length === 0) {
      console.log("Starting conversation with:", starter);
      setProcessedStarter(starter);
      setInput(starter);
      setTimeout(() => {
        console.log("Attempting to submit form...", formRef.current);
        if (formRef.current) {
          formRef.current.requestSubmit();
        } else {
          console.error("Form ref is null");
        }
      }, 100); // Increased timeout to ensure form is rendered
    }
  }, [starter, processedStarter, messages.length]);

  // Scroll to bottom when loading state changes (response received)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => scrollToBottom(true), 100);
    }
  }, [isLoading, scrollToBottom, messages.length]);

  // Check if AI is currently using knowledge base tools
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        const hasKnowledgeTools = lastMessage.parts.some(
          (part) =>
            part.type === "tool-addResource" ||
            part.type === "tool-getInformation",
        );
        setIsSearchingKnowledge(hasKnowledgeTools && isLoading);
      } else {
        setIsSearchingKnowledge(false);
      }
    } else {
      setIsSearchingKnowledge(false);
    }
  }, [messages, isLoading]);

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

      <div className="mt-16">
        <div className="flex flex-col justify-between h-[calc(100dvh-130px)] relative">
          <div ref={chatRef} className="flex-1 overflow-y-auto chat-scrollbar">
            <div className="mx-auto max-w-4xl px-4 py-6">
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
                        className={`max-w-[80%] rounded-xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-white text-dark border"
                            : "bg-gray-100 text-gray-900"
                        }`}
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

        <div className="mx-auto max-w-4xl px-4 sticky bottom-6 md:bottom-4 ">
          <form
            ref={formRef}
            onSubmit={async (e) => {
              e.preventDefault();
              console.log("Form submitted with input:", input);

              if (!input.trim()) {
                console.log("Empty input, not submitting");
                return;
              }

              // Stop listening when submitting
              shouldListenRef.current = false;
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                } catch (e) {
                  // Ignore
                }
              }
              setIsListening(false);

              const currentInput = input;
              setInput("");
              setIsLoading(true);

              try {
                console.log("Sending message:", currentInput);
                await sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: currentInput }],
                });
                // Scroll to bottom after message is sent
                setTimeout(() => scrollToBottom(true), 150);
              } catch (error) {
                console.error("Error sending message:", error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex space-x-2 px-2"
          >
            <div className="relative w-full rounded-full">
              <Button
                type="button"
                variant={"ghost"}
                className="absolute bottom-1/2 translate-y-1/2 left-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // Media attachment functionality to be implemented later
                  console.log("Media attachment clicked");
                }}
                disabled={isLoading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Textarea
                value={input}
                placeholder="Ask me about WatchTower"
                onChange={(e) => {
                  setInput(e.currentTarget.value);
                  // Stop listening if user starts typing
                  if (isListening) {
                    shouldListenRef.current = false;
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.stop();
                      } catch (e) {
                        // Ignore
                      }
                    }
                    setIsListening(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    // Stop listening before sending
                    if (isListening) {
                      shouldListenRef.current = false;
                      if (recognitionRef.current) {
                        try {
                          recognitionRef.current.stop();
                        } catch (e) {
                          // Ignore
                        }
                      }
                      setIsListening(false);
                    }
                    if (input.trim() && !isLoading) {
                      formRef.current?.requestSubmit();
                    }
                  }
                }}
                disabled={isLoading}
                className="flex-1 bg-white resize-none min-h-14 rounded-lg py-4 font-medium px-12 pe-14"
              />
              {input.trim() ? (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary text-white absolute right-3 rounded-sm bottom-2.5"
                  size={"icon"}
                >
                  <MoveUp />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={"ghost"}
                  className={`absolute right-3 bottom-2.5 text-muted-foreground hover:text-foreground ${
                    isListening ? "text-red-500 animate-pulse" : ""
                  }`}
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
          </form>
        </div>
      </div>
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
