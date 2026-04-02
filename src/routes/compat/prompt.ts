import { Router } from "express";
import { z } from "zod";
import { ModelPolicyError } from "../../modules/models/model-policy.service.js";
import { RoutingResolutionError } from "../../modules/models/routing.service.js";
import { PromptTemplateService } from "../../modules/prompts/prompt-template.service.js";

const router = Router();
const promptTemplateService = new PromptTemplateService();

const bodySchema = z.object({
  user_prompt: z.string().trim().min(1)
});

router.post("/prompt", async (req, res, next) => {
  try {
    const { user_prompt } = bodySchema.parse(req.body);
    const result = await promptTemplateService.generateSystemPrompt(user_prompt);
    res.json(result);
  } catch (error) {
    if (error instanceof ModelPolicyError || error instanceof RoutingResolutionError) {
      res.status(error.statusCode).json({
        error: error.name,
        reason: error.reason,
        message: error.message,
        requestId: req.requestId,
      });
      return;
    }

    next(error);
  }
});

export { router as compatPromptRouter };
