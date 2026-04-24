"use server";

import { createAuthUseCases } from "@/features/auth";

const authUseCases = createAuthUseCases();

export const SendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) => {
  try {
    return await authUseCases.sendEmail.execute({ to, subject, text, html });
  } catch (error) {
    console.error("An exception occured while sending the email: " + error);
    throw error;
  } finally {
    console.log("Finished sending email");
  }
};
