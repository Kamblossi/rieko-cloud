export class ModelPolicyService {
  isModelAllowed(modelId: string): boolean {
    return modelId.startsWith("openrouter/") || modelId.startsWith("portkey/");
  }
}
