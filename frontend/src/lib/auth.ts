import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schemas/auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { ac, roles } from "./permissions";
import { SendEmail } from "@/features/auth/server";
import { inviteEmail, passwordResetEmail } from "@/features/auth/templates/email-templates";

export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:3000",
    "https://www.thewatchtower.tech",
    "https://thewatchtower.tech",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }, request) => {
      const template = url.includes("invite=1")
        ? inviteEmail(url)
        : passwordResetEmail(url);
      await SendEmail({ to: user.email, ...template });
    },
    // onPasswordReset: async ({ user }, request) => {
    //   // your logic here
    //   console.log(`Password for user ${user.email} has been reset.`);
    // },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  session: {
    updateAge: 24 * 60 * 60, // 24 hours
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  plugins: [
    adminPlugin({
      ac,
      roles,
      adminRoles: ["admin", "super-admin"], // Specify which roles are considered admins
      adminUserIds: [
        "4SXvXDGmZ2Eyp5VymqJCygMN4tsYv8wr",
        "bGjHsWSQbnpie1BKObdAOspWjbHabJQH",
      ],
    }),
  ],
});
