import { Router } from "express";
import { z } from "zod";
import { ActivityService } from "../../modules/usage/activity.service.js";
import { resolveCompatIdentity } from "../../utils/compat-identity.js";

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
    const identity = resolveCompatIdentity(req.headers, {
      licenseKey: typeof req.body?.license === "string" ? req.body.license : "",
      machineId: typeof req.body?.machine_id === "string" ? req.body.machine_id : "",
      instanceId:
        typeof req.body?.instance === "string"
          ? req.body.instance
          : (typeof req.body?.instance_name === "string" ? req.body.instance_name : ""),
      appVersion: typeof req.body?.app_version === "string" ? req.body.app_version : undefined,
    });

    await activityService.recordEvent(identity, event);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/activity", async (req, res, next) => {
  try {
    const identity = resolveCompatIdentity(req.headers);
    const summary = await activityService.getActivitySummary(identity);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export { router as compatActivityRouter };
