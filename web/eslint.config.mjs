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
            {
              group: ["@/lib/auth", "better-auth", "better-auth/*"],
              message:
                "Accounts and sessions go through the Go backend. Importing Better Auth also opens its database connection at import, which crashes the importing route when DATABASE_URL isn't set.",
            },
          ],
        },
      ],
    },
  },
];
