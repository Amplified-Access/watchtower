import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Too many instances to fix at once — address incrementally
      "@typescript-eslint/no-explicit-any": "warn",
      // JSX text escaping — cosmetic, doesn't affect behaviour
      "react/no-unescaped-entities": "warn",
      // New React 19 strict rules; existing code needs migration
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  {
    // The Go backend is the source of truth for data: new code reaches the
    // database, R2 and SNS through it (lib/api/ + tRPC), never directly.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/db", "@/db/*", "**/db", "**/db/*", "drizzle-orm", "drizzle-orm/*", "@neondatabase/*"],
              message: "Read and write data through the Go backend (lib/api/ via tRPC), not the database.",
            },
            {
              group: ["@aws-sdk/*", "@/lib/aws/*"],
              message: "Storage and notifications belong in the Go backend.",
            },
          ],
        },
      ],
    },
  },
  {
    // Still bypassing the backend. Each entry should disappear as its path
    // moves behind Go (auth, chat retrieval, uploads/downloads, SNS). Don't add to it.
    files: [
      "src/db/**",
      "src/lib/auth.ts",
      "src/lib/actions/resources.ts",
      "src/lib/ai/embeddings.ts",
      "src/lib/aws/**",
      "src/app/api/file-upload/route.ts",
      "src/app/api/file-download/route.ts",
      "src/app/api/sns/publish/route.ts",
      "src/features/notifications/infrastructure/publishers/sns-notification-publisher.ts",
      "src/features/super-admin/server/index.ts",
    ],
    rules: { "no-restricted-imports": "off" },
  },
];
