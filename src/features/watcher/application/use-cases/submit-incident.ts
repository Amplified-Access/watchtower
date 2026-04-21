import {
  WatcherForbiddenError,
  WatcherNotFoundError,
  WatcherValidationError,
} from "../../domain/errors";
import type { WatcherRepository } from "../../domain/watcher-repository";
import type { SubmitIncidentInput } from "../../domain/watcher-types";

export class SubmitIncident {
  constructor(private readonly repository: WatcherRepository) {}

  async execute(input: Omit<SubmitIncidentInput, "organizationId">) {
    const form = await this.repository.getFormById(input.formId);

    if (!form) {
      throw new WatcherNotFoundError("Form not found");
    }

    if (form.isActive === false) {
      throw new WatcherValidationError("This form is not currently active");
    }

    const resolvedOrganizationId =
      form.organizationId ?? input.actor.organizationId;

    if (!resolvedOrganizationId) {
      throw new WatcherValidationError(
        "Form is missing organization context",
      );
    }

    if (
      input.actor.role !== "super-admin" &&
      input.actor.organizationId !== form.organizationId
    ) {
      throw new WatcherForbiddenError(
        "You can only submit reports to forms from your own organization",
      );
    }

    const result = await this.repository.submitIncident({
      ...input,
      organizationId: resolvedOrganizationId,
    });

    return {
      success: true,
      message: "Incident reported successfully",
      incidentId: result.incidentId,
    };
  }
}
