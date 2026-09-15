"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReportReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: string;
  location?: string;
  description?: string;
  voiceNote?: string;
  evidence?: string;
}

// Read-only summary of what's been entered so far. Submitting still happens
// from the form itself, after the user closes this and confirms consent.
const ReportReviewDialog = ({
  open,
  onOpenChange,
  category,
  location,
  description,
  voiceNote,
  evidence,
}: ReportReviewDialogProps) => {
  const t = useTranslations("IncidentReporting");

  const rows = [
    { label: t("categoryLabel"), value: category },
    { label: t("locationLabel"), value: location },
    { label: t("descriptionLabel"), value: description },
    { label: t("voiceNote"), value: voiceNote },
    { label: t("evidenceLabel"), value: evidence },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-title text-2xl font-medium">{t("reviewTitle")}</DialogTitle>
          <DialogDescription>{t("reviewDescription")}</DialogDescription>
        </DialogHeader>
        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="font-title text-sm font-medium text-dark">{row.label}</dt>
              <dd className="text-sm break-words whitespace-pre-line text-dark/70">
                {row.value?.trim() ? row.value : (
                  <span className="italic text-dark/40">{t("notProvided")}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportReviewDialog;
