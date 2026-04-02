import { Router } from "express";
import { z } from "zod";
import { PromptTemplateService } from "../../modules/prompts/prompt-template.service.js";

const router = Router();
const promptTemplateService = new PromptTemplateService();

const bodySchema = z.object({
  user_prompt: z.string().min(1)
});

router.post("/prompt", async (req, res, next) => {
  try {
    const { user_prompt } = bodySchema.parse(req.body);
    const result = await promptTemplateService.generateSystemPrompt(user_prompt);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as compatPromptRouter };
