import { OpenRouterService } from "../providers/openrouter/openrouter.service.js";

export class ChatRuntimeService {
  private readonly openRouterService = new OpenRouterService();

  async runChat(input: { model: string; prompt: string; maxTokens?: number; temperature?: number }): Promise<{ text: string }> {
    const provider = this.openRouterService.getConfig();
    void input;
    void provider;

    return {
      text: "Chat runtime provider integration will be enabled in the next phase."
    };
  }
}
