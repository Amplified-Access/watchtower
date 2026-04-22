export class OrganizationReportingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationReportingError";
  }
}

export class IncidentTypeNotEnabledError extends OrganizationReportingError {
  constructor() {
    super("Selected incident type is not enabled for your organization");
    this.name = "IncidentTypeNotEnabledError";
  }
}

export class OrganizationMembershipRequiredError extends OrganizationReportingError {
  constructor() {
    super("User must be associated with an organization");
    this.name = "OrganizationMembershipRequiredError";
  }
}
