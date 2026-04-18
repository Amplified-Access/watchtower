"use server";

import { Resend } from "resend";

export const SendTestEmail = async () => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resend = new Resend(resendApiKey);
  try {
    const { data } = await resend.emails.send({
      from: "noble@amplifiedaccess.org",
      to: "gracenoble72@gmail.com",
      subject: "hello world",
      html: "<p>it works!</p>",
    });
    return data;
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
  const resendApiKey = process.env.RESEND_API_KEY;
  const resend = new Resend(resendApiKey);
  try {
    const { data } = await resend.emails.send({
      from: "no-reply@amplifiedaccess.org",
      to: to,
      subject: subject,
      text: text,
    });
    return data;
  } catch (error) {
    console.error("An exception occured while sending the email: " + error);
    throw error;
  } finally {
    console.log("Finished sending email");
  }
};
