import type { Metadata, Viewport } from "next";
import "./globals.css";
// Epilogue is declared in globals.css (with corrected vertical metrics).
import Providers from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getSeoSettings } from "@/lib/sanity/content";
import { SHARE_IMAGE_SIZE } from "@/lib/sanity/image";
import { siteShareImage } from "@/lib/seo/page";
import { isIndexable, ogLocale, PUBLISHER, SITE } from "@/lib/seo/site";

// The defaults every page starts from. Public pages replace the title,
// description, canonical URL and share cards with their own (lib/seo); the
// dashboards and forms that don't keep these. The description and share
// image are editable in the Studio ("Search and sharing").
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const [settings, image] = await Promise.all([getSeoSettings(locale), siteShareImage(locale)]);
  const description = settings.description || SITE.description;
  const images = [{ url: image ?? SITE.image, ...SHARE_IMAGE_SIZE, alt: SITE.name }];
  return {
    metadataBase: new URL(SITE.url),
    title: { default: SITE.title, template: `%s | ${SITE.name}` },
    description,
    applicationName: SITE.name,
    authors: [{ name: PUBLISHER.name, url: PUBLISHER.url }],
    creator: PUBLISHER.name,
    publisher: PUBLISHER.name,
    // Only production is indexed: staging and previews would compete with it.
    robots: isIndexable()
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
        }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: SITE.title,
      description,
      locale: ogLocale(locale),
      images,
    },
    twitter: { card: "summary_large_image", title: SITE.title, description, images: images.map((i) => i.url) },
  };
}

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased font-body text-dark bg-background">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            {/* <Chat /> */}
            <Analytics />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
