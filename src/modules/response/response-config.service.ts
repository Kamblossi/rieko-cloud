import { env } from "../../config/env.js";
import type { CompatResponsePayload } from "../../types/compat.js";
import { BillingAccessError, BillingAccessService } from "../billing/billing-access.service.js";
import { CloudSessionService } from "../cloud-sessions/cloud-session.service.js";

const billingAccessService = new BillingAccessService();
const cloudSessionService = new CloudSessionService();

export class CloudAccessDeniedError extends Error {
  readonly statusCode = 403;
  readonly reason?: string;

  constructor(message: string, reason?: string) {
    super(message);
    this.name = "CloudAccessDeniedError";
    this.reason = reason;
  }
}

export class ResponseConfigService {
  async buildCompatResponse(input: {
    licenseKey: string;
    machineId: string;
    instanceId: string;
    model?: string;
    appVersion?: string;
  }): Promise<CompatResponsePayload> {
    const machineId = input.machineId.trim();
    const instanceId = input.instanceId.trim();
    const licenseKey = input.licenseKey.trim();
    const model = input.model?.trim() || "auto";

    if (!machineId) {
      throw new CloudAccessDeniedError(
        "Missing machine_id header",
        "MISSING_MACHINE_ID",
      );
    }

    if (!instanceId) {
      throw new CloudAccessDeniedError(
        "Missing instance header",
        "MISSING_INSTANCE_ID",
      );
    }

    try {
      const { billing, capabilities, runtimeCapabilities } =
        await billingAccessService.validateCloudAccess({
          licenseKey,
          machineId,
          instanceId,
          appVersion: input.appVersion,
        });

      const { token } = await cloudSessionService.issueSession({
        licenseKey: licenseKey || "ADMIN-ALLOWLIST",
        machineId,
        instanceId,
        isAdmin: billing.isDevLicense,
        planCode: billing.planCode,
        tier: billing.tier,
        capabilities: runtimeCapabilities,
      });

      const chatUrl = `${env.RIEKO_CLOUD_PUBLIC_URL}/runtime/chat`;
      const audioUrl = `${env.RIEKO_CLOUD_PUBLIC_URL}/runtime/audio`;

      return {
        url: chatUrl,
        user_token: token,
        model,
        body: JSON.stringify({
          temperature: 0.3,
        }),
        customer_id: null,
        customer_email: null,
        customer_name: null,
        license_key: licenseKey || "ADMIN-ALLOWLIST",
        instance_id: instanceId,
        user_audio: {
          url: audioUrl,
          fallback_url: null,
          model: capabilities.allowedModelKeys.includes("audio-auto")
            ? "audio-auto"
            : "audio",
          fallback_model: null,
          user_token: token,
          fallback_user_token: null,
          headers: [],
        },
        errors: [],
      };
    } catch (error) {
      if (error instanceof BillingAccessError) {
        throw new CloudAccessDeniedError(error.message, error.reason);
      }
      throw error;
    }
  }
}
