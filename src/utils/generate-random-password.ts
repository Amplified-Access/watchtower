/**
 * This is a helper to generate a random secure password for a new created user.
 */

import crypto from "crypto";

export function generateRandomSecurePassword(length: number = 32): string {
  const buffer = crypto.randomBytes(length);
  return buffer.toString("hex");
}
