import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { cloudSessionAuth } from "../../middleware/cloud-session-auth.js";
import { AudioRuntimeService, AudioRuntimeUpstreamError } from "../../modules/runtime/audio-runtime.service.js";
import { ModelPolicyError } from "../../modules/models/model-policy.service.js";
import { RoutingResolutionError } from "../../modules/models/routing.service.js";
import { ActivityService } from "../../modules/usage/activity.service.js";
import { TrialQuotaExceededError, TrialQuotaService } from "../../modules/usage/trial-quota.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const audioRuntimeService = new AudioRuntimeService();
const trialQuotaService = new TrialQuotaService();
const activityService = new ActivityService();

const bodySchema = z.object({
  model: z.string().min(1),
}).passthrough();

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

      if (req.auth?.licenseKey) {
        await trialQuotaService.assertCanConsume(
          { licenseKey: req.auth.licenseKey },
          req.auth.capabilities,
        );
      }

      const result = await audioRuntimeService.transcribe({
        model: parsed.model,
        mimeType: req.file.mimetype || "audio/wav",
        originalName: req.file.originalname,
        buffer: req.file.buffer,
      }, {
        isAdmin: req.auth?.isAdmin,
        planCode: req.auth?.planCode,
        tier: req.auth?.tier,
        capabilities: req.auth?.capabilities,
      });

      if (req.auth?.licenseKey && req.auth.machineId && req.auth.instanceId) {
        await activityService.recordQuotaConsumption({
          licenseKey: req.auth.licenseKey,
          machineId: req.auth.machineId,
          instanceId: req.auth.instanceId,
          modelKey: parsed.model,
          eventType: "runtime_audio_transcription",
          metadata: {
            sessionId: req.auth.sessionId ?? null,
          },
        });
      }

      res.status(200).json({ text: result.text });
    } catch (error) {
      if (error instanceof TrialQuotaExceededError) {
        res.status(error.statusCode).json({
          error: error.reason,
          message: error.message,
          requestId: req.requestId,
        });
        return;
      }

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
