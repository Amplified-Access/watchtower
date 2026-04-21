import { AuthUserNotFoundError } from "../../domain/errors";
import type { AuthUser } from "../../domain/auth-user";
import type { AuthUserRepository } from "../../domain/auth-user-repository";

export class GetAuthUserById {
  constructor(private readonly repository: AuthUserRepository) {}

  async execute(userId: string): Promise<AuthUser> {
    const user = await this.repository.getById(userId);

    if (!user) {
      throw new AuthUserNotFoundError();
    }

    return user;
  }
}
