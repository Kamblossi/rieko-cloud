export interface CompatModelItem {
  provider: string;
  name: string;
  id: string;
  model: string;
  description: string;
  modality: string;
  isAvailable: boolean;
}

export interface CompatPromptItem {
  title: string;
  prompt: string;
  modelId: string;
  modelName: string;
}

export interface CompatPromptsResponse {
  prompts: CompatPromptItem[];
  total: number;
  last_updated: string | null;
}

export interface UserAudioHeader {
  key: string;
  value: string;
}

export interface UserAudioConfig {
  url: string;
  fallback_url: string | null;
  model: string;
  fallback_model: string | null;
  user_token: string;
  fallback_user_token: string | null;
  headers: UserAudioHeader[];
}

export interface CompatResponsePayload {
  url: string;
  user_token: string;
  model: string;
  body: string;
  customer_id: number | null;
  customer_email: string | null;
  customer_name: string | null;
  license_key: string;
  instance_id: string;
  user_audio: UserAudioConfig;
  errors: string[];
}

export interface DesktopActivityInput {
  license: string;
  instance: string;
  machine_id: string;
  app_version: string;
  ai_model: string;
  [key: string]: unknown;
}
