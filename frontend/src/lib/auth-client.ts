import { createAuthClient } from "better-auth/react";
import { ac, roles } from "./permissions";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles,
    }),
  ],
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
});
