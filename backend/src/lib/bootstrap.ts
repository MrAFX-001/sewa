import { logger } from "../config/logger.js";

/**
 * Production no-op kept for compatibility with older imports.
 * Administrator accounts must be provisioned explicitly; the application
 * never creates a known-password privileged account automatically.
 */
export async function bootstrapDatabaseIfEmpty() {
  logger.info("Automatic privileged-account bootstrap is disabled; use the explicit admin promotion flow.");
}
