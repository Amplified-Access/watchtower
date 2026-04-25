"use client";

import Container from "@/components/common/container";
import HeadingOne from "@/components/common/heading-one";
import TextComponent from "@/components/common/text-component";
import { Button } from "@/components/ui/button";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { Textarea } from "@/components/ui/textarea";
import { MoveUpRight, Mic, Plus, AudioLines, MicOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const Page = () => {
  const [customQuestion, setCustomQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false); // Track if we should be listening

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const initRecognition = () => {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false; // Changed to false for better stability
          recognitionRef.current.interimResults = false; // Changed to false to reduce network calls
          recognitionRef.current.lang = "en-US";
          recognitionRef.current.maxAlternatives = 1;

          recognitionRef.current.onresult = (event: any) => {
            const results = event.results;
            const transcript = results[results.length - 1][0].transcript;
            
            setCustomQuestion((prev) => prev + transcript + " ");
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
              // User manually stopped
              shouldListenRef.current = false;
              setIsListening(false);
            } else {
              // For network errors and others, just log - we'll auto-restart
              console.log(`Speech error (${event.error}), will auto-restart if still listening`);
            }
          };

          recognitionRef.current.onend = () => {
            // Auto-restart if we should still be listening
            if (shouldListenRef.current) {
              try {
                setTimeout(() => {
                  if (shouldListenRef.current && recognitionRef.current) {
                    recognitionRef.current.start();
                  }
                }, 100); // Small delay before restart
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

  const handleCustomChat = () => {
    if (customQuestion.trim()) {
      // Stop listening before navigating
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      setIsListening(false);
      const encodedQuestion = encodeURIComponent(customQuestion);
      router.push(`/chat/conversation?starter=${encodedQuestion}`);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      // Stop listening
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
      // Start listening
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

  const handleLiveConversation = () => {
    // Live conversation functionality to be implemented later
    console.log("Live conversation clicked");
  };

  const handleMediaAttachment = () => {
    // Media attachment functionality to be implemented later
    console.log("Media attachment clicked");
  };

  const handlePresetChat = (starter: string) => {
    const encodedStarter = encodeURIComponent(starter);
    router.push(`/chat/conversation?starter=${encodedStarter}`);
  };

  return (
    <>
      <section className="sticky top-0 shadow-xs w-full z-5 pt-20 pb-3 bg-white ">
        <Container size="xs" className="">
          <TextComponent className="text-sm ">
            Connect with Esi, our AI assistant, in your language, by text or
            voice to explore our platform, understand our data, and see how we
            can support your work.
          </TextComponent>
        </Container>
      </section>
      <section className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <Container>
          <div className="w-full max-w-2xl mx-auto ">
            {/* <HeadingOne className="text-center">Hello !</HeadingOne> */}
            <div className="flex justify-center items-center h-28">
              <ContainerTextFlip
                words={[
                  "Hello !", // English
                  "Habari ?", // Swahili
                  "Oli otya ?", // Luganda
                  "Selam", // Amharic
                  "Uraho?", // Kinyarwanda
                  "ਸਤ ਸ੍ਰੀ ਅਕਾਲ?", // Punjabi
                  "سلام!", // Urdu
                ]}
                className="mx-auto"
              />
            </div>
            <div className="relative">
              <Button
                size={"icon"}
                variant={"ghost"}
                className="absolute bottom-1/2 translate-y-1/2 left-2 text-muted-foreground hover:text-foreground"
                onClick={handleMediaAttachment}
                type="button"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Textarea
                placeholder="Ask me about WatchTower."
                className="bg-white px-12 pe-24 min-h-14 pt-4 rounded-xl resize-none shadow-none"
                value={customQuestion}
                onChange={(e) => {
                  setCustomQuestion(e.target.value);
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
                    handleCustomChat();
                  }
                }}
              />
              <Button
                size={"icon"}
                variant={"ghost"}
                className={`absolute -bottom-[8px] -translate-y-1/2 right-14 text-muted-foreground hover:text-foreground ${
                  isListening ? "text-red-500 animate-pulse" : ""
                }`}
                onClick={handleVoiceInput}
                type="button"
                title={isListening ? "Stop dictation" : "Voice dictation"}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              {customQuestion.trim() ? (
                <Button
                  size={"icon"}
                  className="absolute -bottom-[8px] -translate-y-1/2 right-4"
                  onClick={handleCustomChat}
                >
                  <MoveUpRight />
                </Button>
              ) : (
                <Button
                  size={"icon"}
                  className="absolute -bottom-[8px] -translate-y-1/2 right-4"
                  onClick={handleLiveConversation}
                  type="button"
                  title="Start live conversation"
                >
                  <AudioLines className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-6">
              {[
                {
                  label: "What is WatchTower",
                  starter: "What is WatchTower",
                },
                {
                  label: "Help me find something",
                  starter: "Help me find something",
                },
                {
                  label: "Explain something",
                  starter: "Explain something",
                },
              ].map(({ label, starter }) => (
                <Button
                  key={label}
                  variant="outline"
                  className={
                    "bg-white/50 py-2 px-4 rounded-md text-sm hover:bg-gray-50 transition-colors border-muted-foreground/20 text-muted-foreground hover:text-dark hover:border-dark/30 shadow-none"
                  }
                  onClick={() => handlePresetChat(starter)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};

export default Page;
