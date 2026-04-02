import { Router } from "express";
import { z } from "zod";
import { AudioRuntimeService } from "../../modules/runtime/audio-runtime.service.js";

const router = Router();
const audioRuntimeService = new AudioRuntimeService();

const bodySchema = z.object({
  audioBase64: z.string().min(1),
  model: z.string().optional()
});

router.post("/audio", async (req, res, next) => {
  try {
    const input = bodySchema.parse(req.body);
    const result = await audioRuntimeService.transcribe(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as runtimeAudioRouter };
