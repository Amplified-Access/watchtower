import { AlertSubscriptionNotFoundError } from "../../domain/errors";
import type {
  AlertSubscription,
  AlertSubscriptionUpdate,
} from "../../domain/alert-subscription";
import type { AlertSubscriptionRepository } from "../../domain/alert-subscription-repository";

export class UpdateAlertSubscription {
  constructor(private readonly repository: AlertSubscriptionRepository) {}

  async execute(input: AlertSubscriptionUpdate): Promise<{
    success: true;
    subscription: AlertSubscription;
    message: string;
  }> {
    const existing = await this.repository.getById(input.id);

    if (!existing) {
      throw new AlertSubscriptionNotFoundError();
    }

    const subscription = await this.repository.update(input);

    if (!subscription) {
      throw new AlertSubscriptionNotFoundError();
    }

    return {
      success: true,
      subscription,
      message: "Subscription updated successfully!",
    };
  }
}
