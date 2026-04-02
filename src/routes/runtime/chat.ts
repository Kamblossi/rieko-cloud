import { Router } from "express";
import { z } from "zod";
import { ChatRuntimeService } from "../../modules/runtime/chat-runtime.service.js";

const router = Router();
const chatRuntimeService = new ChatRuntimeService();

const bodySchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1),
  maxTokens: z.number().int().positive().max(32000).optional(),
  temperature: z.number().min(0).max(2).optional()
});

router.post("/chat", async (req, res, next) => {
  try {
    const input = bodySchema.parse(req.body);
    const result = await chatRuntimeService.runChat(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as runtimeChatRouter };
