import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { teamRouter } from "./team.routes.js";
import { profileRouter } from "./profile.routes.js";
import { contactRouter } from "./contact.routes.js";
import { announcementsRouter } from "./announcements.routes.js";
import { publicRouter } from "./public.routes.js";
import { adminRouter, resourceRouter } from "./admin.routes.js";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/register", teamRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/contact", contactRouter);
apiRouter.use("/announcements", announcementsRouter);
apiRouter.use("/public", publicRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/resources", resourceRouter);

// Liveness: is the process alive? No DB check, otherwise a DB blip makes
// k8s restart every pod at once.
apiRouter.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

// Readiness: can this pod serve traffic? Failing just removes it from the LB.
apiRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "OK",
      message: "SEVA 2026 backend and database are connected!",
    });
  } catch (err) {
    logger.error({ err }, "health_check_failed");
    res.status(503).json({ status: "ERROR", message: "Database connection failed" });
  }
});
