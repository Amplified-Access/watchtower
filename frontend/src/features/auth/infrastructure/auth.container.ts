import { GetAuthUserById } from "../application/use-cases/get-auth-user-by-id";
import { SendEmailUseCase } from "../application/use-cases/send-email";
import { SendTestEmailUseCase } from "../application/use-cases/send-test-email";
import type { AuthUserRepository } from "../domain/auth-user-repository";
import type { EmailSender } from "../domain/email-sender";
import { ResendEmailSender } from "./email/resend-email-sender";
import { DrizzleAuthUserRepository } from "./repositories/drizzle-auth-user-repository";

export interface AuthUseCases {
  getAuthUserById: GetAuthUserById;
  sendEmail: SendEmailUseCase;
  sendTestEmail: SendTestEmailUseCase;
}

export const createAuthUseCases = (
  userRepository: AuthUserRepository = new DrizzleAuthUserRepository(),
  emailSender: EmailSender = new ResendEmailSender(),
): AuthUseCases => {
  return {
    getAuthUserById: new GetAuthUserById(userRepository),
    sendEmail: new SendEmailUseCase(emailSender),
    sendTestEmail: new SendTestEmailUseCase(emailSender),
  };
};
