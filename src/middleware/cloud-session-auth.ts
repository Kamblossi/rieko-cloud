import type { NextFunction, Request, Response } from "express";
import { jwtVerify } from "jose";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

const secretKey = new TextEncoder().encode(env.CLOUD_SESSION_JWT_SECRET);

function unauthorized(req: Request, res: Response, message: string): void {
  res.status(401).json({
    error: "Unauthorized",
    message,
    requestId: req.requestId,
  });
}

export async function cloudSessionAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    unauthorized(req, res, "Missing cloud session token");
    return;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: "rieko-cloud",
      audience: "rieko-runtime",
    });

    const sessionId = typeof payload.sid === "string" ? payload.sid : undefined;
    const subject = typeof payload.sub === "string" ? payload.sub : undefined;

    if (!sessionId) {
      throw new Error("Missing session id in token");
    }

    const session = await prisma.cloudSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        licenseKey: true,
        machineId: true,
        instanceId: true,
        isAdmin: true,
        planCode: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!session) {
      throw new Error("Cloud session no longer exists");
    }

    if (session.revokedAt) {
      throw new Error("Cloud session has been revoked");
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new Error("Cloud session has expired");
    }

    if (subject && subject !== session.licenseKey) {
      throw new Error("Token subject mismatch");
    }

    req.auth = {
      userId: session.licenseKey,
      scope: "cloud-session",
      sessionId: session.id,
      licenseKey: session.licenseKey,
      machineId: session.machineId,
      instanceId: session.instanceId,
      isAdmin: session.isAdmin,
      planCode: session.planCode,
    };

    next();
  } catch {
    unauthorized(req, res, "Invalid or expired cloud session token");
  }
}
