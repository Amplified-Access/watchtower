import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@opentelemetry/instrumentation",
    "import-in-the-middle",
    "require-in-the-middle",
  ],
};

const withNextIntl = createNextIntlPlugin();

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "amplified-access",
  project: "watchtower-frontend",
  silent: !process.env.CI,
});
