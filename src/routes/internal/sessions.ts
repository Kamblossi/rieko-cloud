import { Router } from "express";
import { z } from "zod";
import { CloudSessionService } from "../../modules/cloud-sessions/cloud-session.service.js";

const router = Router();
const cloudSessionService = new CloudSessionService();

const bodySchema = z.object({
  userId: z.string().min(1),
  source: z.string().min(1).default("desktop")
});

router.post("/sessions", async (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    const session = await cloudSessionService.issueSession({
      userId: body.userId,
      source: body.source
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

export { router as internalSessionsRouter };
