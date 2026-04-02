import { SignJWT } from "jose";
import { prisma } from "../../db/prisma.js";
import { env } from "../../config/env.js";

const secretKey = new TextEncoder().encode(env.CLOUD_SESSION_JWT_SECRET);

export class CloudSessionService {
  async issueSession(input: {
    licenseKey: string;
    machineId: string;
    instanceId: string;
    isAdmin?: boolean;
    planCode?: string | null;
  }): Promise<{ token: string; expiresAt: string; sessionId: string }> {
    const expiresAtDate = new Date(Date.now() + env.CLOUD_SESSION_TTL_SECONDS * 1000);

    const session = await prisma.cloudSession.create({
      data: {
        licenseKey: input.licenseKey,
        machineId: input.machineId,
        instanceId: input.instanceId,
        isAdmin: input.isAdmin ?? false,
        planCode: input.planCode ?? null,
        expiresAt: expiresAtDate
      },
      select: { id: true, expiresAt: true }
    });

    const token = await new SignJWT({ sid: session.id, scope: "runtime" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("rieko-cloud")
      .setAudience("rieko-runtime")
      .setSubject(input.licenseKey || "desktop-compat")
      .setIssuedAt()
      .setExpirationTime(`${env.CLOUD_SESSION_TTL_SECONDS}s`)
      .sign(secretKey);

    return {
      token,
      expiresAt: session.expiresAt.toISOString(),
      sessionId: session.id
    };
  }
}
