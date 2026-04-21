export class AuthUserNotFoundError extends Error {
  constructor() {
    super("User not found in database");
    this.name = "AuthUserNotFoundError";
  }
}
