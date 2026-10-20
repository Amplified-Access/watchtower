import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./locales";

export { defaultLocale, locales };

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("locale")?.value;

  // Validate that the locale is supported, fallback to default if not
  const locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? cookieLocale
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
