import { AlertSubscriptionNotFoundError } from "../../domain/errors";
import type {
  AlertSubscription,
} from "../../domain/alert-subscription";
import type { AlertSubscriptionRepository } from "../../domain/alert-subscription-repository";

export class ActivateAlertSubscription {
  constructor(private readonly repository: AlertSubscriptionRepository) {}

  async execute(email: string): Promise<{
    success: true;
    subscription: AlertSubscription;
    message: string;
  }> {
    const activated = await this.repository.activateByEmail(email);

    if (!activated) {
      throw new AlertSubscriptionNotFoundError();
    }

    return {
      success: true,
      subscription: activated,
      message: "Successfully reactivated alert subscription",
    };
  }
}
