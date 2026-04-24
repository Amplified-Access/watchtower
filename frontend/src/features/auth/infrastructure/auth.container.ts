import { SendEmailUseCase } from "../application/use-cases/send-email";
import { SendTestEmailUseCase } from "../application/use-cases/send-test-email";
import type { EmailSender } from "../domain/email-sender";
import { BackendEmailSender } from "./email/backend-email-sender";

export interface AuthUseCases {
  sendEmail: SendEmailUseCase;
  sendTestEmail: SendTestEmailUseCase;
}

export const createAuthUseCases = (
  emailSender: EmailSender = new BackendEmailSender(),
): AuthUseCases => {
  return {
    sendEmail: new SendEmailUseCase(emailSender),
    sendTestEmail: new SendTestEmailUseCase(emailSender),
  };
};
