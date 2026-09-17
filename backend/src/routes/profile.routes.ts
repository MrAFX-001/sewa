import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { requireAuth, requireVerifiedEmail } from "../middleware/auth.middleware.js";
import { upsertProfileSchema } from "../schemas/profile.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/prisma.js";

export const profileRouter = Router();

// Same gate as team registration - the dossier only opens once signup +
// email verification are done.
profileRouter.use(requireAuth, requireVerifiedEmail);

profileRouter.get("/", asyncHandler(profileController.getProfile));
profileRouter.put("/", validateBody(upsertProfileSchema), asyncHandler(profileController.upsertProfile));

profileRouter.get(
  "/mail",
  asyncHandler(async (req, res) => {
    const mails = await prisma.adminMail.findMany({
      where: {
        OR: [
          { targetAudience: "ALL" },
          { targetAudience: "MEMBER" },
          { targetEmail: req.user!.email },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    const formatted = mails.map((m) => ({
      id: m.id,
      sender: m.sender ? `${m.sender.firstName} ${m.sender.lastName}`.trim() : "SEVA Secretariat",
      email: m.sender?.email || "sewa2026@dtu.ac.in",
      title: m.subject,
      snippet: m.content.slice(0, 90) + (m.content.length > 90 ? "..." : ""),
      body: m.content,
      time: m.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      tag: "Official",
      starred: m.starred,
      archived: m.archived,
      folder: "Inbox",
      targetAudience: m.targetAudience,
    }));

    res.status(200).json({ mails: formatted });
  }),
);
