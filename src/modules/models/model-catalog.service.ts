import { prisma } from "../../db/prisma.js";
import type { CompatModelItem } from "../../types/compat.js";

export class ModelCatalogService {
  async getCompatModels(allowedModelKeys?: string[]): Promise<CompatModelItem[]> {
    // 1. Fetch all available and selectable models from Supabase
    const models = await prisma.riekoModel.findMany({
      where: {
        isAvailable: true,
        isManualSelectable: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    // 2. Map the DB rows to the legacy desktop format
    const allModels: CompatModelItem[] = models.map(m => ({
      provider: m.providerLabel,
      name: m.displayName,
      id: m.routingKey,
      model: m.routingKey,
      description: "Managed by Rieko Cloud",
      modality: m.modality,
      isAvailable: m.isAvailable
    }));

    // 3. Security: If no keys allowed by billing, return empty list
    if (!allowedModelKeys || allowedModelKeys.length === 0) {
      return [];
    }

    // 4. Filter the DB results based on the billing service's allow-list
    return allModels.filter(m => allowedModelKeys.includes(m.id));
  }
}
