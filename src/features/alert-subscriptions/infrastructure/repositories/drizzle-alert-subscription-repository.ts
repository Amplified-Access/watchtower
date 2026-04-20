import { db as defaultDb } from "@/db";
import { alertSubscriptions } from "@/db/schemas/alert-subscriptions";
import { eq } from "drizzle-orm";
import type {
  AlertSubscription,
  AlertSubscriptionDraft,
  AlertSubscriptionStats,
  AlertSubscriptionUpdate,
} from "../../domain/alert-subscription";
import type { AlertSubscriptionRepository } from "../../domain/alert-subscription-repository";

export class DrizzleAlertSubscriptionRepository
  implements AlertSubscriptionRepository
{
  constructor(private readonly database = defaultDb) {}

  async getByEmail(email: string): Promise<AlertSubscription | null> {
    const rows = await this.database
      .select()
      .from(alertSubscriptions)
      .where(eq(alertSubscriptions.email, email))
      .limit(1);

    return (rows[0] as AlertSubscription) ?? null;
  }

  async getById(id: string): Promise<AlertSubscription | null> {
    const rows = await this.database
      .select()
      .from(alertSubscriptions)
      .where(eq(alertSubscriptions.id, id))
      .limit(1);

    return (rows[0] as AlertSubscription) ?? null;
  }

  async create(input: AlertSubscriptionDraft): Promise<AlertSubscription> {
    const [created] = await this.database
      .insert(alertSubscriptions)
      .values({
        email: input.email,
        name: input.name,
        phone: input.phone ?? null,
        incidentTypes: input.incidentTypes,
        locations: input.locations,
        severityLevels: input.severityLevels,
        emailNotifications: input.emailNotifications,
        smsNotifications: input.smsNotifications,
        alertFrequency: input.alertFrequency,
        preferredLanguage: input.preferredLanguage,
        timezone: input.timezone,
        isActive: true,
      })
      .returning();

    return created as AlertSubscription;
  }

  async update(input: AlertSubscriptionUpdate): Promise<AlertSubscription | null> {
    const { id, ...updateData } = input;

    const [updated] = await this.database
      .update(alertSubscriptions)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(alertSubscriptions.id, id))
      .returning();

    return (updated as AlertSubscription) ?? null;
  }

  async activateByEmail(email: string): Promise<AlertSubscription | null> {
    const [updated] = await this.database
      .update(alertSubscriptions)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(alertSubscriptions.email, email))
      .returning();

    return (updated as AlertSubscription) ?? null;
  }

  async deactivateByEmail(email: string): Promise<AlertSubscription | null> {
    const [updated] = await this.database
      .update(alertSubscriptions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(alertSubscriptions.email, email))
      .returning();

    return (updated as AlertSubscription) ?? null;
  }

  async listActive(): Promise<AlertSubscription[]> {
    const rows = await this.database
      .select({
        id: alertSubscriptions.id,
        email: alertSubscriptions.email,
        name: alertSubscriptions.name,
        incidentTypes: alertSubscriptions.incidentTypes,
        locations: alertSubscriptions.locations,
        severityLevels: alertSubscriptions.severityLevels,
        alertFrequency: alertSubscriptions.alertFrequency,
        createdAt: alertSubscriptions.createdAt,
      })
      .from(alertSubscriptions)
      .where(eq(alertSubscriptions.isActive, true))
      .orderBy(alertSubscriptions.createdAt);

    return rows as AlertSubscription[];
  }

  async getStats(): Promise<AlertSubscriptionStats> {
    const totalSubscriptions = await this.database
      .select()
      .from(alertSubscriptions)
      .where(eq(alertSubscriptions.isActive, true));

    const frequencyStats = totalSubscriptions.reduce(
      (acc: Record<string, number>, sub) => {
        const frequency = sub.alertFrequency || "immediate";
        acc[frequency] = (acc[frequency] || 0) + 1;
        return acc;
      },
      {},
    );

    const incidentTypeStats = totalSubscriptions.reduce(
      (acc: Record<string, number>, sub) => {
        const incidentTypes = sub.incidentTypes as string[];
        incidentTypes.forEach((type: string) => {
          acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
      },
      {},
    );

    return {
      totalActive: totalSubscriptions.length,
      frequencyStats,
      incidentTypeStats,
      averageIncidentTypesPerUser:
        totalSubscriptions.length > 0
          ? totalSubscriptions.reduce((sum: number, sub) => {
              const incidentTypes = sub.incidentTypes as string[];
              return sum + incidentTypes.length;
            }, 0) / totalSubscriptions.length
          : 0,
    };
  }
}
