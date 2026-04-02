import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import type { CompatPromptItem, CompatPromptsResponse } from "../../types/compat.js";

type FetchLike = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

const fetchLike = (globalThis as unknown as { fetch: FetchLike }).fetch;

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
    userPrompt: string
  ): Promise<{ prompt_name: string; system_prompt: string }> {
    const response = await fetchLike(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert system prompt engineer. Given the user's description, return ONLY the production-ready system prompt text. Do not include explanations, titles, markdown headers, or surrounding commentary."
          },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1024,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      throw new Error(`Prompt generation failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const systemPrompt = data.choices[0]?.message?.content?.trim() ?? "";

    return {
      prompt_name: "Generated Prompt",
      system_prompt: systemPrompt
    };
  }
}
