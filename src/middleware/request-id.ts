import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId: string;
    auth?: {
      userId: string;
      scope: "desktop-compat" | "cloud-session";
      sessionId?: string;
      licenseKey?: string;
      machineId?: string;
      instanceId?: string;
      isAdmin?: boolean;
      planCode?: string | null;
    };
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.header("x-request-id");
  const requestId = existing && existing.length > 0 ? existing : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
