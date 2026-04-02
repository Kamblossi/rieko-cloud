import type { CompatModelItem } from "../../types/compat.js";
import { prisma } from "../../db/prisma.js";

export class ModelCatalogService {
  async getCompatModels(): Promise<CompatModelItem[]> {
    const rows = await prisma.riekoModel.findMany({
      where: {
        isAvailable: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { displayName: "asc" },
      ],
      select: {
        displayName: true,
        providerLabel: true,
        routingKey: true,
        modality: true,
        isAvailable: true,
      },
    });

    return rows.map((row) => ({
      provider: row.providerLabel,
      name: row.displayName,
      id: row.routingKey,
      model: row.routingKey,
      description:
        row.routingKey === "auto"
          ? "Let Rieko Cloud choose the best model."
          : `${row.displayName} model managed by Rieko Cloud.`,
      modality: row.modality,
      isAvailable: row.isAvailable,
    }));
  }
}
