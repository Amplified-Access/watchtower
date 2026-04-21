export class OrganizationDirectoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationDirectoryError";
  }
}

export class OrganizationDirectoryValidationError extends OrganizationDirectoryError {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationDirectoryValidationError";
  }
}

export class OrganizationNotFoundError extends OrganizationDirectoryError {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationNotFoundError";
  }
}
