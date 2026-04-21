import { ActivateAlertSubscription } from "../application/use-cases/activate-alert-subscription";
import { CreateAlertSubscription } from "../application/use-cases/create-alert-subscription";
import { DeactivateAlertSubscription } from "../application/use-cases/deactivate-alert-subscription";
import { GetActiveAlertSubscriptions } from "../application/use-cases/get-active-alert-subscriptions";
import { GetAlertSubscriptionByEmail } from "../application/use-cases/get-alert-subscription-by-email";
import { GetAlertSubscriptionStats } from "../application/use-cases/get-alert-subscription-stats";
import { UpdateAlertSubscription } from "../application/use-cases/update-alert-subscription";
import type { AlertSubscriptionRepository } from "../domain/alert-subscription-repository";
import { DrizzleAlertSubscriptionRepository } from "./repositories/drizzle-alert-subscription-repository";

export interface AlertSubscriptionUseCases {
  create: CreateAlertSubscription;
  getByEmail: GetAlertSubscriptionByEmail;
  update: UpdateAlertSubscription;
  deactivate: DeactivateAlertSubscription;
  activate: ActivateAlertSubscription;
  getAllActive: GetActiveAlertSubscriptions;
  getStats: GetAlertSubscriptionStats;
}

export const createAlertSubscriptionUseCases = (
  repository: AlertSubscriptionRepository = new DrizzleAlertSubscriptionRepository(),
): AlertSubscriptionUseCases => {
  return {
    create: new CreateAlertSubscription(repository),
    getByEmail: new GetAlertSubscriptionByEmail(repository),
    update: new UpdateAlertSubscription(repository),
    deactivate: new DeactivateAlertSubscription(repository),
    activate: new ActivateAlertSubscription(repository),
    getAllActive: new GetActiveAlertSubscriptions(repository),
    getStats: new GetAlertSubscriptionStats(repository),
  };
};
