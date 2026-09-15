"use client";

import { useEffect } from "react";
import { AlertCircleIcon, PaperclipIcon, UploadIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";

export interface EvidenceFile {
  file: File;
  id: string;
}

interface EvidenceUploadProps {
  file: EvidenceFile | null;
  setFile: (file: EvidenceFile | null) => void;
}

const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;

export default function EvidenceUpload({ file, setFile }: EvidenceUploadProps) {
  const t = useTranslations("IncidentReporting");

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    maxSize: MAX_EVIDENCE_SIZE,
    accept: "image/*,video/*,audio/*,.pdf,.doc,.docx",
  });

  useEffect(() => {
    const first = files[0];
    setFile(first && first.file instanceof File ? { file: first.file, id: first.id } : null);
  }, [files, setFile]);

  return (
    <div className="flex flex-col gap-2">
      {!file && (
        <div
          role="button"
          tabIndex={0}
          onClick={openFileDialog}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openFileDialog();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-md border border-input bg-white p-4 text-center transition-colors outline-none hover:bg-dark/2 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5"
        >
          <input {...getInputProps()} className="sr-only" aria-label={t("uploadEvidenceLabel")} />
          <UploadIcon className="size-5 text-dark" aria-hidden />
          <p className="font-title text-sm text-dark md:text-base">
            {t("dropzoneText", { maxSize: formatBytes(MAX_EVIDENCE_SIZE) })}
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-destructive" role="alert">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-white px-4 py-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <PaperclipIcon className="size-4 shrink-0 opacity-60" aria-hidden />
            <div className="min-w-0">
              <p className="truncate font-title text-sm text-dark">{file.file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.file.size)}</p>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="-me-2 size-8 text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
            onClick={() => removeFile(file.id)}
            aria-label={t("removeFile")}
          >
            <XIcon className="size-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
