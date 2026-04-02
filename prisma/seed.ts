import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODEL_SEEDS = [
  {
    routingKey: "auto",
    displayName: "Auto",
    providerLabel: "Rieko Cloud",
    modality: "text",
    isAvailable: true,
    sortOrder: 0,
    isManualSelectable: false,
  },
  {
    routingKey: "fast",
    displayName: "Fast",
    providerLabel: "Rieko Cloud",
    modality: "text",
    isAvailable: true,
    sortOrder: 10,
    isManualSelectable: true,
  },
  {
    routingKey: "premium",
    displayName: "Premium",
    providerLabel: "Rieko Cloud",
    modality: "text",
    isAvailable: true,
    sortOrder: 20,
    isManualSelectable: true,
  },
  {
    routingKey: "vision",
    displayName: "Vision",
    providerLabel: "Rieko Cloud",
    modality: "vision",
    isAvailable: true,
    sortOrder: 30,
    isManualSelectable: true,
  },
  {
    routingKey: "code",
    displayName: "Code",
    providerLabel: "Rieko Cloud",
    modality: "text",
    isAvailable: true,
    sortOrder: 40,
    isManualSelectable: true,
  },
  {
    routingKey: "audio",
    displayName: "Audio",
    providerLabel: "Rieko Cloud",
    modality: "audio",
    isAvailable: true,
    sortOrder: 50,
    isManualSelectable: true,
  },
] as const;

const PROMPT_SEEDS = [
  {
    title: "Interview Copilot",
    prompt:
      "You are an interview coaching assistant. Help the user answer clearly, structure responses using STAR when useful, and keep answers concise and professional.",
    defaultModelKey: "auto",
  },
  {
    title: "Meeting Notes Assistant",
    prompt:
      "You are a meeting notes assistant. Convert rough notes into clear action items, decisions, risks, and owners with concise bullets.",
    defaultModelKey: "fast",
  },
  {
    title: "Quick Rewrite",
    prompt:
      "Rewrite user text for clarity and impact while preserving intent. Return the revised version first, then brief optional alternatives.",
    defaultModelKey: "fast",
  },
  {
    title: "Research Summary",
    prompt:
      "Summarize complex material into key findings, evidence quality, and open questions. Keep the output factual and structured.",
    defaultModelKey: "premium",
  },
  {
    title: "Coding Assistant",
    prompt:
      "You are a senior coding assistant. Give practical, testable guidance with concrete code changes and edge-case handling.",
    defaultModelKey: "code",
  },
  {
    title: "Transcription Cleanup",
    prompt:
      "Clean up raw transcription text by fixing punctuation and obvious speech artifacts without changing meaning.",
    defaultModelKey: "audio",
  },
] as const;

const ROUTING_PROFILE_SEEDS = [
  {
    taskType: "CHAT_FAST",
    modality: "text",
    latencyPreference: "low",
    preferredModelKey: "fast",
    fallbackJson: { modelKeys: ["premium"] },
    maxTokens: 4096,
    temperature: 0.3,
    active: true,
  },
  {
    taskType: "CHAT_DEEP",
    modality: "text",
    latencyPreference: "balanced",
    preferredModelKey: "premium",
    fallbackJson: { modelKeys: ["fast"] },
    maxTokens: 8192,
    temperature: 0.3,
    active: true,
  },
  {
    taskType: "CODE_ASSIST",
    modality: "text",
    latencyPreference: "balanced",
    preferredModelKey: "code",
    fallbackJson: { modelKeys: ["premium", "fast"] },
    maxTokens: 8192,
    temperature: 0.2,
    active: true,
  },
  {
    taskType: "VISION_SCREEN",
    modality: "vision",
    latencyPreference: "balanced",
    preferredModelKey: "vision",
    fallbackJson: { modelKeys: ["premium", "fast"] },
    maxTokens: 4096,
    temperature: 0.2,
    active: true,
  },
  {
    taskType: "TRANSCRIBE_CLEANUP",
    modality: "audio",
    latencyPreference: "low",
    preferredModelKey: "audio",
    fallbackJson: { modelKeys: ["audio-auto"] },
    maxTokens: 4096,
    temperature: 0,
    active: true,
  },
  {
    taskType: "PROMPT_REWRITE",
    modality: "text",
    latencyPreference: "balanced",
    preferredModelKey: "fast",
    fallbackJson: { modelKeys: ["premium"] },
    maxTokens: 1024,
    temperature: 0.2,
    active: true,
  },
] as const;

async function main(): Promise<void> {
  for (const model of MODEL_SEEDS) {
    await prisma.riekoModel.upsert({
      where: { routingKey: model.routingKey },
      update: {
        displayName: model.displayName,
        providerLabel: model.providerLabel,
        modality: model.modality,
        isAvailable: model.isAvailable,
        sortOrder: model.sortOrder,
        isManualSelectable: model.isManualSelectable,
      },
      create: {
        displayName: model.displayName,
        providerLabel: model.providerLabel,
        routingKey: model.routingKey,
        modality: model.modality,
        isAvailable: model.isAvailable,
        sortOrder: model.sortOrder,
        isManualSelectable: model.isManualSelectable,
      },
    });
  }

  for (const prompt of PROMPT_SEEDS) {
    const existingPrompt = await prisma.promptTemplate.findFirst({
      where: { title: prompt.title },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (existingPrompt) {
      await prisma.promptTemplate.update({
        where: { id: existingPrompt.id },
        data: {
          prompt: prompt.prompt,
          defaultModelKey: prompt.defaultModelKey,
          active: true,
        },
      });
      continue;
    }

    await prisma.promptTemplate.create({
      data: {
        title: prompt.title,
        prompt: prompt.prompt,
        defaultModelKey: prompt.defaultModelKey,
        active: true,
      },
    });
  }

  for (const profile of ROUTING_PROFILE_SEEDS) {
    const existingProfile = await prisma.routingProfile.findFirst({
      where: {
        taskType: profile.taskType,
        modality: profile.modality,
      },
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (existingProfile) {
      await prisma.routingProfile.update({
        where: { id: existingProfile.id },
        data: {
          latencyPreference: profile.latencyPreference,
          preferredModelKey: profile.preferredModelKey,
          fallbackJson: profile.fallbackJson,
          maxTokens: profile.maxTokens,
          temperature: profile.temperature,
          active: profile.active,
        },
      });
      continue;
    }

    await prisma.routingProfile.create({
      data: {
        taskType: profile.taskType,
        modality: profile.modality,
        latencyPreference: profile.latencyPreference,
        preferredModelKey: profile.preferredModelKey,
        fallbackJson: profile.fallbackJson,
        maxTokens: profile.maxTokens,
        temperature: profile.temperature,
        active: profile.active,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
