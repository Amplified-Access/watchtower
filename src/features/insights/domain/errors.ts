export class InsightCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsightCatalogError";
  }
}

export class InsightValidationError extends InsightCatalogError {
  constructor(message: string) {
    super(message);
    this.name = "InsightValidationError";
  }
}

export class InsightNotFoundError extends InsightCatalogError {
  constructor(message: string) {
    super(message);
    this.name = "InsightNotFoundError";
  }
}
