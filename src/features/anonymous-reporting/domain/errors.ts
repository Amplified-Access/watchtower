export class AnonymousReportingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnonymousReportingError";
  }
}

export class LocationSearchFailedError extends AnonymousReportingError {
  constructor() {
    super("Failed to fetch places.");
    this.name = "LocationSearchFailedError";
  }
}
