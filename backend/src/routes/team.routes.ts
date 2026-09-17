import { Router } from "express";
import * as teamController from "../controllers/team.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { uploadIdCard, uploadMemberIdCard } from "../middleware/upload.middleware.js";
import { requireAuth, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { createTeamSchema, updateTeamSchema, addMemberSchema } from "../schemas/team.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cleanupRejectedUpload } from "../middleware/uploadCleanup.middleware.js";
export const teamRouter = Router();
import { teamMemberAddLimiter } from "../middleware/rateLimiter.js";
// Every route here requires a signed-in, email-verified user - team
// registration is only reachable after signup + OTP verification + signin.
teamRouter.use(requireAuth, requireVerifiedEmail);

// Both routes are multipart/form-data (an ID card file rides alongside the
// text fields) - uploadIdCard (multer) must run BEFORE validateBody, since
// validateBody reads req.body, and req.body's text fields aren't populated
// until multer has parsed the multipart request.
teamRouter.post(
  "/",
  uploadIdCard,
  cleanupRejectedUpload,
  validateBody(createTeamSchema),
  asyncHandler(teamController.createTeam),
);
teamRouter.get("/me", asyncHandler(teamController.getMyTeam));
// Draft-only - getOwnedTeamOrThrow (via updateTeam) 409s once the team is submitted.
teamRouter.patch(
  "/:teamId",
  uploadIdCard,
  cleanupRejectedUpload,
  validateBody(updateTeamSchema),
  asyncHandler(teamController.updateTeam),
);
teamRouter.post(
  "/:teamId/members",
  teamMemberAddLimiter,
  uploadMemberIdCard,
  cleanupRejectedUpload,
  validateBody(addMemberSchema),
  asyncHandler(teamController.addMember),
);
teamRouter.patch(
  "/:teamId/members/:memberId",
  uploadMemberIdCard,
  cleanupRejectedUpload,
  validateBody(addMemberSchema),
  asyncHandler(teamController.updateMember),
);
teamRouter.delete("/:teamId/members/:memberId", asyncHandler(teamController.removeMember));
teamRouter.post("/:teamId/submit", asyncHandler(teamController.submitTeam));



