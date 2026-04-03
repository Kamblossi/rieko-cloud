import type { CompatModelItem } from "../../types/compat.js";
import { prisma } from "../../db/prisma.js";

export class ModelCatalogService {
  async getCompatModels(allowedModelKeys?: string[]): Promise<CompatModelItem[]> {
    if (Array.isArray(allowedModelKeys) && allowedModelKeys.length === 0) {
      return [];
    }

    const where = {
      isAvailable: true,
      ...(Array.isArray(allowedModelKeys)
        ? { routingKey: { in: allowedModelKeys } }
        : {}),
    };

    const rows = await prisma.riekoModel.findMany({
      where,
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

    return rows.map((row: {
      displayName: string;
      providerLabel: string;
      routingKey: string;
      modality: string;
      isAvailable: boolean;
    }) => ({
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
