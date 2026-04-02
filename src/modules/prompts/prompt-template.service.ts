import { prisma } from "../../db/prisma.js";

export class PromptTemplateService {
  async list(): Promise<Array<{ key: string; title: string; body: string }>> {
    return prisma.promptTemplate.findMany({
      orderBy: { updatedAt: "desc" },
      select: { key: true, title: true, body: true }
    });
  }

  async upsert(key: string, title: string, body: string): Promise<{ key: string; title: string; body: string }> {
    return prisma.promptTemplate.upsert({
      where: { key },
      update: { title, body },
      create: { key, title, body },
      select: { key: true, title: true, body: true }
    });
  }
}
