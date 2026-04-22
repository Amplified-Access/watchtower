export class WatcherDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WatcherDomainError";
  }
}

export class WatcherForbiddenError extends WatcherDomainError {
  constructor(message: string) {
    super(message);
    this.name = "WatcherForbiddenError";
  }
}

export class WatcherNotFoundError extends WatcherDomainError {
  constructor(message: string) {
    super(message);
    this.name = "WatcherNotFoundError";
  }
}

export class WatcherValidationError extends WatcherDomainError {
  constructor(message: string) {
    super(message);
    this.name = "WatcherValidationError";
  }
}
