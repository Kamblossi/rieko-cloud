import { Router } from "express";
import { PromptTemplateService } from "../../modules/prompts/prompt-template.service.js";

const router = Router();
const promptTemplateService = new PromptTemplateService();

router.get("/prompts", async (_req, res, next) => {
  try {
    const prompts = await promptTemplateService.list();
    res.json({ prompts });
  } catch (error) {
    next(error);
  }
});

export { router as compatPromptsRouter };
