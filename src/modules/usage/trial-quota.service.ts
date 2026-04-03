import { ActivityService } from "./activity.service.js";
import type { RuntimeCapabilityPayload } from "../billing/billing-capabilities.service.js";

export class TrialQuotaExceededError extends Error {
  readonly statusCode = 403;
  readonly reason = "TRIAL_REQUEST_LIMIT_REACHED";

  constructor(limit: number) {
    super(`The limited trial request limit of ${limit} has been reached.`);
    this.name = "TrialQuotaExceededError";
  }
}

export class TrialQuotaService {
  private readonly activityService = new ActivityService();

  async assertCanConsume(
    identity: { licenseKey: string },
    capabilities?: RuntimeCapabilityPayload | null,
  ): Promise<void> {
    const limit = capabilities?.trial_request_limit ?? null;

    if (!limit || limit <= 0) {
      return;
    }

    const consumed = await this.activityService.countQuotaConsumptions({
      licenseKey: identity.licenseKey,
    });

    if (consumed >= limit) {
      throw new TrialQuotaExceededError(limit);
    }
  }
}
