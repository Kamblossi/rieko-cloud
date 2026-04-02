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
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
