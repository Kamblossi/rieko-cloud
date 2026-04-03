import { prisma } from "../../db/prisma.js";
import { OpenRouterService } from "../providers/openrouter/openrouter.service.js";
import { ModelPolicyService } from "../models/model-policy.service.js";
import { RoutingService } from "../models/routing.service.js";
import type { CompatPromptItem, CompatPromptsResponse } from "../../types/compat.js";
import type { CapabilityContext } from "../billing/billing-capabilities.service.js";

function toModelName(modelKey: string): string {
  switch (modelKey) {
    case "auto":
      return "Auto";
    case "fast":
      return "Fast";
    case "premium":
      return "Premium";
    case "vision":
      return "Vision";
    case "code":
      return "Code";
    case "audio":
    case "audio-auto":
      return "Audio";
    default:
      return modelKey;
  }
}

export class PromptTemplateService {
  private readonly openRouterService = new OpenRouterService();
  private readonly modelPolicyService = new ModelPolicyService();
  private readonly routingService = new RoutingService();

  async list(): Promise<CompatPromptsResponse> {
    const templates = await prisma.promptTemplate.findMany({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
      select: { title: true, prompt: true, defaultModelKey: true, updatedAt: true }
    });

    const prompts: CompatPromptItem[] = (
      templates as Array<{
        title: string;
        prompt: string;
        defaultModelKey: string;
        updatedAt: Date;
      }>
    ).map((t) => ({
      title: t.title,
      prompt: t.prompt,
      modelId: t.defaultModelKey || "auto",
      modelName: toModelName(t.defaultModelKey || "auto")
    }));

    const lastUpdated = templates.length > 0 ? templates[0].updatedAt.toISOString() : null;

    return {
      prompts,
      total: prompts.length,
      last_updated: lastUpdated
    };
  }

  async generateSystemPrompt(
    userPrompt: string,
    capabilityContext?: CapabilityContext,
  ): Promise<{ prompt_name: string; system_prompt: string; model_key: string }> {
    const trimmedPrompt = userPrompt.trim();
    if (!trimmedPrompt) {
      throw new Error("Prompt generation requires a non-empty user_prompt");
    }

    const allowed = await this.modelPolicyService.validateModelForModality({
      requestedModelKey: "auto",
      modality: "prompt",
      capabilityContext,
    });
    const route = await this.routingService.resolvePromptRoute();

    const response = await this.openRouterService.createChatCompletion({
      model: route.upstreamModel,
      messages: [
        {
          role: "system",
          content:
            "You generate production-ready system prompts for desktop AI assistants. Return only the final system prompt text. Do not add explanations, markdown, headings, or quotation marks."
        },
        { role: "user", content: trimmedPrompt }
      ],
      stream: false,
      max_tokens: route.maxTokens ?? 1024,
      temperature: route.temperature ?? 0.2,
      metadata: {
        rieko_routing_profile_id: route.routingProfileId,
        rieko_task_type: route.taskType,
        rieko_model_key: allowed.modelKey,
      }
    });

    if (!response.ok) {
      throw new Error(`Prompt generation failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | Array<{ type?: string; text?: string }>;
        };
      }>;
    };

    const rawContent = data.choices?.[0]?.message?.content;
    const systemPrompt =
      typeof rawContent === "string"
        ? rawContent.trim()
        : Array.isArray(rawContent)
          ? rawContent
              .map((part) => (part && typeof part.text === "string" ? part.text : ""))
              .join("\n")
              .trim()
          : "";

    if (!systemPrompt) {
      throw new Error("Prompt generation returned empty output");
    }

    return {
      prompt_name: "Generated Prompt",
      system_prompt: systemPrompt,
      model_key: allowed.modelKey,
    };
  }
}
