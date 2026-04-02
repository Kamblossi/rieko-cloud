import { Router } from "express";
import { ModelCatalogService } from "../../modules/models/model-catalog.service.js";

const router = Router();
const modelCatalogService = new ModelCatalogService();

router.post("/models", (_req, res) => {
  const models = modelCatalogService.getCompatModels();
  res.json({ models });
});

export { router as compatModelsRouter };
