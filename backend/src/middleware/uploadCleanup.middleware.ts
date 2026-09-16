import type { NextFunction, Request, Response } from "express";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export function cleanupRejectedUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => {
    if (res.statusCode < 400 || !req.file) {
      return;
    }

    void unlink(
      path.join(env.UPLOAD_DIR, path.basename(req.file.filename)),
    ).catch(() => {
      // Best-effort cleanup.
    });
  });

  next();
}