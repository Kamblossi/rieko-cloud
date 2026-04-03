import { Router } from "express";
import {
  CloudAccessDeniedError,
  ResponseConfigService,
} from "../../modules/response/response-config.service.js";
import { resolveCompatIdentity } from "../../utils/compat-identity.js";

const router = Router();
const responseConfigService = new ResponseConfigService();

router.get("/response", async (req, res, next) => {
  try {
    const identity = resolveCompatIdentity(req.headers);
    const model =
      typeof req.headers["model"] === "string"
        ? req.headers["model"]
        : undefined;

    const payload = await responseConfigService.buildCompatResponse({
      licenseKey: identity.licenseKey,
      machineId: identity.machineId,
      instanceId: identity.instanceId,
      appVersion: identity.appVersion,
      model,
    });

    res.json(payload);
  } catch (error) {
    if (error instanceof CloudAccessDeniedError) {
      res.status(error.statusCode).json({
        error: "Cloud Access Denied",
        message: error.message,
        reason: error.reason ?? null,
        requestId: req.requestId,
      });
      return;
    }

    next(error);
  }
});

export { router as compatResponseRouter };
