import { env } from "../../../config/env.js";

export class OpenRouterService {
  getConfig(): { apiKey: string; baseUrl: string } {
    return {
      apiKey: env.OPENROUTER_API_KEY,
      baseUrl: env.OPENROUTER_BASE_URL
    };
  }
}
