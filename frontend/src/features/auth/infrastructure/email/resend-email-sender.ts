import { Resend } from "resend";
import type { EmailSender, SendEmailInput } from "../../domain/email-sender";

export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly fromAddress = "no-reply@amplifiedaccess.org",
    private readonly resendApiKey = process.env.RESEND_API_KEY,
  ) {}

  async send(input: SendEmailInput): Promise<unknown> {
    const resend = new Resend(this.resendApiKey);

    const { data } = await resend.emails.send({
      from: this.fromAddress,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });

    return data;
  }
}
