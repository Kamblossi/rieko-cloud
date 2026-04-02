import { prisma } from "../../db/prisma.js";
import type { CompatResponseConfig } from "../../types/compat.js";

export class ResponseConfigService {
  async getForUser(userId: string): Promise<CompatResponseConfig> {
    const config = await prisma.responseConfig.findUnique({
      where: { userId },
      select: { temperature: true, maxTokens: true }
    });

    return config ?? { temperature: 0.7, maxTokens: 1024 };
  }

  async updateForUser(userId: string, config: CompatResponseConfig): Promise<CompatResponseConfig> {
    const updated = await prisma.responseConfig.upsert({
      where: { userId },
      update: {
        temperature: config.temperature,
        maxTokens: config.maxTokens
      },
      create: {
        userId,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      },
      select: { temperature: true, maxTokens: true }
    });

    return updated;
  }
}
