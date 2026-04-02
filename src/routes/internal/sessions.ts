import { Router } from "express";
import { z } from "zod";
import { CloudSessionService } from "../../modules/cloud-sessions/cloud-session.service.js";

const router = Router();
const cloudSessionService = new CloudSessionService();

const bodySchema = z.object({
  licenseKey: z.string().min(1),
  machineId: z.string().min(1),
  instanceId: z.string().min(1),
  isAdmin: z.boolean().optional(),
  planCode: z.string().optional()
});

router.post("/sessions", async (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    const session = await cloudSessionService.issueSession({
      licenseKey: body.licenseKey,
      machineId: body.machineId,
      instanceId: body.instanceId,
      isAdmin: body.isAdmin,
      planCode: body.planCode
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

export { router as internalSessionsRouter };
