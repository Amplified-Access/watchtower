"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/common/loader";
import LanguageSelector from "@/components/common/language-selector";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  formSchema,
  type ReportFormValues,
} from "../../schemas/anonymous-incident-reproting-form-schema";
import { formatRecordingTime, useVoiceRecorder } from "../../hooks/use-voice-recorder";
import IncidentTypeCombobox from "./incident-type-combobox";
import IncidentLocationCombobox from "./incident-location-combobox";
import EvidenceUpload, { type EvidenceFile } from "./evidence-upload";
import VoiceReportRecorder from "./voice-report-recorder";
import ReportReviewDialog from "./report-review-dialog";
import { reportFieldClassName, reportLabelClassName } from "./field-styles";

const AnonymousIncidentReportForm = () => {
  const t = useTranslations("IncidentReporting");

  // Consent lives here rather than in the shared schema so its message can be
  // translated.
  const schema = useMemo(
    () =>
      formSchema.extend({
        consent: z.boolean().refine((value) => value, t("consentRequired")),
      }),
    [t],
  );

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "",
      location: {
        place_id: "",
        licence: "",
        osm_type: "",
        osm_id: "",
        boundingbox: [],
        lat: "",
        lon: "",
        display_name: "",
      },
      description: "",
      // Entities and casualty counts aren't asked for in the redesigned form.
      entities: [],
      injuries: "0",
      fatalities: "0",
      consent: false,
    },
  });

  const recorder = useVoiceRecorder({
    onMicrophoneError: () => toast.error(t("microphoneError")),
  });

  const [evidenceFile, setEvidenceFile] = useState<EvidenceFile | null>(null);
  // Bumped after a successful submit to remount (and clear) EvidenceUpload,
  // which keeps its own file list.
  const [evidenceUploadKey, setEvidenceUploadKey] = useState(0);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: categoriesData } = trpc.anonymousReports.getAllIncidentTypes.useQuery();
  const submitMutation = trpc.anonymousReports.submitAmonymousIncidentReport.useMutation();

  const uploadFile = async (file: File, failedMessage: string, errorMessage: string) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/file-upload", { method: "POST", body: formData });
      if (!response.ok) {
        toast.error(failedMessage);
        return undefined;
      }
      const body: { fileKey?: string } = await response.json();
      return body.fileKey ?? undefined;
    } catch {
      toast.error(errorMessage);
      return undefined;
    }
  };

  // The router takes counts as numbers; the select stores "0".."5" and "6+".
  const toCount = (value: string) => (value === "6+" ? 6 : Number(value));

  async function onSubmit(values: ReportFormValues) {
    const evidenceFileKey = evidenceFile
      ? await uploadFile(evidenceFile.file, t("evidenceUploadFailed"), t("evidenceUploadError"))
      : undefined;
    const audioFileKey = recorder.audioBlob
      ? await uploadFile(
          new File([recorder.audioBlob], "voice-note.webm", { type: "audio/webm" }),
          t("audioUploadFailed"),
          t("audioUploadError"),
        )
      : undefined;

    try {
      await submitMutation.mutateAsync({
        incidentTypeId: values.category,
        location: {
          latitude: Number(values.location.lat),
          longitude: Number(values.location.lon),
          address: values.location.display_name,
          country: values.location.display_name?.split(",").pop()?.trim(),
        },
        description: values.description,
        entities: values.entities,
        injuries: toCount(values.injuries),
        fatalities: toCount(values.fatalities),
        evidenceFileKey,
        audioFileKey,
      });
    } catch {
      toast.error(t("submitError"));
      return;
    }

    toast.success(t("reportSuccess"));
    form.reset();
    setEvidenceFile(null);
    setEvidenceUploadKey((key) => key + 1);
    recorder.discard();
  }

  const watched = useWatch({ control: form.control });
  const categoryName = categoriesData?.data?.find((c) => c.id === watched.category)?.name;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <div className="flex items-center gap-6">
          <span className={reportLabelClassName}>{t("chooseLanguage")}</span>
          <LanguageSelector
            variant="compact"
            className="h-9 gap-1.5 rounded-sm border-border bg-white px-2 text-dark shadow-none hover:bg-dark/5 [&_span]:text-sm"
          />
        </div>

        <IncidentTypeCombobox form={form} />
        <IncidentLocationCombobox form={form} />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="gap-2.5">
              <FormLabel className={reportLabelClassName}>{t("descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPrompt")}
                  className={cn(reportFieldClassName, "h-24 resize-y py-3 placeholder:text-dark/70")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <VoiceReportRecorder recorder={recorder} />

        <div className="flex flex-col gap-2.5">
          <div>
            <p className={reportLabelClassName}>{t("evidenceLabel")}</p>
            <p className="mt-1 text-sm text-dark/40">{t("evidenceFilesDescription")}</p>
          </div>
          <EvidenceUpload key={evidenceUploadKey} file={evidenceFile} setFile={setEvidenceFile} />
        </div>

        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="gap-2">
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="mt-0.5 size-4.5"
                  />
                </FormControl>
                <FormLabel className="block font-title text-sm font-normal leading-snug text-dark">
                  {t("consentText")}{" "}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t("privacyPolicy")}
                  </Link>
                  .
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="mt-4 h-12 w-full rounded-full font-title text-base"
        >
          {form.formState.isSubmitting ? (
            <Loader />
          ) : (
            <>
              {t("submitReport")}
              <ArrowRight />
            </>
          )}
        </Button>

        <p className="font-title text-base text-dark">
          {t.rich("reviewPrompt", {
            review: (chunks) => (
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </button>
            ),
          })}
        </p>

        <ReportReviewDialog
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          category={categoryName}
          location={watched.location?.display_name}
          description={watched.description}
          voiceNote={
            recorder.audioBlob
              ? t("voiceNoteRecorded", { duration: formatRecordingTime(recorder.duration) })
              : undefined
          }
          evidence={evidenceFile?.file.name}
        />
      </form>
    </Form>
  );
};

export default AnonymousIncidentReportForm;
