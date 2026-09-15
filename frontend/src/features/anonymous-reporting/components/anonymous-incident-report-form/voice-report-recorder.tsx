"use client";

import { useTranslations } from "next-intl";
import { Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { formatRecordingTime, useVoiceRecorder } from "../../hooks/use-voice-recorder";
import { reportLabelClassName } from "./field-styles";

type VoiceRecorder = ReturnType<typeof useVoiceRecorder>;

// The "Prefer to speak?" block: a single black button that becomes a live
// recording bar, then a playback row once a note exists.
const VoiceReportRecorder = ({ recorder }: { recorder: VoiceRecorder }) => {
  const t = useTranslations("IncidentReporting");

  return (
    <div className="flex flex-col gap-2.5">
      <p className={reportLabelClassName}>{t("preferToSpeak")}</p>

      {recorder.isRecording ? (
        <button
          type="button"
          onClick={recorder.stop}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-md bg-red-600 font-title text-base text-white transition-colors hover:bg-red-700 md:text-lg"
        >
          <Square className="size-4 fill-current" />
          {t("stopRecording")}
          <span className="font-mono text-sm tabular-nums">
            {formatRecordingTime(recorder.duration)}
          </span>
        </button>
      ) : recorder.audioBlob ? (
        <div className="flex h-12 items-center gap-3 rounded-md border border-input bg-white px-2">
          <button
            type="button"
            onClick={recorder.togglePlayback}
            aria-label={recorder.isPlaying ? t("pauseVoiceNote") : t("playVoiceNote")}
            className="flex size-8 items-center justify-center rounded-full bg-dark text-white"
          >
            {recorder.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <p className="flex-1 font-title text-sm text-dark">
            {t("voiceNoteRecorded", { duration: formatRecordingTime(recorder.duration) })}
          </p>
          <button
            type="button"
            onClick={() => void recorder.start()}
            className="rounded-md px-2 py-1 font-title text-sm text-primary hover:bg-primary/5"
          >
            {t("recordAgain")}
          </button>
          <button
            type="button"
            onClick={recorder.discard}
            aria-label={t("removeFile")}
            className="flex size-8 items-center justify-center rounded-md text-dark/60 hover:text-dark"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void recorder.start()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-dark font-title text-base text-white transition-colors hover:bg-dark/90 md:text-lg"
        >
          <Mic className="size-5" />
          {t("recordVoiceReport")}
        </button>
      )}
    </div>
  );
};

export default VoiceReportRecorder;
