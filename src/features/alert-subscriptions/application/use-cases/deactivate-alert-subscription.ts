import { AlertSubscriptionNotFoundError } from "../../domain/errors";
import type { AlertSubscriptionRepository } from "../../domain/alert-subscription-repository";

export class DeactivateAlertSubscription {
  constructor(private readonly repository: AlertSubscriptionRepository) {}

  async execute(email: string): Promise<{
    success: true;
    message: string;
  }> {
    const deactivated = await this.repository.deactivateByEmail(email);

    if (!deactivated) {
      throw new AlertSubscriptionNotFoundError();
    }

    return {
      success: true,
      message: "Successfully unsubscribed from alerts",
    };
  }
}
