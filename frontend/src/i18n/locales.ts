// Every locale the site serves. Kept apart from request.ts (which reads the
// request's cookies) so code outside a request, such as tests, can import
// the list.
export const locales = [
  "en",
  "fr",
  "sw",
  "lg",
  "rw",
  "am",
  "pa",
  "ur",
  "ki",
  "suk",
  "luo",
  "om",
  "din",
] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale = "en";
