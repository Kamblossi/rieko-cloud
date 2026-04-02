import { OpenRouterService } from "../providers/openrouter/openrouter.service.js";

const MODEL_MAP: Record<string, string> = {
  auto: "openai/gpt-4.1-mini",
  fast: "openai/gpt-4.1-mini",
  premium: "anthropic/claude-3.7-sonnet",
  vision: "google/gemini-2.5-flash",
  code: "anthropic/claude-3.7-sonnet",
};

export type RuntimeChatInput = {
  model: string;
  messages: Array<{
    role: string;
    content?: unknown;
    name?: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
};

export class ChatRuntimeService {
  private readonly openRouterService = new OpenRouterService();

  async createChatCompletion(input: RuntimeChatInput): Promise<Response> {
    const requestedModel = input.model?.trim() || "auto";
    const upstreamModel = MODEL_MAP[requestedModel] ?? MODEL_MAP.auto;

    const payload = {
      ...input,
      model: upstreamModel,
      messages: input.messages.map((message) => ({
        ...message,
        content: message.content ?? "",
      })),
      stream: input.stream ?? true,
    };

    return this.openRouterService.createChatCompletion(payload);
  }
}
