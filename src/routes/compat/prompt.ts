import { Router } from "express";
import { z } from "zod";
import { PromptTemplateService } from "../../modules/prompts/prompt-template.service.js";

const router = Router();
const promptTemplateService = new PromptTemplateService();

const bodySchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1)
});

router.post("/prompt", async (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    const prompt = await promptTemplateService.upsert(body.key, body.title, body.body);
    res.json({ prompt });
  } catch (error) {
    next(error);
  }
});

export { router as compatPromptRouter };
