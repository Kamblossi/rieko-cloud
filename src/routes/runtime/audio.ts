import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { cloudSessionAuth } from "../../middleware/cloud-session-auth.js";
import {
  AudioRuntimeService,
  AudioRuntimeUpstreamError,
} from "../../modules/runtime/audio-runtime.service.js";
import { ModelPolicyError } from "../../modules/models/model-policy.service.js";
import { RoutingResolutionError } from "../../modules/models/routing.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const audioRuntimeService = new AudioRuntimeService();

const bodySchema = z
  .object({
    model: z.string().min(1),
  })
  .passthrough();

router.post(
  "/audio",
  cloudSessionAuth,
  upload.single("file"),
  async (req, res, next) => {
    try {
      const parsed = bodySchema.parse(req.body);

      if (!req.file) {
        res.status(400).json({
          error: "Bad Request",
          message: "Missing audio file",
          requestId: req.requestId,
        });
        return;
      }

      console.info("[runtime/audio] request", {
        requestId: req.requestId,
        model: parsed.model,
        mimeType: req.file.mimetype || "audio/wav",
        fileSize: req.file.size,
        sessionId: req.auth?.sessionId,
      });

      const result = await audioRuntimeService.transcribe({
        model: parsed.model,
        mimeType: req.file.mimetype || "audio/wav",
        originalName: req.file.originalname,
        buffer: req.file.buffer,
      }, {
        isAdmin: req.auth?.isAdmin,
        planCode: req.auth?.planCode,
      });

      res.status(200).json({ text: result.text });
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

      if (error instanceof AudioRuntimeUpstreamError) {
        res.status(error.statusCode).json({
          error: "Audio Upstream Error",
          message: error.message,
          requestId: req.requestId,
        });
        return;
      }

      next(error);
    }
  },
);

export { router as runtimeAudioRouter };
