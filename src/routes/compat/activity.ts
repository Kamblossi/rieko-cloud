import { Router } from "express";
import { z } from "zod";
import { ActivityService } from "../../modules/usage/activity.service.js";

const router = Router();
const activityService = new ActivityService();

const activitySchema = z.object({
  license: z.string().default(""),
  instance: z.string().default(""),
  machine_id: z.string().default(""),
  app_version: z.string().default(""),
  ai_model: z.string().default("")
}).passthrough();

router.post("/activity", async (req, res, next) => {
  try {
    const event = activitySchema.parse(req.body);
    await activityService.track(event);
    res.status(202).json({ accepted: true });
  } catch (error) {
    next(error);
  }
});

router.get("/activity", async (req, res, next) => {
  try {
    const licenseKey =
      typeof req.headers["license_key"] === "string" ? req.headers["license_key"] : "";
    const summary = await activityService.getSummary(licenseKey);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export { router as compatActivityRouter };
