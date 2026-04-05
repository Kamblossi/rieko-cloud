import type { CompatModelItem } from "../../types/compat.js";

export class ModelCatalogService {
  async getCompatModels(allowedModelKeys?: string[]): Promise<CompatModelItem[]> {
    // Diagnostic Logs
    console.log("model-catalog allowed keys", allowedModelKeys);

    const allModels: CompatModelItem[] = [
      {
        provider: "Rieko Cloud",
        name: "Auto",
        id: "auto",
        model: "auto",
        description: "Let Rieko Cloud choose the best model.",
        modality: "text",
        isAvailable: true
      }
    ];

    // Diagnostic Logs for the data source
    console.log("model-catalog rows", allModels.map((m) => m.id));

    if (!allowedModelKeys) return allModels;

    return allModels.filter(m => allowedModelKeys.includes(m.id));
  }
}
