import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import {
  BillingAccessError,
  BillingAccessService,
} from "../../modules/billing/billing-access.service.js";
import { ModelCatalogService } from "../../modules/models/model-catalog.service.js";
import { resolveCompatIdentity } from "../../utils/compat-identity.js";

const router = Router();
const modelCatalogService = new ModelCatalogService();
const billingAccessService = new BillingAccessService();

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

router.post("/models", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identity = resolveCompatIdentity(req.headers, {
      licenseKey:
        readString(req.body?.license_key) ??
        readString(req.body?.license) ??
        readString(req.query.license_key),
      machineId:
        readString(req.body?.machine_id) ??
        readString(req.query.machine_id),
      instanceId:
        readString(req.body?.instance) ??
        readString(req.body?.instance_name) ??
        readString(req.query.instance) ??
        readString(req.query.instance_name),
      appVersion:
        readString(req.body?.app_version) ??
        readString(req.query.app_version),
    });

    if (!identity.licenseKey || !identity.machineId || !identity.instanceId) {
      res.status(400).json({
        error: "MISSING_LICENSE_CONTEXT",
        code: "MISSING_LICENSE_CONTEXT",
        message: "license_key, machine_id, and instance are required.",
        requestId: req.requestId,
      });
      return;
    }

    const { capabilities } = await billingAccessService.validateCloudAccess(identity);

    const models = await modelCatalogService.getCompatModels(
      capabilities.allowedModelKeys,
    );

    res.json({ models });
  } catch (error) {
    if (error instanceof BillingAccessError) {
      res.status(error.statusCode).json({
        error: error.reason,
        code: error.reason,
        message: error.message,
        requestId: req.requestId,
      });
      return;
    }

    next(error);
  }
});

export { router as compatModelsRouter };
