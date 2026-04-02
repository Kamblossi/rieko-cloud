import { Router } from "express";
import { z } from "zod";
import { cloudSessionAuth } from "../../middleware/cloud-session-auth.js";
import { ChatRuntimeService } from "../../modules/runtime/chat-runtime.service.js";
import { ModelPolicyError } from "../../modules/models/model-policy.service.js";
import { RoutingResolutionError } from "../../modules/models/routing.service.js";

const router = Router();
const chatRuntimeService = new ChatRuntimeService();

const messageSchema = z.object({
  role: z.string().min(1),
  content: z.unknown(),
  name: z.string().min(1).optional(),
});

const bodySchema = z
  .object({
    model: z.string().min(1),
    messages: z.array(messageSchema).min(1),
    stream: z.boolean().optional(),
    temperature: z.number().optional(),
    max_tokens: z.number().int().positive().optional(),
  })
  .passthrough();

router.post("/chat", cloudSessionAuth, async (req, res, next) => {
  try {
    const parsed = bodySchema.parse(req.body);

    // Temporary request-level logs to debug runtime streaming behavior.
    console.info("[runtime/chat] request", {
      requestId: req.requestId,
      model: parsed.model,
      stream: parsed.stream ?? true,
      messageCount: parsed.messages.length,
      sessionId: req.auth?.sessionId,
    });

    const upstream = await chatRuntimeService.createChatCompletion(parsed, {
      isAdmin: req.auth?.isAdmin,
      planCode: req.auth?.planCode,
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
