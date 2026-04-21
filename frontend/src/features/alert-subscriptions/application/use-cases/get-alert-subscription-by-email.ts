import type { AlertSubscriptionRepository } from "../../domain/alert-subscription-repository";

export class GetAlertSubscriptionByEmail {
  constructor(private readonly repository: AlertSubscriptionRepository) {}

  async execute(email: string) {
    return this.repository.getByEmail(email);
  }
}
