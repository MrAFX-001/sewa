import type { Request, Response } from "express";
import path from "node:path";
import { access } from "node:fs/promises";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { writeAuditLog } from "../lib/audit.js";
import * as teamService from "../services/team.service.js";
import type { AddMemberInput, CreateTeamInput, UpdateTeamInput } from "../schemas/team.schema.js";

export async function createTeam(req: Request, res: Response) {
  // uploadIdCard (multer) runs ahead of this on the route and populates
  // req.file - required on create, since every team needs an ID card on
  // file from the start.
  if (!req.file) {
    throw new AppError(400, "An identity / affiliation ID card (PDF, JPG, or PNG) is required.");
  }

  const input = req.body as CreateTeamInput;
  const team = await teamService.createTeam(req.user!.id, input, {
    path: req.file.filename,
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
  });
  await writeAuditLog({ req, userId: req.user!.id, action: "team_create", metadata: { teamId: team.id } });
  res.status(201).json({ team });
}

export async function getMyTeam(req: Request, res: Response) {
  const team = await teamService.getMyTeam(req.user!.id);
  res.status(200).json({ team });
}

export async function updateTeam(req: Request, res: Response) {
  // Unlike create, the ID card is optional here - a team only re-uploads if
  // it wants to replace the one already on file.
  const input = req.body as UpdateTeamInput;
  const idCard = req.file
    ? { path: req.file.filename, mimetype: req.file.mimetype, originalname: req.file.originalname }
    : undefined;

  const team = await teamService.updateTeam(req.params.teamId!, req.user!.id, input, idCard);
  await writeAuditLog({ req, userId: req.user!.id, action: "team_update", metadata: { teamId: team.id } });
  res.status(200).json({ team });
}

export async function addMember(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, "A Student / Institution ID Card (PDF, JPG, or PNG, max 500 KB) is required for every participant.");
  }

  const input = req.body as AddMemberInput;
  const member = await teamService.addTeamMember(req.params.teamId!, req.user!.id, input, {
    path: req.file.filename,
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
  });
  await writeAuditLog({
    req,
    userId: req.user!.id,
    action: "team_member_add",
    metadata: { teamId: req.params.teamId, memberEmail: member.email },
  });
  res.status(201).json({ member });
}


export async function updateMember(req: Request, res: Response) {
  const input = req.body as AddMemberInput;
  const idCard = req.file
    ? { path: req.file.filename, mimetype: req.file.mimetype, originalname: req.file.originalname }
    : undefined;
  const member = await teamService.updateTeamMember(
    req.params.teamId!,
    req.user!.id,
    req.params.memberId!,
    input,
    idCard,
  );
  await writeAuditLog({
    req,
    userId: req.user!.id,
    action: "team_member_update",
    metadata: { teamId: req.params.teamId, memberId: req.params.memberId },
  });
  res.status(200).json({ member });
}


export async function getMemberIdCard(req: Request, res: Response) {
  const { teamId, memberId } = req.params;
  const team = await teamService.getTeamForIdCardAccess(teamId!, memberId!, req.user!.id, req.user!.role);

  if (!team.member.idCardPath) {
    throw new AppError(404, "Identity document not found.");
  }

  const storedFilename = path.basename(team.member.idCardPath);
  const absolutePath = path.resolve(env.UPLOAD_DIR, storedFilename);

  try {
    await access(absolutePath);
  } catch {
    throw new AppError(404, "Identity document not found.");
  }

  if (team.member.idCardMimeType) {
    res.type(team.member.idCardMimeType);
  }

  res.download(
    absolutePath,
    team.member.idCardOriginalName || "id-card",
    (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: "Identity document not found." });
      }
    },
  );
}

export async function removeMember(req: Request, res: Response) {
  await teamService.removeTeamMember(req.params.teamId!, req.user!.id, req.params.memberId!);
  await writeAuditLog({
    req,
    userId: req.user!.id,
    action: "team_member_remove",
    metadata: { teamId: req.params.teamId, memberId: req.params.memberId },
  });
  res.status(204).send();
}

export async function submitTeam(req: Request, res: Response) {
  const team = await teamService.submitTeam(req.params.teamId!, req.user!.id);
  await writeAuditLog({ req, userId: req.user!.id, action: "team_submit", metadata: { teamId: team.id } });
  res.status(200).json({ team });
}
