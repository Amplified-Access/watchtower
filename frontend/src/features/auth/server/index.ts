"use server";

import { createAuthUseCases } from "@/features/auth";

const authUseCases = createAuthUseCases();

export const SendTestEmail = async () => {
  try {
    return await authUseCases.sendTestEmail.execute();
  } catch (error) {
    console.error("An exception occured while sending the email: " + error);
    throw error;
  } finally {
    console.log("Finished executing send");
  }
};

export const SendEmail = async ({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) => {
  try {
    return await authUseCases.sendEmail.execute({
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("An exception occured while sending the email: " + error);
    throw error;
  } finally {
    console.log("Finished sending email");
  }
};
