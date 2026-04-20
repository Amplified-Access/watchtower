import { WatcherValidationError } from "../../domain/errors";
import type { WatcherRepository } from "../../domain/watcher-repository";
import type { ActorContext } from "../../domain/watcher-types";

export class GetOrganizationRecentActivity {
  constructor(private readonly repository: WatcherRepository) {}

  async execute(input: { limit: number; actor: ActorContext }) {
    if (!input.actor.organizationId) {
      throw new WatcherValidationError(
        "User must be associated with an organization",
      );
    }

    return this.repository.getOrganizationRecentActivity(
      input.actor.organizationId,
      input.limit,
    );
  }
}
