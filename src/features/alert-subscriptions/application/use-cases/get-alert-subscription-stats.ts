import type { AlertSubscriptionRepository } from "../../domain/alert-subscription-repository";

export class GetAlertSubscriptionStats {
  constructor(private readonly repository: AlertSubscriptionRepository) {}

  async execute() {
    return this.repository.getStats();
  }
}
