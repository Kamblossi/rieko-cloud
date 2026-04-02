import { OpenRouterService } from "../providers/openrouter/openrouter.service.js";
import { ModelPolicyService } from "../models/model-policy.service.js";
import { RoutingService } from "../models/routing.service.js";
import type { CapabilityContext } from "../billing/billing-capabilities.service.js";

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
  private readonly modelPolicyService = new ModelPolicyService();
  private readonly routingService = new RoutingService();

  async createChatCompletion(
    input: RuntimeChatInput,
    capabilityContext?: CapabilityContext,
  ): Promise<Response> {
    const requestedModel = input.model?.trim() || "auto";
    const hasVisionInput = containsVisionInput(input.messages);

    const allowed = await this.modelPolicyService.validateModelForModality({
      requestedModelKey: requestedModel,
      modality: "text",
      capabilityContext,
    });

    const route = await this.routingService.resolveChatRoute({
      requestedModelKey: allowed.modelKey,
      hasVisionInput,
    });

    const payload = {
      ...input,
      model: route.upstreamModel,
      messages: input.messages.map((message) => ({
        ...message,
        content: message.content ?? "",
      })),
      stream: input.stream ?? true,
      temperature: input.temperature ?? route.temperature,
      max_tokens: input.max_tokens ?? route.maxTokens,
    };

    return this.openRouterService.createChatCompletion(payload);
  }
}

function containsVisionInput(
  messages: Array<{
    role: string;
    content?: unknown;
    name?: string;
  }>,
): boolean {
  return messages.some((message) => hasVisionContent(message.content));
}

function hasVisionContent(content: unknown): boolean {
  if (!content) {
    return false;
  }

  if (Array.isArray(content)) {
    return content.some((item) => hasVisionContent(item));
  }

  if (typeof content === "object") {
    const asRecord = content as Record<string, unknown>;
    const type = typeof asRecord.type === "string" ? asRecord.type : "";

    if (
      type === "image_url" ||
      type === "input_image" ||
      type === "image" ||
      "image_url" in asRecord ||
      "input_image" in asRecord
    ) {
      return true;
    }

    return Object.values(asRecord).some((value) => hasVisionContent(value));
  }

  return false;
}
