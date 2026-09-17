import pino from "pino";
import { isProd } from "./env.js";

/**
 * Error serializer that keeps only safe, useful fields.
 *
 * pino's default err serializer copies every enumerable property of an error.
 * body-parser errors carry the raw request body in `err.body` (passwords, PII),
 * and other libraries attach request/response objects. Whitelist instead.
 */
export function safeErrSerializer(err: unknown) {
  if (!err || typeof err !== "object") return { message: String(err) };
  const e = err as Record<string, unknown> & { constructor?: { name?: string } };
  return {
    type: e.constructor?.name,
    message: typeof e.message === "string" ? e.message.slice(0, 500) : undefined,
    code: typeof e.code === "string" || typeof e.code === "number" ? e.code : undefined,
    status: typeof e.status === "number" ? e.status : undefined,
    errorType: typeof e.type === "string" ? e.type : undefined, // e.g. entity.parse.failed
    stack: typeof e.stack === "string" ? e.stack.split("\n").slice(0, 8).join("\n") : undefined,
  };
}

export const logger = pino({
  level: isProd ? "info" : "debug",
  serializers: { err: safeErrSerializer },
  redact: {
    // Defence in depth: the request/response serializers in app.ts already
    // whitelist fields, these catch anything logged manually.
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
      "*.password",
      "*.newPassword",
      "*.passwordHash",
      "*.password_hash",
      "*.otp",
      "*.code",
      "*.token",
      "*.body",
    ],
    censor: "[redacted]",
  },
  transport: isProd
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
});



