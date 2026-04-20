export class AlertSubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlertSubscriptionError";
  }
}

export class AlertSubscriptionAlreadyExistsError extends AlertSubscriptionError {
  constructor() {
    super("An alert subscription already exists for this email address");
    this.name = "AlertSubscriptionAlreadyExistsError";
  }
}

export class AlertSubscriptionNotFoundError extends AlertSubscriptionError {
  constructor() {
    super("Alert subscription not found");
    this.name = "AlertSubscriptionNotFoundError";
  }
}
