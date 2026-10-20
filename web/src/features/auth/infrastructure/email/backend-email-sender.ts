import type { EmailSender, SendEmailInput } from "../../domain/email-sender";

export class BackendEmailSender implements EmailSender {
  constructor(
    private readonly apiUrl = process.env.BACKEND_API_URL ?? "http://localhost:8080/api/v1",
    private readonly internalToken = process.env.INTERNAL_EMAIL_SECRET ?? "",
  ) {}

  async send(input: SendEmailInput): Promise<unknown> {
    const response = await fetch(`${this.apiUrl}/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": this.internalToken,
      },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        body: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as { error?: string }).error ?? "Failed to send email");
    }

    return response.json();
  }
}
