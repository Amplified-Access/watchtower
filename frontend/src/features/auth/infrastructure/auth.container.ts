import { SendEmailUseCase } from "../application/use-cases/send-email";
import { SendTestEmailUseCase } from "../application/use-cases/send-test-email";
import type { EmailSender } from "../domain/email-sender";
import { ResendEmailSender } from "./email/resend-email-sender";

export interface AuthUseCases {
  sendEmail: SendEmailUseCase;
  sendTestEmail: SendTestEmailUseCase;
}

export const createAuthUseCases = (
  emailSender: EmailSender = new ResendEmailSender(),
): AuthUseCases => {
  return {
    sendEmail: new SendEmailUseCase(emailSender),
    sendTestEmail: new SendTestEmailUseCase(emailSender),
  };
};
