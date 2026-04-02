import { env } from "../../../config/env.js";

export class PortkeyService {
  getConfig(): { apiKey?: string; baseUrl: string; defaultConfigId?: string } {
    return {
      apiKey: env.PORTKEY_API_KEY,
      baseUrl: env.PORTKEY_BASE_URL,
      defaultConfigId: env.PORTKEY_DEFAULT_CONFIG_ID
    };
  }
}
