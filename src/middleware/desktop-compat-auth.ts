import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function desktopCompatAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || token !== env.DESKTOP_COMPAT_KEY) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid desktop compatibility token",
      requestId: req.requestId
    });
    return;
  }

  req.auth = {
    userId: "desktop-compat",
    scope: "desktop-compat"
  };

  next();
}
