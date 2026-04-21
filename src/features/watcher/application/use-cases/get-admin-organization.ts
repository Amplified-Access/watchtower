import {
  WatcherForbiddenError,
  WatcherValidationError,
} from "../../domain/errors";
import type { WatcherRepository } from "../../domain/watcher-repository";
import type { ActorContext } from "../../domain/watcher-types";

export class GetAdminOrganization {
  constructor(private readonly repository: WatcherRepository) {}

  async execute(input: { userId: string; actor: ActorContext }) {
    if (!input.userId) {
      throw new WatcherValidationError("User id is required");
    }

    if (
      input.actor.role !== "super-admin" &&
      input.actor.userId !== input.userId
    ) {
      throw new WatcherForbiddenError(
        "You can only access your own organization data",
      );
    }

    return this.repository.getUserOrganizationDetails(input.userId);
  }
}
