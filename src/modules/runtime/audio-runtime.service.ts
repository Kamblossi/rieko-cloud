export class AudioRuntimeService {
  async transcribe(_input: { audioBase64: string; model?: string }): Promise<{ text: string }> {
    return { text: "Audio runtime is not enabled yet in RC-1." };
  }
}
