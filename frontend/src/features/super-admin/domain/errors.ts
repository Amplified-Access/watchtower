export class SuperAdminFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SuperAdminFormError";
  }
}

export class SuperAdminFormNotFoundError extends SuperAdminFormError {
  constructor(message: string) {
    super(message);
    this.name = "SuperAdminFormNotFoundError";
  }
}

export class SuperAdminFormValidationError extends SuperAdminFormError {
  constructor(message: string) {
    super(message);
    this.name = "SuperAdminFormValidationError";
  }
}
