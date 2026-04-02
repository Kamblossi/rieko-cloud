import { OpenRouterService } from "../providers/openrouter/openrouter.service.js";

const AUDIO_MODEL_MAP: Record<string, string> = {
  "audio-auto": "google/gemini-2.5-flash",
  auto: "google/gemini-2.5-flash",
};

type SupportedAudioFormat = "wav" | "mp3" | "m4a" | "flac" | "webm" | "aac" | "ogg";

export class AudioRuntimeUpstreamError extends Error {
  readonly statusCode: number;
  readonly details: string;

  constructor(statusCode: number, details: string) {
    super(`Audio transcription request failed (${statusCode}): ${details}`);
    this.name = "AudioRuntimeUpstreamError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export type AudioTranscriptionInput = {
  model: string;
  mimeType?: string;
  originalName?: string;
  buffer: Buffer;
};

function normalizeAudioFormat(
  mimeType?: string,
  originalName?: string,
): SupportedAudioFormat {
  const normalizedMime = mimeType?.toLowerCase();

  switch (normalizedMime) {
    case "audio/wav":
    case "audio/x-wav":
    case "audio/wave":
      return "wav";
    case "audio/mpeg":
    case "audio/mp3":
      return "mp3";
    case "audio/mp4":
    case "audio/x-m4a":
    case "audio/m4a":
      return "m4a";
    case "audio/flac":
    case "audio/x-flac":
      return "flac";
    case "audio/webm":
      return "webm";
    case "audio/aac":
      return "aac";
    case "audio/ogg":
      return "ogg";
    default:
      break;
  }

  const extension = originalName?.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "wav":
      return "wav";
    case "mp3":
      return "mp3";
    case "m4a":
      return "m4a";
    case "flac":
      return "flac";
    case "webm":
      return "webm";
    case "aac":
      return "aac";
    case "ogg":
      return "ogg";
    default:
      return "wav";
  }
}

function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part && typeof part === "object") {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }

        return "";
      })
      .join(" ")
      .trim();
  }

  return "";
}

export class AudioRuntimeService {
  private readonly openRouterService = new OpenRouterService();

  async transcribe(input: AudioTranscriptionInput): Promise<{ text: string }> {
    const requestedModel = input.model?.trim() || "audio-auto";
    const upstreamModel = AUDIO_MODEL_MAP[requestedModel] ?? AUDIO_MODEL_MAP["audio-auto"];
    const audioFormat = normalizeAudioFormat(input.mimeType, input.originalName);
    const audioBase64 = input.buffer.toString("base64");

    const response = await this.openRouterService.createAudioTranscription({
      model: upstreamModel,
      audioBase64,
      audioFormat,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AudioRuntimeUpstreamError(response.status, errorText);
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: unknown;
        };
      }>;
      text?: unknown;
      transcription?: unknown;
      result?: unknown;
    };

    const choiceText = extractTextFromContent(payload.choices?.[0]?.message?.content);
    const fallbackText =
      typeof payload.text === "string"
        ? payload.text.trim()
        : typeof payload.transcription === "string"
          ? payload.transcription.trim()
          : typeof payload.result === "string"
            ? payload.result.trim()
            : "";

    const text = choiceText || fallbackText;

    if (!text) {
      throw new Error("Audio transcription response did not include text");
    }

    return { text };
  }
}
