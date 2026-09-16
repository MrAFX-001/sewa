import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "./errorHandler.js";

/**
 * Organisation/institution ID card upload for team registration.
 *
 * Deliberately restrictive: this accepts exactly one file, under one of
 * three MIME types, under a fixed size cap. All three limits are enforced
 * by multer itself (not just checked afterwards), so an oversized or
 * wrong-type file is rejected before it's fully received rather than after
 * being written to disk.
 */
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Never trust the client-supplied filename for the path on disk - it's
    // preserved separately as idCardOriginalName for display, but the actual
    // stored filename is a fresh random UUID plus a validated extension.
    // This rules out path traversal and filename collisions in one move.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ALLOWED_EXTENSIONS.has(ext) ? ext : ""}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (file.originalname.length > 255) {
    cb(new AppError(400, "Filename is too long."));
    return;
  }

  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    cb(new AppError(400, "ID card must be a PDF, JPG, or PNG file."));
    return;
  }

  cb(null, true);
}

/**
 * Field name "idCard". Use as a route middleware ahead of validateBody -
 * multer populates req.body with the request's other (text) fields before
 * validateBody ever runs, and req.file with the upload itself.
 */
export const uploadIdCard = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
    fields: 20,
    fieldSize: 16 * 1024,
    parts: 25,
  },
  fileFilter,
}).single("idCard");
