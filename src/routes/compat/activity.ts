import { Router } from "express";
import { z } from "zod";
import { ActivityService } from "../../modules/usage/activity.service.js";

const router = Router();
const activityService = new ActivityService();

const activitySchema = z.object({
  event_type: z.string().trim().min(1),
  model: z.string().trim().optional(),
  usage: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
}).passthrough();

router.post("/activity", async (req, res, next) => {
  try {
    const event = activitySchema.parse(req.body);
    const identity = resolveIdentity(req.headers, {
      licenseKey:
        typeof req.body?.license === "string" ? req.body.license : "",
      machineId:
        typeof req.body?.machine_id === "string" ? req.body.machine_id : "",
      instanceId:
        typeof req.body?.instance === "string" ? req.body.instance : "",
    });

    await activityService.recordEvent(identity, event);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/activity", async (req, res, next) => {
  try {
    const identity = resolveIdentity(req.headers);
    const summary = await activityService.getActivitySummary(identity);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export { router as compatActivityRouter };

function resolveIdentity(
  headers: Record<string, unknown>,
  fallback?: { licenseKey?: string; machineId?: string; instanceId?: string },
): { licenseKey: string; machineId: string; instanceId: string } {
  const licenseKey =
    typeof headers["license_key"] === "string"
      ? headers["license_key"].trim()
      : (fallback?.licenseKey ?? "").trim();
  const machineId =
    typeof headers["machine_id"] === "string"
      ? headers["machine_id"].trim()
      : (fallback?.machineId ?? "").trim();
  const instanceId =
    typeof headers["instance"] === "string"
      ? headers["instance"].trim()
      : (fallback?.instanceId ?? "").trim();

  return { licenseKey, machineId, instanceId };
}
