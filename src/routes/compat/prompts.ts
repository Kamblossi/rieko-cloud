import { Router } from "express";
import { PromptTemplateService } from "../../modules/prompts/prompt-template.service.js";

const router = Router();
const promptTemplateService = new PromptTemplateService();

router.post("/prompts", async (_req, res, next) => {
  try {
    const result = await promptTemplateService.list();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as compatPromptsRouter };
