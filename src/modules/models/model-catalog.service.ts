import type { CompatModelItem } from "../../types/compat.js";

export class ModelCatalogService {
  getCompatModels(): CompatModelItem[] {
    return [
      {
        id: "openrouter/openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "openrouter",
        contextWindow: 128000
      }
    ];
  }
}
