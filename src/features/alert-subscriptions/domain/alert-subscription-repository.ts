import type {
  AlertSubscription,
  AlertSubscriptionDraft,
  AlertSubscriptionStats,
  AlertSubscriptionUpdate,
} from "./alert-subscription";

export interface AlertSubscriptionRepository {
  getByEmail(email: string): Promise<AlertSubscription | null>;
  getById(id: string): Promise<AlertSubscription | null>;
  create(input: AlertSubscriptionDraft): Promise<AlertSubscription>;
  update(input: AlertSubscriptionUpdate): Promise<AlertSubscription | null>;
  activateByEmail(email: string): Promise<AlertSubscription | null>;
  deactivateByEmail(email: string): Promise<AlertSubscription | null>;
  listActive(): Promise<AlertSubscription[]>;
  getStats(): Promise<AlertSubscriptionStats>;
}
