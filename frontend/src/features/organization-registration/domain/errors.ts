export class OrganizationApplicationNotFoundError extends Error {
  constructor() {
    super("Application not found.");
    this.name = "OrganizationApplicationNotFoundError";
  }
}
