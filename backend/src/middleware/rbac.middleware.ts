import type { NextFunction, Request, Response } from "express";

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role || "MEMBER";

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden: You do not have sufficient permissions to access this resource.",
      });
    }

    next();
  };
}



