import type { CompatModelItem } from "../../types/compat.js";

export class ModelCatalogService {
  getCompatModels(): CompatModelItem[] {
    return [
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
  }
}
