import { Router } from "express";
import { ModelCatalogService } from "../../modules/models/model-catalog.service.js";

const router = Router();
const modelCatalogService = new ModelCatalogService();

router.post("/models", async (_req, res, next) => {
  try {
    const models = await modelCatalogService.getCompatModels();
    res.json({ models });
  } catch (error) {
    next(error);
  }
});

export { router as compatModelsRouter };
