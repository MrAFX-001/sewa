import { Router } from "express";
import * as contactController from "../controllers/contact.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { contactLimiter } from "../middleware/rateLimiter.js";
import { createContactMessageSchema } from "../schemas/contact.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const contactRouter = Router();

// Deliberately no requireAuth: an applicant might be filing a grievance
// about being locked out of their own account (see schema.prisma's note on
// ContactMessage).
contactRouter.post(
  "/",
  contactLimiter,
  validateBody(createContactMessageSchema),
  asyncHandler(contactController.createContactMessage),
);
