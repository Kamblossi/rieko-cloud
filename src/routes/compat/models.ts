import { Router } from "express";
import { ModelCatalogService } from "../../modules/models/model-catalog.service.js";

const router = Router();
const modelCatalogService = new ModelCatalogService();

router.post("/models", async (req, res, next) => {
  try {
    // 1. Identity Resolution (Placeholder based on your headers)
    const identity = {
      licenseKey: req.headers["license_key"] as string,
      machineId: req.headers["machine_id"] as string
    };

    req.log.info(
      { requestId: req.requestId, identity },
      "compat /api/models identity"
    );

    // 2. Billing Access Validation (Placeholder logic)
    // Note: You will eventually need to inject a real billingAccessService here.
    const allowedModelKeys = ["auto"]; // Default fallback

    req.log.info(
      {
        requestId: req.requestId,
        allowedModelKeys
      },
      "compat /api/models resolved capabilities"
    );

    // 3. Model Retrieval
    const models = await modelCatalogService.getCompatModels(allowedModelKeys);

    // 4. Response Logging
    req.log.info(
      {
        requestId: req.requestId,
        returnedModelIds: models.map((m) => m.id)
      },
      "compat /api/models response"
    );

    res.json({ models });
  } catch (error) {
    next(error);
  }
});

export { router as compatModelsRouter };
