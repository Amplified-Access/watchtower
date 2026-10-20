export class AdminUserManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminUserManagementError";
  }
}

export class AdminForbiddenError extends AdminUserManagementError {
  constructor(message: string) {
    super(message);
    this.name = "AdminForbiddenError";
  }
}

export class AdminNotFoundError extends AdminUserManagementError {
  constructor(message: string) {
    super(message);
    this.name = "AdminNotFoundError";
  }
}

export class AdminValidationError extends AdminUserManagementError {
  constructor(message: string) {
    super(message);
    this.name = "AdminValidationError";
  }
}

export class AdminConflictError extends AdminUserManagementError {
  constructor(message: string) {
    super(message);
    this.name = "AdminConflictError";
  }
}
