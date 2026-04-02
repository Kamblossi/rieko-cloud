import { Router } from "express";
import { z } from "zod";
import { ActivityService } from "../../modules/usage/activity.service.js";

const router = Router();
const activityService = new ActivityService();

const activitySchema = z.object({
  userId: z.string().min(1),
  eventType: z.string().min(1),
  payload: z.record(z.unknown())
});

router.post("/activity", async (req, res, next) => {
  try {
    const event = activitySchema.parse(req.body);
    await activityService.track(event);
    res.status(202).json({ accepted: true });
  } catch (error) {
    next(error);
  }
});

export { router as compatActivityRouter };
