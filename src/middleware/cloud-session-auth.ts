import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env.js";

const secretKey = new TextEncoder().encode(env.CLOUD_SESSION_JWT_SECRET);

export async function cloudSessionAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing cloud session token",
      requestId: req.requestId
    });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: "rieko-cloud",
      audience: "rieko-runtime"
    });

    const userId = typeof payload.sub === "string" ? payload.sub : undefined;
    const sessionId = typeof payload.sid === "string" ? payload.sid : undefined;

    if (!userId || !sessionId) {
      throw new Error("Invalid token payload");
    }

    req.auth = {
      userId,
      scope: "cloud-session",
      sessionId
    };

    next();
  } catch {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired cloud session token",
      requestId: req.requestId
    });
  }
}
