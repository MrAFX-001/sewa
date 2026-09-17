import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listAnnouncements } from "../controllers/announcements.controller.js";

export const announcementsRouter = Router();

// Public — no auth required; announcements are displayed on the homepage
announcementsRouter.get("/", asyncHandler(listAnnouncements));
