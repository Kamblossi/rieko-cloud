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

export class PromptTemplateService {
  async list(): Promise<CompatPromptsResponse> {
    const templates = await prisma.promptTemplate.findMany({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
      select: { title: true, prompt: true, defaultModelKey: true, updatedAt: true }
    });

      const prompts: CompatPromptItem[] = (
      templates as Array<{ title: string; prompt: string; defaultModelKey: string; updatedAt: Date }>
      ).map((t) => ({
      title: t.title,
      prompt: t.prompt,
      modelId: t.defaultModelKey || "auto",
      modelName: t.defaultModelKey === "auto" ? "Auto" : t.defaultModelKey
    }));

    const lastUpdated =
      templates.length > 0 ? templates[0].updatedAt.toISOString() : "2026-04-02T00:00:00.000Z";

    const promptsWithFallback =
      prompts.length > 0
        ? prompts
        : [
            {
              title: "Interview Copilot",
              prompt: "You are an interview assistant...",
              modelId: "auto",
              modelName: "Auto"
            }
          ];

    return {
      prompts: promptsWithFallback,
      total: promptsWithFallback.length,
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
