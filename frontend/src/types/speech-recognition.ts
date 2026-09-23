/**
 * The Web Speech API's recognition half, which TypeScript's DOM library does
 * not declare. Only the parts the chat dictation button uses are typed here.
 */

export interface SpeechRecognitionAlternative {
  transcript: string;
}

export interface SpeechRecognitionResultList {
  length: number;
  [index: number]: { [index: number]: SpeechRecognitionAlternative };
}

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent {
  /** "not-allowed", "aborted", "no-speech", … */
  error: string;
}

export interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

/** Chrome and Safari expose it under a prefix; Firefox not at all. */
export function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
