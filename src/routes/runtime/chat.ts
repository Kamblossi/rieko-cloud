import { Router } from "express";
import { z } from "zod";
import { cloudSessionAuth } from "../../middleware/cloud-session-auth.js";
import { ChatRuntimeService } from "../../modules/runtime/chat-runtime.service.js";
import { ModelPolicyError } from "../../modules/models/model-policy.service.js";
import { RoutingResolutionError } from "../../modules/models/routing.service.js";
import { ActivityService } from "../../modules/usage/activity.service.js";
import { TrialQuotaExceededError, TrialQuotaService } from "../../modules/usage/trial-quota.service.js";

const router = Router();
const chatRuntimeService = new ChatRuntimeService();
const trialQuotaService = new TrialQuotaService();
const activityService = new ActivityService();

const messageSchema = z.object({
  role: z.string().min(1),
  content: z.unknown(),
  name: z.string().min(1).optional(),
});

const bodySchema = z.object({
  model: z.string().min(1),
  messages: z.array(messageSchema).min(1),
  stream: z.boolean().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().int().positive().optional(),
}).passthrough();

router.post("/chat", cloudSessionAuth, async (req, res, next) => {
  try {
    const parsed = bodySchema.parse(req.body);

    console.info("[runtime/chat] request", {
      requestId: req.requestId,
      model: parsed.model,
      stream: parsed.stream ?? true,
      messageCount: parsed.messages.length,
      sessionId: req.auth?.sessionId,
    });

    if (req.auth?.licenseKey) {
      await trialQuotaService.assertCanConsume(
        { licenseKey: req.auth.licenseKey },
        req.auth.capabilities,
      );
    }

    const upstream = await chatRuntimeService.createChatCompletion(parsed, {
      isAdmin: req.auth?.isAdmin,
      planCode: req.auth?.planCode,
      tier: req.auth?.tier,
      capabilities: req.auth?.capabilities,
    });
    const contentType = upstream.headers.get("content-type") ?? "application/json";

    console.info("[runtime/chat] upstream", {
      requestId: req.requestId,
      status: upstream.status,
      contentType,
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      res.status(upstream.status).type(contentType).send(errorText);
      return;
    }

    if (req.auth?.licenseKey && req.auth.machineId && req.auth.instanceId) {
      await activityService.recordQuotaConsumption({
        licenseKey: req.auth.licenseKey,
        machineId: req.auth.machineId,
        instanceId: req.auth.instanceId,
        modelKey: parsed.model,
        eventType: "runtime_chat_completion",
        metadata: {
          sessionId: req.auth.sessionId ?? null,
          stream: parsed.stream ?? true,
        },
      });
    }

    if ((parsed.stream ?? true) && upstream.body) {
      res.status(200);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }

      res.end();
      return;
    }

    const text = await upstream.text();
    res.status(200).type(contentType).send(text);
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

    next(error);
  }
});

export { router as runtimeChatRouter };
