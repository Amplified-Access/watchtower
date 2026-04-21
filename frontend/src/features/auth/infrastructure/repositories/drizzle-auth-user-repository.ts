import { db as defaultDb } from "@/db";
import { user } from "@/db/schemas/auth";
import { eq } from "drizzle-orm";
import type { AuthUserRepository } from "../../domain/auth-user-repository";
import type { AuthUser } from "../../domain/auth-user";

export class DrizzleAuthUserRepository implements AuthUserRepository {
  constructor(private readonly database = defaultDb) {}

  async getById(userId: string): Promise<AuthUser | null> {
    const rows = await this.database
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return rows[0] ?? null;
  }
}
