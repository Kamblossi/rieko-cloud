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

export type OpenRouterAudioTranscriptionInput = {
  model: string;
  audioBase64: string;
  audioFormat: "wav" | "mp3" | "m4a" | "flac" | "webm" | "aac" | "ogg";
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

  async createAudioTranscription(
    input: OpenRouterAudioTranscriptionInput,
  ): Promise<Response> {
    return fetch(`${this.baseUrl}/chat/completions`, {
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
      body: JSON.stringify({
        model: input.model,
        messages: [
          {
            role: "system",
            content:
              "You are a transcription engine. Transcribe the audio faithfully and return only the transcription text.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please transcribe this audio file.",
              },
              {
                type: "input_audio",
                input_audio: {
                  type: "base64",
                  data: input.audioBase64,
                  format: input.audioFormat,
                },
              },
            ],
          },
        ],
        stream: false,
        temperature: 0,
      }),
    });
  }
}
