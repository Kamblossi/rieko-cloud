-- AlterTable
ALTER TABLE "CloudSession" ADD COLUMN     "capabilities_json" JSONB,
ADD COLUMN     "tier" TEXT;

-- AlterTable
ALTER TABLE "UsageEvent" ADD COLUMN     "consumes_quota" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "event_type" TEXT NOT NULL DEFAULT 'generic';

-- CreateIndex
CREATE INDEX "UsageEvent_licenseKey_consumes_quota_createdAt_idx" ON "UsageEvent"("licenseKey", "consumes_quota", "createdAt");
