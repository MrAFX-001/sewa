import type { Request } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export type AuditAction =
  | "signup"
  | "otp_send"
  | "otp_verify_success"
  | "otp_verify_failure"
  | "signin_success"
  | "signin_failure"
  | "signout"
  | "password_reset_request"
  | "password_reset_success"
  | "password_reset_failure"
  | "team_create"
  | "team_update"
  | "team_member_add"
  | "team_member_remove"
  | "team_submit"
  | "profile_update"
  | "contact_message_submit"
  | "role_assign"
  | "status_update"
  | "user_invite"
  | "team_evaluate"
  | "broadcast_mail"
  | "committee_member_create"
  | "committee_member_update"
  | "committee_member_delete"
  | "committee_layout_reorder"
  | "gallery_image_create"
  | "gallery_image_update"
  | "gallery_image_delete"
  | "gallery_layout_reorder"
  | "hero_slide_create"
  | "hero_slide_update"
  | "hero_slide_delete"
  | "faq_create"
  | "faq_update"
  | "faq_delete"
  | "announcement_create"
  | "announcement_update"
  | "announcement_delete"
  | "theme_create"
  | "theme_update"
  | "theme_delete"
  | "theme_layout_reorder"
  | "media_upload"
  | (string & {});

interface AuditParams {
  req: Request;
  userId?: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}

/**
 * Writes an append-only audit trail entry. Failures here are logged but
 * never thrown - an audit log write must not be able to fail the request
 * it's describing.
 */
export async function writeAuditLog({ req, userId, action, metadata }: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        ipAddress: req.ip ?? null,
        metadata: (metadata as Prisma.InputJsonObject) ?? undefined,
      },
    });
  } catch (err) {
    logger.error({ err, action, userId }, "audit_log_write_failed");
  }
}
