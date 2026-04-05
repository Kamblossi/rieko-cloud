import { Router } from "express";
import { BillingClient } from "../../modules/billing/billing-client.js";
import { ModelCatalogService } from "../../modules/models/model-catalog.service.js";

const router = Router();
const billingClient = new BillingClient();
const modelCatalogService = new ModelCatalogService();

router.post("/models", async (req, res, next) => {
  try {
    // Nginx Fix: Check both underscore and hyphenated versions of headers
    const licenseKey = (req.headers["license-key"] || req.headers["license_key"]) as string;
    const machineId = (req.headers["machine-id"] || req.headers["machine_id"]) as string;
    const instanceName = (req.headers["instance"]) as string;

    if (!licenseKey || !machineId || !instanceName) {
       req.log.warn({ headers: req.headers }, "Rejecting request: Missing identity headers");
       return res.status(400).json({ error: "Missing required identity headers" });
    }

    // 1. Call Billing Service
    const access = await billingClient.validateCloudAccess({
      licenseKey,
      machineId,
      instanceName
    });

    // 2. Fetch from DB using the billing allow-list
    const models = await modelCatalogService.getCompatModels(access.allowed_model_keys);

    res.json({ models });

  } catch (error: any) {
    if (error.message === "CLOUD_NOT_ENABLED_FOR_PLAN") {
      return res.status(403).json({ error: "CLOUD_NOT_ENABLED_FOR_PLAN" });
    }
    next(error);
  }
});

export { router as compatModelsRouter };
