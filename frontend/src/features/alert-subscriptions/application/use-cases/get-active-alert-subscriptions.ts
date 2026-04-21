import type { AlertSubscriptionRepository } from "../../domain/alert-subscription-repository";

export class GetActiveAlertSubscriptions {
  constructor(private readonly repository: AlertSubscriptionRepository) {}

  async execute() {
    return this.repository.listActive();
  }
}
