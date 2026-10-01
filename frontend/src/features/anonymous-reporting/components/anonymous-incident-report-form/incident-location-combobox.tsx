"use client";

import { useTranslations } from "next-intl";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PlaceSearchCombobox from "@/components/common/place-search-combobox";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import type { ReportFormValues } from "../../schemas/anonymous-incident-reproting-form-schema";
import { reportFieldClassName, reportLabelClassName } from "./field-styles";

// Where the incident happened, searched with Google Places.
const IncidentLocationCombobox = ({
  form,
}: {
  form: UseFormReturn<ReportFormValues>;
}) => {
  const t = useTranslations("IncidentReporting");

  return (
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem className="gap-2.5">
          <FormLabel className={reportLabelClassName}>{t("locationLabel")}</FormLabel>
          <FormControl>
            <PlaceSearchCombobox
              value={field.value}
              onChange={field.onChange}
              placeholder={t("locationPickerPlaceholder")}
              className={cn(reportFieldClassName, "[&_svg]:text-dark")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default IncidentLocationCombobox;
