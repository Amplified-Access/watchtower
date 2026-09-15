"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API isn't in TypeScript's DOM lib, so the recognition object
// and its events are typed loosely here.
/* eslint-disable @typescript-eslint/no-explicit-any */
type SpeechRecognitionLike = any;

interface UseSpeechDictationOptions {
  /** BCP 47 tag passed to the recogniser, e.g. "sw-KE". */
  lang: string;
  onTranscript: (text: string) => void;
  onPermissionDenied?: () => void;
  onStartFailed?: () => void;
}

export const useSpeechDictation = ({
  lang,
  onTranscript,
  onPermissionDenied,
  onStartFailed,
}: UseSpeechDictationOptions) => {
  const recognitionRef = useRef<SpeechRecognitionLike>(null);
  const shouldListenRef = useRef(false);
  const [isListening, setIsListening] = useState(false);

  // Latest callbacks without re-creating the recogniser on every render.
  const callbacksRef = useRef({ onTranscript, onPermissionDenied, onStartFailed });
  useEffect(() => {
    callbacksRef.current = { onTranscript, onPermissionDenied, onStartFailed };
  });

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    // Non-continuous without interim results is more stable and makes fewer
    // network calls; onend restarts it while the user is still dictating.
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const results = event.results;
      callbacksRef.current.onTranscript(results[results.length - 1][0].transcript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
        callbacksRef.current.onPermissionDenied?.();
      } else if (event.error === "aborted") {
        shouldListenRef.current = false;
        setIsListening(false);
      }
      // Network and other transient errors fall through to onend's restart.
    };

    recognition.onend = () => {
      if (!shouldListenRef.current) {
        setIsListening(false);
        return;
      }
      setTimeout(() => {
        if (!shouldListenRef.current) return;
        try {
          recognition.start();
        } catch {
          shouldListenRef.current = false;
          setIsListening(false);
        }
      }, 100);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
    };
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped.
    }
  }, []);

  const start = useCallback((): "started" | "unsupported" | "failed" => {
    const recognition = recognitionRef.current;
    if (!recognition) return "unsupported";
    recognition.lang = lang;
    shouldListenRef.current = true;
    try {
      recognition.start();
      setIsListening(true);
      return "started";
    } catch {
      shouldListenRef.current = false;
      setIsListening(false);
      callbacksRef.current.onStartFailed?.();
      return "failed";
    }
  }, [lang]);

  // A language switch mid-dictation applies from the next automatic restart.
  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = lang;
  }, [lang]);

  return { isListening, start, stop };
};
