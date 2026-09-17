import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { logger } from "../config/logger.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

/** body-parser (express.json) client errors: { type, status, body, ... } */
const BODY_PARSER_ERRORS: Record<string, { status: number; message: string }> = {
  "entity.parse.failed": { status: 400, message: "Invalid JSON body." },
  "entity.too.large": { status: 413, message: "Request body is too large." },
  "entity.verify.failed": { status: 400, message: "Invalid request body." },
  "request.aborted": { status: 400, message: "Request was aborted." },
  "request.size.invalid": { status: 400, message: "Invalid request size." },
  "stream.encoding.set": { status: 500, message: "Something went wrong. Please try again." },
  "encoding.unsupported": { status: 415, message: "Unsupported content encoding." },
  "charset.unsupported": { status: 415, message: "Unsupported charset." },
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "ID card file is too large (max 5 MB)."
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field in upload."
          : "File upload failed.";
    return res.status(400).json({ error: message });
  }

  // Client-side body errors: answer 4xx and never log err.body (raw request
  // body, may contain passwords/PII).
  if (err && typeof err === "object" && typeof (err as { type?: unknown }).type === "string") {
    const mapped = BODY_PARSER_ERRORS[(err as { type: string }).type];
    if (mapped) {
      logger.warn({ errorType: (err as { type: string }).type, path: req.path }, "request_body_rejected");
      return res.status(mapped.status).json({ error: mapped.message });
    }
  }

  // Unexpected error: log sanitized detail internally (see safeErrSerializer),
  // return a generic message. No debug detail in any environment.
  logger.error({ err, path: req.path, method: req.method }, "unhandled_error");
  res.status(500).json({ error: "Something went wrong. Please try again." });
}



