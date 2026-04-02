import { prisma } from "../../db/prisma.js";
import type { UsageActivityInput } from "../../types/compat.js";

export class ActivityService {
  async track(input: UsageActivityInput): Promise<void> {
    await prisma.activityEvent.create({
      data: {
        userId: input.userId,
        eventType: input.eventType,
        payload: input.payload
      }
    });
  }
}
