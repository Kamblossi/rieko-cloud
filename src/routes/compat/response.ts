import { Router } from "express";
import { z } from "zod";
import { ResponseConfigService } from "../../modules/response/response-config.service.js";

const router = Router();
const responseConfigService = new ResponseConfigService();

const responseSchema = z.object({
  userId: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive().max(32000)
});

router.get("/response", async (req, res, next) => {
  try {
    const userId = typeof req.query.userId === "string" ? req.query.userId : "desktop-compat";
    const config = await responseConfigService.getForUser(userId);
    res.json({ config });
  } catch (error) {
    next(error);
  }
});

router.post("/response", async (req, res, next) => {
  try {
    const input = responseSchema.parse(req.body);
    const config = await responseConfigService.updateForUser(input.userId, {
      temperature: input.temperature,
      maxTokens: input.maxTokens
    });
    res.json({ config });
  } catch (error) {
    next(error);
  }
});

export { router as compatResponseRouter };
