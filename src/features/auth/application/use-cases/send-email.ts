import type { SendEmailInput } from "../../domain/email-sender";
import type { EmailSender } from "../../domain/email-sender";

export class SendEmailUseCase {
  constructor(private readonly sender: EmailSender) {}

  async execute(input: SendEmailInput) {
    return this.sender.send(input);
  }
}
