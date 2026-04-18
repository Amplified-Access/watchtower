import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

// Define all supported locales
export const locales = [
  "en",
  "sw",
  "lg",
  "rw",
  "am",
  "pa",
  "ur",
  "ki",
  "suk",
] as const;
export const defaultLocale = "en";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value;

  // Validate that the locale is supported, fallback to default if not
  const locale =
    cookieLocale && locales.includes(cookieLocale as any)
      ? cookieLocale
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
