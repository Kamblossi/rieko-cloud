import { prisma } from "../../db/prisma.js";
import type { DesktopActivityInput } from "../../types/compat.js";

export class ActivityService {
  async track(input: DesktopActivityInput): Promise<void> {
    await prisma.usageEvent.create({
      data: {
        licenseKey: typeof input.license === "string" ? input.license : "",
        machineId: typeof input.machine_id === "string" ? input.machine_id : "",
        instanceId: typeof input.instance === "string" ? input.instance : "",
        modelKey: typeof input.ai_model === "string" ? input.ai_model : "auto",
        usageJson: input as unknown as import("@prisma/client").Prisma.InputJsonValue
      }
    });
  }

  async getSummary(licenseKey: string): Promise<{
    total_events: number;
    license_key: string;
    last_event_at: string | null;
  }> {
    const [count, latest] = await Promise.all([
      prisma.usageEvent.count({
        where: { licenseKey }
      }),
      prisma.usageEvent.findFirst({
        where: { licenseKey },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true }
      })
    ]);

    return {
      total_events: count,
      license_key: licenseKey,
      last_event_at: latest ? latest.createdAt.toISOString() : null
    };
  }
}
