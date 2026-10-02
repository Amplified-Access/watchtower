import type { Rule } from "sanity";
import { BASE_LANGUAGE } from "../languages";

type LocalizedItem = { language?: string; value?: unknown };

const hasValue = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== "";

// Translatable fields are internationalized arrays: one `{language, value}`
// item per language. The site falls back to English for any language that is
// missing, so English is the one value that must always be there.
export const requireBaseLanguage = (rule: Rule) =>
  rule.custom((items?: LocalizedItem[]) =>
    items?.some((item) => item.language === BASE_LANGUAGE && hasValue(item.value))
      ? true
      : `An English (${BASE_LANGUAGE}) version is required: it is shown in every language without a translation.`,
  );

// A warning (not an error) when any language's value is longer than search
// results show: Google cuts titles at about 60 characters and descriptions at
// about 160, so the end of a longer one is lost.
export const warnLongerThan = (max: number) => (rule: Rule) =>
  rule
    .custom((items?: LocalizedItem[]) => {
      const long = (items ?? []).filter((item) => typeof item.value === "string" && item.value.length > max);
      return long.length === 0
        ? true
        : `Longer than ${max} characters in ${long.map((item) => item.language).join(", ")}: search results may cut it off.`;
    })
    .warning();

// The English value of an internationalized array, for previews and slugs.
export const baseValue = (items?: LocalizedItem[]) => {
  const value = items?.find((item) => item.language === BASE_LANGUAGE)?.value;
  return typeof value === "string" ? value : undefined;
};
