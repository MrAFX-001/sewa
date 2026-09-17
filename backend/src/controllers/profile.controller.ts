import type { Request, Response } from "express";
import { writeAuditLog } from "../lib/audit.js";
import * as profileService from "../services/profile.service.js";
import type { UpsertProfileInput } from "../schemas/profile.schema.js";

export async function getProfile(req: Request, res: Response) {
  const data = await profileService.getMyProfile(req.user!.id);
  res.status(200).json(data);
}

export async function upsertProfile(req: Request, res: Response) {
  const input = req.body as UpsertProfileInput;
  const profile = await profileService.upsertProfile(req.user!.id, input);
  await writeAuditLog({ req, userId: req.user!.id, action: "profile_update" });
  res.status(200).json({ profile });
}
