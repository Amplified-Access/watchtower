import { WatcherValidationError } from "../../domain/errors";
import type { WatcherRepository } from "../../domain/watcher-repository";
import type { ActorContext } from "../../domain/watcher-types";

export class GetOrganizationDashboardStats {
  constructor(private readonly repository: WatcherRepository) {}

  async execute(actor: ActorContext) {
    if (!actor.organizationId) {
      throw new WatcherValidationError(
        "User must be associated with an organization",
      );
    }

    return this.repository.getOrganizationDashboardStats(actor.organizationId);
  }
}
