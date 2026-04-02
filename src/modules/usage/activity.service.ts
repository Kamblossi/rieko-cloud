import { prisma } from "../../db/prisma.js";
import type { Prisma } from "@prisma/client";

type ActivityIdentity = {
  licenseKey: string;
  machineId: string;
  instanceId: string;
};

type ActivityEventInput = {
  event_type: string;
  model?: string;
  ai_model?: string;
  usage?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export class ActivityService {
  async recordEvent(identity: ActivityIdentity, input: ActivityEventInput): Promise<void> {
    const modelKey =
      typeof input.model === "string" && input.model.trim() ? input.model.trim() : "auto";
    const resolvedModelKey =
      modelKey !== "auto"
        ? modelKey
        : typeof input.ai_model === "string" && input.ai_model.trim()
          ? input.ai_model.trim()
          : "auto";

    const usageJson = {
      event_type: input.event_type,
      usage: isObject(input.usage) ? input.usage : {},
      metadata: isObject(input.metadata) ? input.metadata : {},
      raw: input,
    } as Prisma.InputJsonValue;

    await prisma.usageEvent.create({
      data: {
        licenseKey: identity.licenseKey,
        machineId: identity.machineId,
        instanceId: identity.instanceId,
        modelKey: resolvedModelKey,
        usageJson,
      },
    });
  }

  async getActivitySummary(identity: ActivityIdentity): Promise<{
    total_events: number;
    last_activity_at: string | null;
    recent_models: string[];
  }> {
    const where = {
      licenseKey: identity.licenseKey,
      machineId: identity.machineId,
      instanceId: identity.instanceId,
    };

    const [count, latest, recentModelRows] = await Promise.all([
      prisma.usageEvent.count({
        where,
      }),
      prisma.usageEvent.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.usageEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        distinct: ["modelKey"],
        select: { modelKey: true },
        take: 5,
      }),
    ]);

    return {
      total_events: count,
      last_activity_at: latest ? latest.createdAt.toISOString() : null,
      recent_models: recentModelRows.map((row) => row.modelKey),
    };
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
