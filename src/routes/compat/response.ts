import { Router } from "express";
import {
  CloudAccessDeniedError,
  ResponseConfigService,
} from "../../modules/response/response-config.service.js";

const router = Router();
const responseConfigService = new ResponseConfigService();

router.get("/response", async (req, res, next) => {
  try {
    const licenseKey =
      typeof req.headers["license_key"] === "string"
        ? req.headers["license_key"]
        : "";
    const machineId =
      typeof req.headers["machine_id"] === "string"
        ? req.headers["machine_id"]
        : "";
    const instanceId =
      typeof req.headers["instance"] === "string"
        ? req.headers["instance"]
        : "";
    const model =
      typeof req.headers["model"] === "string"
        ? req.headers["model"]
        : undefined;

    const payload = await responseConfigService.buildCompatResponse({
      licenseKey,
      machineId,
      instanceId,
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
