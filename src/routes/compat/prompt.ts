import { Router } from "express";
import { z } from "zod";
import { BillingAccessError, BillingAccessService } from "../../modules/billing/billing-access.service.js";
import { ModelPolicyError } from "../../modules/models/model-policy.service.js";
import { RoutingResolutionError } from "../../modules/models/routing.service.js";
import { PromptTemplateService } from "../../modules/prompts/prompt-template.service.js";
import { ActivityService } from "../../modules/usage/activity.service.js";
import { TrialQuotaExceededError, TrialQuotaService } from "../../modules/usage/trial-quota.service.js";
import { resolveCompatIdentity } from "../../utils/compat-identity.js";

const router = Router();
const promptTemplateService = new PromptTemplateService();
const billingAccessService = new BillingAccessService();
const trialQuotaService = new TrialQuotaService();
const activityService = new ActivityService();

const bodySchema = z.object({
  user_prompt: z.string().trim().min(1)
});

router.post("/prompt", async (req, res, next) => {
  try {
    const { user_prompt } = bodySchema.parse(req.body);
    const identity = resolveCompatIdentity(req.headers);
    const { billing, runtimeCapabilities } =
      await billingAccessService.validateCloudAccess(identity);

    await trialQuotaService.assertCanConsume(
      { licenseKey: identity.licenseKey },
      runtimeCapabilities,
    );

    const result = await promptTemplateService.generateSystemPrompt(user_prompt, {
      isAdmin: billing.isDevLicense,
      planCode: billing.planCode,
      tier: billing.tier,
      capabilities: runtimeCapabilities,
    });

    await activityService.recordQuotaConsumption({
      licenseKey: identity.licenseKey,
      machineId: identity.machineId,
      instanceId: identity.instanceId,
      modelKey: result.model_key,
      eventType: "prompt_generation",
      metadata: {
        source: "compat",
      },
    });

    res.json({
      prompt_name: result.prompt_name,
      system_prompt: result.system_prompt,
    });
  } catch (error) {
    if (error instanceof BillingAccessError) {
      res.status(error.statusCode).json({
        error: error.reason,
        message: error.message,
        requestId: req.requestId,
      });
      return;
    }

    if (error instanceof TrialQuotaExceededError) {
      res.status(error.statusCode).json({
        error: error.reason,
        message: error.message,
        requestId: req.requestId,
      });
      return;
    }

    if (error instanceof ModelPolicyError || error instanceof RoutingResolutionError) {
      res.status(error.statusCode).json({
        error: error.name,
        reason: error.reason,
        message: error.message,
        requestId: req.requestId,
      });
      return;
    }

    next(error);
  }
});

export { router as compatPromptRouter };
