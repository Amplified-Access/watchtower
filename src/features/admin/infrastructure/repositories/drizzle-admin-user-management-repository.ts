import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { organizations } from "@/db/schemas/organizations";
import { auth } from "@/lib/auth";
import { generateRandomSecurePassword } from "@/utils/generate-random-password";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { AdminUserManagementRepository } from "../../domain/admin-user-management-repository";
import type {
  BasicUserRecord,
  InviteWatcherInput,
  OrganizationWatcher,
} from "../../domain/admin-user-management-types";

export class DrizzleAdminUserManagementRepository
  implements AdminUserManagementRepository
{
  constructor(private readonly database = defaultDb) {}

  async getOrganizationWatchers(
    organizationId: string,
  ): Promise<OrganizationWatcher[]> {
    const data = await this.database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organization: organizations.name,
      })
      .from(user)
      .leftJoin(organizations, eq(user.organizationId, organizations.id))
      .where(and(eq(user.role, "watcher"), eq(user.organizationId, organizationId)));

    return data;
  }

  async inviteWatcher(input: InviteWatcherInput): Promise<void> {
    const response = await auth.api
      .signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: generateRandomSecurePassword(),
        },
        asResponse: true,
      })
      .then((res) => res.json());

    if (response?.user?.id) {
      await auth.api.setRole({
        body: {
          userId: response.user.id,
          role: "watcher",
        },
        headers: await headers(),
      });

      await this.database
        .update(user)
        .set({ organizationId: input.organizationId })
        .where(eq(user.id, response.user.id));
    }

    await auth.api.requestPasswordReset({
      body: {
        email: input.email,
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
      },
    });
  }

  async findUserById(userId: string): Promise<BasicUserRecord | null> {
    const [targetUser] = await this.database
      .select({
        id: user.id,
        organizationId: user.organizationId,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return targetUser ?? null;
  }

  async sendPasswordReset(email: string): Promise<void> {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
      },
    });
  }
}
