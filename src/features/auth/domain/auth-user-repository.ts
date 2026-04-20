import type { AuthUser } from "./auth-user";

export interface AuthUserRepository {
  getById(userId: string): Promise<AuthUser | null>;
}
