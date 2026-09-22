import type { Metadata } from "next";
import "./globals.css";
// Epilogue is declared in globals.css (with corrected vertical metrics).
import Providers from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

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
