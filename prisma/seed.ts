import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.riekoModel.upsert({
    where: { routingKey: "auto" },
    update: {
      displayName: "Auto",
      providerLabel: "Rieko Cloud",
      modality: "text",
      isAvailable: true,
      sortOrder: 0,
      isManualSelectable: false
    },
    create: {
      displayName: "Auto",
      providerLabel: "Rieko Cloud",
      routingKey: "auto",
      modality: "text",
      isAvailable: true,
      sortOrder: 0,
      isManualSelectable: false
    }
  });

  const existingPrompt = await prisma.promptTemplate.findFirst({
    where: { title: "Interview Copilot" },
    orderBy: { updatedAt: "desc" },
    select: { id: true }
  });

  if (existingPrompt) {
    await prisma.promptTemplate.update({
      where: { id: existingPrompt.id },
      data: {
        prompt: "You are an interview assistant...",
        defaultModelKey: "auto",
        active: true
      }
    });
  } else {
    await prisma.promptTemplate.create({
      data: {
        title: "Interview Copilot",
        prompt: "You are an interview assistant...",
        defaultModelKey: "auto",
        active: true
      }
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
