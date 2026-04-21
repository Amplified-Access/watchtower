export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

export interface EmailSender {
  send(input: SendEmailInput): Promise<unknown>;
}
