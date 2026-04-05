import { Router } from "express";
import { BillingClient } from "../../modules/billing/billing-client.js";
import { ModelCatalogService } from "../../modules/models/model-catalog.service.js";

const router = Router();
const billingClient = new BillingClient();
const modelCatalogService = new ModelCatalogService();

router.post("/models", async (req, res, next) => {
  try {
    // Support both underscores (local/legacy) and hyphens (Nginx/standard)
    const licenseKey = (req.headers["license-key"] || req.headers["license_key"]) as string;
    const machineId = (req.headers["machine-id"] || req.headers["machine_id"]) as string;
    const instanceName = req.headers["instance"] as string;

    // Fail early if missing required headers
    if (!licenseKey || !machineId || !instanceName) {
      req.log.warn({ headers: req.headers }, "Rejecting request: Missing identity headers");
      return res.status(400).json({ error: "Missing required identity headers" });
    }

    // 1. Call the real Billing API
    const access = await billingClient.validateCloudAccess({
      licenseKey,
      machineId,
      instanceName
    });

    req.log.info(
      {
        requestId: req.requestId,
        tier: access.tier,
        keys: access.allowed_model_keys
      },
      "Billing validation successful"
    );

    // 2. Fetch models from the database, filtered by the billing keys
    const models = await modelCatalogService.getCompatModels(access.allowed_model_keys);

    res.json({ models });
  } catch (error: any) {
    // If billing rejects them (e.g., Basic plan), return 403
    if (error.message === "CLOUD_NOT_ENABLED_FOR_PLAN") {
      return res.status(403).json({ error: "CLOUD_NOT_ENABLED_FOR_PLAN" });
    }

    // For other validation failures
    if (error.message.includes("License validation failed")) {
      return res.status(401).json({ error: "Unauthorized", details: error.message });
    }

    next(error);
  }
});

export { router as compatModelsRouter };
