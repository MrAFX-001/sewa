import { unlink } from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";
import { detectSafeImageType } from "../utils/imageValidation.js";
import { AppError } from "./errorHandler.js";

const EXPECTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

function expectedTypeFromExtension(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return null;
}

async function detectIdCardType(filePath: string): Promise<string | null> {
  const imageType = await detectSafeImageType(filePath);
  if (imageType && EXPECTED_IMAGE_TYPES.has(imageType)) return imageType;

  const { open } = await import("node:fs/promises");
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(5);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead === 5 && buffer.toString("ascii") === "%PDF-") {
      return "application/pdf";
    }
    return null;
  } finally {
    await handle.close();
  }
}

/**
 * Verifies the uploaded identity-document bytes agree with the validated
 * extension/MIME metadata supplied by the client. This prevents a file with
 * a trusted-looking extension from containing a different content type.
 */
export async function validateIdCardContent(req: Request, _res: Response, next: NextFunction) {
  if (!req.file) {
    next();
    return;
  }

  const expectedByExtension = expectedTypeFromExtension(req.file.originalname);
  const expected = expectedByExtension ?? req.file.mimetype;

  try {
    const detected = await detectIdCardType(req.file.path);
    if (!detected || detected !== expected || detected !== req.file.mimetype) {
      await unlink(req.file.path).catch(() => undefined);
      next(new AppError(400, "The uploaded ID card content does not match its file type."));
      return;
    }

    next();
  } catch {
    await unlink(req.file.path).catch(() => undefined);
    next(new AppError(400, "The uploaded ID card could not be validated."));
  }
}
