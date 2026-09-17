import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { verifySession } from "../utils/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; emailVerified: boolean; status: string; role?: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = verifySession(token);
    // Re-fetch current status on every request rather than trusting the
    // JWT claims alone - a suspended account must lose access immediately,
    // not just after the token expires.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        status: true,
        tokenVersion: true,
        role: true,
      },
    });

    if (!user || user.status === "suspended") {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (payload.ver !== user.tokenVersion) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Not authenticated" });
  }
}

export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.emailVerified) {
    return res.status(403).json({ error: "Email verification required" });
  }
  next();
}
