import type { EmailSender } from "../../domain/email-sender";

export class SendTestEmailUseCase {
  constructor(private readonly sender: EmailSender) {}

  async execute() {
    const to = process.env.TEST_EMAIL_RECIPIENT;
    if (!to) {
      throw new Error("TEST_EMAIL_RECIPIENT env variable is not set");
    }
    return this.sender.send({
      to,
      subject: "hello world",
      text: "it works!",
    });
  }
}
