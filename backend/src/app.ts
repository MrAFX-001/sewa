import path from "node:path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger, safeErrSerializer } from "./config/logger.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

// Nginx is the only hop that sets X-Forwarded-For (Cloudflare IP is resolved by Nginx real_ip).
// Verify req.ip in logs shows visitor IPs, not Cloudflare edge IPs.
app.set("trust proxy", (ip: string) => {
  return ip === "127.0.0.1" || ip === "::1";
});

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
    // Whitelist what gets logged per request. The default serializers log all
    // request headers (cookies, attacker-controlled values) and all response
    // headers, including Set-Cookie with the session JWT.
    serializers: {
      req: (req: { id?: unknown; method?: string; url?: string; remoteAddress?: string }) => ({
        id: req.id,
        method: req.method,
        url: typeof req.url === "string" ? req.url.split("?")[0]!.slice(0, 200) : undefined,
      }),
      res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
      err: safeErrSerializer,
    },
    customProps: (req) => ({ ip: (req as express.Request).ip }),
  }),
);

app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);



