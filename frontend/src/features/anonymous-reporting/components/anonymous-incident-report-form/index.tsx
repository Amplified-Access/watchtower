"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/_trpc/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  descriptionSchema,
  emptyLocation,
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
import { uploadFile as uploadFileToStorage } from "@/utils/file-upload";

const AnonymousIncidentReportForm = () => {
  const t = useTranslations("IncidentReporting");

  const recorder = useVoiceRecorder({
    onMicrophoneError: () => toast.error(t("microphoneError")),
  });

  // A voice note can replace the written description (see descriptionSchema).
  const hasVoiceNote = recorder.audioBlob !== null;
  const schema = useMemo(
    () =>
      formSchema.extend({
        description: descriptionSchema({ hasVoiceNote, requiredMessage: t("descriptionOrVoiceNote") }),
      }),
    [hasVoiceNote, t],
  );

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "",
      location: emptyLocation,
      description: "",
      // Entities and casualty counts aren't asked for in the redesigned form.
      entities: [],
      injuries: "0",
      fatalities: "0",
    },
  });

  // After a failed submit, recording or discarding a voice note changes
  // whether the description is needed, so check it again.
  const { isSubmitted } = form.formState;
  useEffect(() => {
    if (isSubmitted) void form.trigger("description");
  }, [hasVoiceNote, isSubmitted, form]);

  const [evidenceFile, setEvidenceFile] = useState<EvidenceFile | null>(null);
  // Bumped after a successful submit to remount (and clear) EvidenceUpload,
  // which keeps its own file list.
  const [evidenceUploadKey, setEvidenceUploadKey] = useState(0);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: categoriesData } = trpc.anonymousReports.getAllIncidentTypes.useQuery();
  const submitMutation = trpc.anonymousReports.submitAmonymousIncidentReport.useMutation();

  const uploadFile = async (file: File, failedMessage: string, errorMessage: string) => {
    try {
      return await uploadFileToStorage(file);
    } catch (error) {
      toast.error(error instanceof TypeError ? errorMessage : failedMessage);
      return undefined;
    }
  };

  // The router takes counts as numbers; the select stores "0".."5" and "6+".
  const toCount = (value: string) => (value === "6+" ? 6 : Number(value));

  // Sends the report; true once it has been saved.
  async function sendReport(values: ReportFormValues): Promise<boolean> {
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
    // The voice note was the whole report and didn't upload; uploadFile has
    // already said so.
    if (!values.description && !audioFileKey) return false;

    try {
      await submitMutation.mutateAsync({
        incidentTypeId: values.category,
        location: {
          latitude: values.location.latitude,
          longitude: values.location.longitude,
          address: values.location.address,
          country: values.location.country ?? undefined,
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
      return false;
    }

    toast.success(t("reportSuccess"));
    return true;
  }

  // The form is cleared only once handleSubmit has finished: it marks the
  // form submitted after sendReport returns, so a reset inside sendReport
  // would be undone, and the effect above would then flag the emptied
  // description as missing.
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    let sent = false;
    await form.handleSubmit(async (values) => {
      sent = await sendReport(values);
    })(event);
    if (!sent) return;
    form.reset();
    setEvidenceFile(null);
    setEvidenceUploadKey((key) => key + 1);
    recorder.discard();
  };

  const watched = useWatch({ control: form.control });
  const categoryName = categoriesData?.data?.find((c) => c.id === watched.category)?.name;

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
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

        {/* Agreement is implied by submitting; there's no box to tick. */}
        <p className="font-title text-sm leading-snug text-dark/70">
          {t.rich("submitAgreement", {
            privacy: (chunks) => (
              <Link
                href="/privacy-policy"
                target="_blank"
                className="text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>

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
          location={watched.location?.label}
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
