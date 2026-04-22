"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
  casualtyOptions,
} from "../../schemas/anonymous-incident-reproting-form-schema";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect, useTransition } from "react";
import { toast } from "sonner";
import Loader from "@/components/common/loader";
import IncidentTypeCombobox from "./incident-type-combobox";
import IncidentLocationCombobox from "./incident-location-combobox";
import { MultiSelect } from "@/components/ui/muliple-select";
import { trpc } from "@/_trpc/client";
import { Mic, Square, Play, Trash2, Pause, Globe, Check } from "lucide-react";
import EvidenceUpload from "./evidence-upload";
import { setLocaleCookie } from "@/lib/actions/set-locale";
import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const AnonymousIncidentReportForm = () => {
  const t = useTranslations("IncidentReporting");

  // Get incident categories for enhanced logging
  const incidentCategories =
    trpc.anonymousReports.getAllIncidentTypes.useQuery();
  const categories = incidentCategories.data?.data || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
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
      entities: [],
      injuries: "0",
      fatalities: "0",
    },
  });

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Evidence file upload state
  const [evidenceFile, setEvidenceFile] = useState<{
    file: File;
    id: string;
  } | null>(null);

  // Language selector state
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState("en");
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
    { code: "lg", name: "Luganda", flag: "🇺🇬" },
    { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
    { code: "am", name: "አማርኛ", flag: "🇪🇹" },
    { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
    { code: "ur", name: "اردو", flag: "🇵🇰" },
    { code: "ki", name: "Kikuyu", flag: "🇰🇪" },
    { code: "suk", name: "Sukuma", flag: "🇹🇿" },
  ];

  useEffect(() => {
    const getCurrentLocale = () => {
      if (typeof document === "undefined") return "en";
      const match = document.cookie.match(/locale=([^;]+)/);
      return match ? match[1] : "en";
    };
    setCurrentLocale(getCurrentLocale());
  }, []);

  const handleLocaleChange = async (newLocale: string) => {
    if (newLocale === currentLocale) {
      setLanguagePopoverOpen(false);
      return;
    }

    startTransition(async () => {
      await setLocaleCookie(newLocale);
      setCurrentLocale(newLocale);
      setLanguagePopoverOpen(false);
      window.location.reload();
    });
  };

  const submitMutation =
    trpc.anonymousReports.submitAmonymousIncidentReport.useMutation();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start recording voice note
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      toast.success(t("recordingStarted"));
    } catch (error) {
      toast.error(t("microphoneError"));
      console.error("Error accessing microphone:", error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast.success(t("recordingStopped"));
    }
  };

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    toast.success(t("recordingDeleted"));
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Upload evidence file to CloudFlare
  const uploadEvidenceFile = async (file: File | undefined) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/file-upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        return response.json();
      } else {
        toast.error(t("evidenceUploadFailed"));
        return null;
      }
    } catch (error) {
      toast.error(t("evidenceUploadError"));
      return null;
    }
  };

  // Upload audio file to CloudFlare
  const uploadAudioFile = async (blob: Blob | null) => {
    if (!blob) return null;

    const audioFile = new File([blob], "voice-note.webm", {
      type: "audio/webm",
    });

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await fetch("/api/file-upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        return response.json();
      } else {
        toast.error(t("audioUploadFailed"));
        return null;
      }
    } catch (error) {
      toast.error(t("audioUploadError"));
      return null;
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Get category name from ID for enhanced logging
    const selectedCategory = categories.find(
      (cat) => cat.id === values.category,
    );

    // Upload evidence file if provided
    let evidenceFileKey = null;
    if (evidenceFile?.file) {
      const fileResponse = await uploadEvidenceFile(evidenceFile.file);
      if (fileResponse?.fileKey) {
        evidenceFileKey = fileResponse.fileKey;
      }
    }

    // Upload audio file if provided
    let audioFileKey = null;
    if (audioBlob) {
      const audioResponse = await uploadAudioFile(audioBlob);
      if (audioResponse?.fileKey) {
        audioFileKey = audioResponse.fileKey;
      }
    }

    // Prepare the submission data with enhanced details
    const submissionData = {
      ...values,
      incidentTypeId: values.category,
      location: {
        latitude: Number(values.location.lat),
        longitude: Number(values.location.lon),
        address: values.location.display_name,
        country: values.location.display_name?.split(",").pop()?.trim(),
      },




      evidenceFileKey,
      audioFileKey,
      categoryDetails: {
        id: values.category,
        name: selectedCategory?.name || "Unknown",
        description: selectedCategory?.description || "Unknown",
      },
      locationDetails: {
        coordinates: {
          lat: values.location.lat,
          lon: values.location.lon,
        },
        displayName: values.location.display_name,
        placeId: values.location.place_id,
      },
    };

    try {
      submitMutation.mutate(submissionData as any);
      submitMutation.isSuccess && toast.success(t("reportSuccess"));
    } catch (error) {
      toast.error(t("submitError"));
    }

    // Simulate a promise (e.g., API call)
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(submissionData);
      }, 1000);
    }).then((result) => {
      console.log("Promise resolved with:", result);
    });
    console.log("Form submission data:", submissionData);
    toast.success(t("reportSuccess"));
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 bg-white w-full max-w-xl md:max-w-none p-4 md:p-8 lg:p-10 rounded-xl mx-auto md:mx-0"
        >
          {/* Language Selector */}
          <div className="flex items-center justify-end border-b pb-6 mb-4">
            <Popover
              open={languagePopoverOpen}
              onOpenChange={setLanguagePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isPending}
                  className="h-9 w-9"
                  aria-label={t("formLanguage")}
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-50 p-2">
                <div className="space-y-1">
                  {languages.map((lang) => (
                    <Button
                      key={lang.code}
                      type="button"
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        currentLocale === lang.code && "bg-accent",
                      )}
                      onClick={() => handleLocaleChange(lang.code)}
                      disabled={isPending}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      <span className="flex-1 text-left">{lang.name}</span>
                      {currentLocale === lang.code && (
                        <Check className="h-4 w-4 ml-auto" />
                      )}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <IncidentTypeCombobox form={form} />
          <IncidentLocationCombobox form={form} />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("descriptionField")}</FormLabel>
                <FormControl>
                  <Textarea
                    className="h-32"
                    placeholder={t("descriptionPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("entities")}</FormLabel>
                <FormControl>
                  <MultiSelect
                    placeholder={t("entitiesPlaceholder")}
                    options={[
                      {
                        value: "law-enforcement",
                        label: t("entityLawEnforcement"),
                      },
                      {
                        value: "security-forces",
                        label: t("entitySecurityForces"),
                      },
                      {
                        value: "judicial-system",
                        label: t("entityJudicialSystem"),
                      },
                      {
                        value: "government-officials",
                        label: t("entityGovernmentOfficials"),
                      },
                      {
                        value: "victims-witnesses",
                        label: t("entityVictimsWitnesses"),
                      },
                      {
                        value: "journalists-media",
                        label: t("entityJournalistsMedia"),
                      },
                      {
                        value: "activists-protestors",
                        label: t("entityActivistsProtestors"),
                      },
                      {
                        value: "human-rights-organizations",
                        label: t("entityHumanRightsOrgs"),
                      },
                      {
                        value: "csos",
                        label: t("entityCSOs"),
                      },
                      {
                        value: "united-nations",
                        label: t("entityUnitedNations"),
                      },
                      {
                        value: "regional-bodies",
                        label: t("entityRegionalBodies"),
                      },
                      {
                        value: "foreign-governments",
                        label: t("entityForeignGovernments"),
                      },
                      {
                        value: "international-ngos",
                        label: t("entityInternationalNGOs"),
                      },
                      {
                        value: "private-security-firms",
                        label: t("entityPrivateSecurityFirms"),
                      },
                      {
                        value: "private-sector-corporations",
                        label: t("entityPrivateSectorCorporations"),
                      },
                      {
                        value: "legal-professionals",
                        label: t("entityLegalProfessionals"),
                      },
                      { value: "perpetrators", label: t("entityPerpetrators") },
                    ]}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4 w-full">
            <FormField
              control={form.control}
              name="injuries"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("injuries")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("selectInjuries")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {casualtyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option === "6+" ? t("moreThan5") : option}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fatalities"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("fatalities")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("selectFatalities")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {casualtyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option === "6+" ? t("moreThan5") : option}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Evidence Upload Section */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">{t("evidenceFiles")}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {t("evidenceFilesDescription")}
              </p>
            </div>
            <EvidenceUpload file={evidenceFile} setFile={setEvidenceFile} />
          </div>

          {/* Voice Recording Section */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">{t("voiceNote")}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {t("voiceNoteDescription")}
              </p>
            </div>

            {!audioBlob ? (
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startRecording}
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    {t("startRecording")}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={stopRecording}
                      className="flex items-center gap-2"
                    >
                      <Square className="h-4 w-4" />
                      {t("stopRecording")}
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="font-mono">
                        {formatTime(recordingDuration)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={togglePlayback}
                    className="h-8 w-8"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("voiceRecording")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("duration")}: {formatTime(recordingDuration)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={deleteRecording}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={startRecording}
                  className="w-full"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {t("recordAgain")}
                </Button>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">
            {submitMutation.isPending ? <Loader /> : t("submitReport")}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AnonymousIncidentReportForm;
