// Relative, not "@/…": the Sanity CLI loads this file too, without the
// tsconfig path aliases.
import { defaultLocale, locales, type Locale } from "../i18n/locales";

// The languages editors can write content in: every locale the site serves.
// English (the default locale) is the base language: every translatable field
// requires it, and the site falls back to it field by field when a
// translation is missing.
export const BASE_LANGUAGE = defaultLocale;

// Names as editors read them in the Studio (in English, unlike the site's
// language picker, which shows each language in itself).
const TITLES: Record<Locale, string> = {
  en: "English",
  fr: "French",
  sw: "Swahili",
  lg: "Luganda",
  rw: "Kinyarwanda",
  am: "Amharic",
  pa: "Punjabi",
  ur: "Urdu",
  ki: "Kikuyu",
  suk: "Sukuma",
  luo: "Luo",
  om: "Oromo",
  din: "Dinka",
};

export const LANGUAGES = locales.map((id) => ({ id, title: TITLES[id] }));
