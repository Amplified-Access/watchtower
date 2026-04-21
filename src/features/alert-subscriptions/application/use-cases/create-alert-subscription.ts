import { AlertSubscriptionAlreadyExistsError } from "../../domain/errors";
import type {
  AlertSubscription,
  AlertSubscriptionDraft,
} from "../../domain/alert-subscription";
import type { AlertSubscriptionRepository } from "../../domain/alert-subscription-repository";

export class CreateAlertSubscription {
  constructor(private readonly repository: AlertSubscriptionRepository) {}

  async execute(input: AlertSubscriptionDraft): Promise<{
    success: true;
    subscription: AlertSubscription;
    message: string;
  }> {
    const existing = await this.repository.getByEmail(input.email);

    if (existing) {
      throw new AlertSubscriptionAlreadyExistsError();
    }

    const subscription = await this.repository.create(input);

    return {
      success: true,
      subscription,
      message: "Successfully subscribed to alerts!",
    };
  }
}
