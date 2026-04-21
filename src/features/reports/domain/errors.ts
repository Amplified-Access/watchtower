export class ReportCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportCatalogError";
  }
}

export class ReportValidationError extends ReportCatalogError {
  constructor(message: string) {
    super(message);
    this.name = "ReportValidationError";
  }
}

export class ReportNotFoundError extends ReportCatalogError {
  constructor(message: string) {
    super(message);
    this.name = "ReportNotFoundError";
  }
}
