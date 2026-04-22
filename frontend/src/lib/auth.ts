import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schemas/auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { ac, roles } from "./permissions";
import { SendEmail } from "@/features/auth/server";

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
    sendResetPassword: async ({ user, url, token }, request) => {
      await SendEmail({
        to: user.email,
        subject: "Set password",
        text: `Click the link to give your new account a password: ${url}`,
      });
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
