import {
  WatcherForbiddenError,
  WatcherNotFoundError,
} from "../../domain/errors";
import type { WatcherRepository } from "../../domain/watcher-repository";
import type { ActorContext } from "../../domain/watcher-types";

export class GetFormById {
  constructor(private readonly repository: WatcherRepository) {}

  async execute(input: { formId: string; actor: ActorContext }) {
    const form = await this.repository.getFormById(input.formId);

    if (!form) {
      throw new WatcherNotFoundError("Form not found");
    }

    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== form.organizationId
    ) {
      throw new WatcherForbiddenError(
        "You can only access forms from your own organization",
      );
    }

    return form;
  }
}
