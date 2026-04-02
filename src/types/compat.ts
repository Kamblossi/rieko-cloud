export interface CompatModelItem {
  id: string;
  name: string;
  provider: "openrouter" | "portkey";
  contextWindow: number;
}

export interface CompatPromptTemplate {
  key: string;
  title: string;
  body: string;
}

export interface CompatResponseConfig {
  temperature: number;
  maxTokens: number;
}

export interface UsageActivityInput {
  userId: string;
  eventType: string;
  payload: Record<string, unknown>;
}
