import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const ginto = localFont({
  src: "./fonts/ginto-nord.woff2",
  display: "swap",
  variable: "--font-ginto",
});

const whitney = localFont({
  src: "./fonts/whitney.woff2",
  display: "swap",
  variable: "--font-whitney",
});

export const metadata: Metadata = {
  title: "WatchTower",
  description: "Localizing Tech to build resilient communities",
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
      <body
        className={`${whitney.variable} ${ginto.variable} antialiased font-body text-dark bg-background`}
      >
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
