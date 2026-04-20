import type { EmailSender } from "../../domain/email-sender";

export class SendTestEmailUseCase {
  constructor(private readonly sender: EmailSender) {}

  async execute() {
    return this.sender.send({
      to: "gracenoble72@gmail.com",
      subject: "hello world",
      text: "it works!",
    });
  }
}
