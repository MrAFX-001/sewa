import path from "node:path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Nginx is the only hop that sets X-Forwarded-For (Cloudflare IP is resolved by Nginx real_ip).
// Verify req.ip in logs shows visitor IPs, not Cloudflare edge IPs.
app.set("trust proxy", env.TRUST_PROXY_HOPS);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use("/uploads", express.static(path.resolve("uploads")));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use(
  pinoHttp({
    logger,
    // Probes hit these every few seconds per pod; don't flood the logs.
    autoLogging: { ignore: (req) => req.url === "/api/healthz" || req.url === "/api/health" },
  }),
);

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);
