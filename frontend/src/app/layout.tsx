import type { Metadata } from "next";
import "./globals.css";
import "@fontsource-variable/epilogue";
import Providers from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "WatchTower",
  description: "Localizing Tech to build resilient communities",
  icons: {
    icon: [
      { url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
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
