import { Router } from "express";
import { BillingAccessError, BillingAccessService } from "../../modules/billing/billing-access.service.js";
import { ModelCatalogService } from "../../modules/models/model-catalog.service.js";
import { resolveCompatIdentity } from "../../utils/compat-identity.js";

const router = Router();
const modelCatalogService = new ModelCatalogService();
const billingAccessService = new BillingAccessService();

router.post("/models", async (req, res, next) => {
  try {
    const identity = resolveCompatIdentity(req.headers);

    if (identity.licenseKey && identity.machineId && identity.instanceId) {
      const { capabilities } = await billingAccessService.validateCloudAccess(identity);
      const models = await modelCatalogService.getCompatModels(
        capabilities.allowedModelKeys,
      );
      res.json({ models });
      return;
    }

    const models = await modelCatalogService.getCompatModels();
    res.json({ models });
  } catch (error) {
    if (error instanceof BillingAccessError) {
      res.status(error.statusCode).json({
        error: error.reason,
        message: error.message,
        requestId: req.requestId,
      });
      return;
    }

    next(error);
  }
});

export { router as compatModelsRouter };
