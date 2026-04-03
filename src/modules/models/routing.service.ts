type JsonValue = unknown;
import { prisma } from "../../db/prisma.js";

const UPSTREAM_MODEL_MAP: Record<string, string> = {
  fast: "openai/gpt-4.1-mini",
  premium: "anthropic/claude-3.7-sonnet",
  vision: "google/gemini-2.5-flash",
  code: "anthropic/claude-3.7-sonnet",
  audio: "google/gemini-2.5-flash",
  "audio-auto": "google/gemini-2.5-flash",
};

export type RouteResolution = {
  routingProfileId: string;
  taskType: string;
  modelKey: string;
  upstreamModel: string;
  temperature?: number;
  maxTokens?: number;
};

export class RoutingResolutionError extends Error {
  readonly statusCode: number;
  readonly reason: string;

  constructor(statusCode: number, reason: string, message: string) {
    super(message);
    this.name = "RoutingResolutionError";
    this.statusCode = statusCode;
    this.reason = reason;
  }
}

export class RoutingService {
  async resolveChatRoute(input: {
    requestedModelKey: string;
    hasVisionInput?: boolean;
  }): Promise<RouteResolution> {
    const taskType = resolveChatTaskType(input.requestedModelKey, input.hasVisionInput === true);
    const modality = taskType === "VISION_SCREEN" ? "vision" : "text";
    const profile = await this.findProfile(taskType, modality);
    const manualOverrideModel = input.requestedModelKey !== "auto" ? input.requestedModelKey : null;

    return this.buildRouteResolution(profile, manualOverrideModel);
  }

  async resolvePromptRoute(): Promise<RouteResolution> {
    const profile = await this.findProfile("PROMPT_REWRITE", "text");
    return this.buildRouteResolution(profile, null);
  }

  async resolveAudioRoute(input: { requestedModelKey: string }): Promise<RouteResolution> {
    const profile = await this.findProfile("TRANSCRIBE_CLEANUP", "audio");
    const manualOverrideModel =
      input.requestedModelKey !== "auto" && input.requestedModelKey !== "audio-auto"
        ? input.requestedModelKey
        : null;

    return this.buildRouteResolution(profile, manualOverrideModel);
  }

  private async findProfile(taskType: string, modality: string): Promise<{
    id: string;
    taskType: string;
    preferredModelKey: string;
    fallbackJson: JsonValue | null;
    maxTokens: number | null;
    temperature: number | null;
  }> {
    const profile = await prisma.routingProfile.findFirst({
      where: {
        taskType,
        modality,
        active: true,
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        taskType: true,
        preferredModelKey: true,
        fallbackJson: true,
        maxTokens: true,
        temperature: true,
      },
    });

    if (!profile) {
      throw new RoutingResolutionError(
        500,
        "ROUTING_PROFILE_MISSING",
        `No active routing profile found for ${taskType}/${modality}`,
      );
    }

    return profile;
  }

  private buildRouteResolution(
    profile: {
      id: string;
      taskType: string;
      preferredModelKey: string;
      fallbackJson: JsonValue | null;
      maxTokens: number | null;
      temperature: number | null;
    },
    manualOverrideModel: string | null,
  ): RouteResolution {
    const fallbackCandidates = extractFallbackModelKeys(profile.fallbackJson);
    const candidates = [
      ...(manualOverrideModel ? [manualOverrideModel] : []),
      profile.preferredModelKey,
      ...fallbackCandidates,
    ];

    const selectedModelKey = candidates.find((key) => Boolean(UPSTREAM_MODEL_MAP[key]));

    if (!selectedModelKey) {
      throw new RoutingResolutionError(
        500,
        "UPSTREAM_MODEL_MAPPING_MISSING",
        `No upstream model mapping for routing profile ${profile.id}`,
      );
    }

    return {
      routingProfileId: profile.id,
      taskType: profile.taskType,
      modelKey: selectedModelKey,
      upstreamModel: UPSTREAM_MODEL_MAP[selectedModelKey],
      temperature: profile.temperature ?? undefined,
      maxTokens: profile.maxTokens ?? undefined,
    };
  }
}

function resolveChatTaskType(requestedModelKey: string, hasVisionInput: boolean): string {
  if (requestedModelKey === "code") {
    return "CODE_ASSIST";
  }

  if (requestedModelKey === "premium") {
    return "CHAT_DEEP";
  }

  if (requestedModelKey === "vision" || (requestedModelKey === "auto" && hasVisionInput)) {
    return "VISION_SCREEN";
  }

  return "CHAT_FAST";
}

function extractFallbackModelKeys(fallbackJson: JsonValue | null): string[] {
  if (!fallbackJson) {
    return [];
  }

  if (Array.isArray(fallbackJson)) {
    return fallbackJson.filter((value): value is string => typeof value === "string");
  }

  if (typeof fallbackJson === "object") {
    const modelKeys = (fallbackJson as { modelKeys?: unknown }).modelKeys;
    if (Array.isArray(modelKeys)) {
      return modelKeys.filter((value): value is string => typeof value === "string");
    }
  }

  return [];
}