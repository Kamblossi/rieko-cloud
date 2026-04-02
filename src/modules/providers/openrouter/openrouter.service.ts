import { env } from "../../../config/env.js";

export type OpenRouterChatInput = {
  model: string;
  messages: Array<{
    role: string;
    content: unknown;
    name?: string;
  }>;
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
};

export class OpenRouterService {
  private readonly baseUrl = env.OPENROUTER_BASE_URL.replace(/\/+$/, "");

  async createChatCompletion(input: OpenRouterChatInput): Promise<Response> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "content-type": "application/json",
        ...(env.OPENROUTER_HTTP_REFERER
          ? { "HTTP-Referer": env.OPENROUTER_HTTP_REFERER }
          : {}),
        ...(env.OPENROUTER_APP_TITLE
          ? { "X-Title": env.OPENROUTER_APP_TITLE }
          : {}),
      },
      body: JSON.stringify(input),
    });

    return response;
  }
}
