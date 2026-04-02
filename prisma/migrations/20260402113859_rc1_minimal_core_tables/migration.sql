-- CreateTable
CREATE TABLE "CloudSession" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "planCode" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiekoModel" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "providerLabel" TEXT NOT NULL,
    "routingKey" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isManualSelectable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiekoModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "defaultModelKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "usageJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingProfile" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "latencyPreference" TEXT,
    "preferredModelKey" TEXT NOT NULL,
    "fallbackJson" JSONB,
    "maxTokens" INTEGER,
    "temperature" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoutingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CloudSession_licenseKey_machineId_createdAt_idx" ON "CloudSession"("licenseKey", "machineId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RiekoModel_routingKey_key" ON "RiekoModel"("routingKey");

-- CreateIndex
CREATE INDEX "RiekoModel_isAvailable_sortOrder_idx" ON "RiekoModel"("isAvailable", "sortOrder");

-- CreateIndex
CREATE INDEX "PromptTemplate_active_updatedAt_idx" ON "PromptTemplate"("active", "updatedAt");

-- CreateIndex
CREATE INDEX "UsageEvent_licenseKey_createdAt_idx" ON "UsageEvent"("licenseKey", "createdAt");

-- CreateIndex
CREATE INDEX "RoutingProfile_taskType_modality_active_idx" ON "RoutingProfile"("taskType", "modality", "active");
