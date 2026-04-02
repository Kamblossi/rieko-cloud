import { env } from "../../config/env.js";
import type { CompatResponsePayload } from "../../types/compat.js";
import { BillingClient } from "../billing/billing-client.js";
import { CloudSessionService } from "../cloud-sessions/cloud-session.service.js";

const billingClient = new BillingClient();
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

    const billingValidation = await billingClient.validateLicenseRuntime({
      licenseKey,
      machineId,
      instanceId,
    });

    if (!billingValidation.isActive) {
      throw new CloudAccessDeniedError(
        "Cloud access denied by billing validation",
        billingValidation.reason ?? "LICENSE_INACTIVE",
      );
    }

    const { token } = await cloudSessionService.issueSession({
      // Keep a stable non-empty subject for admin sessions too.
      licenseKey: licenseKey || "ADMIN-ALLOWLIST",
      machineId,
      instanceId,
      isAdmin: billingValidation.isDevLicense,
      planCode: null,
    });

    // Keep these runtime URLs as-is for Session 1.
    // We will make them desktop-compatible in Session 2 and Session 3.
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
        model: "audio-auto",
        fallback_model: null,
        user_token: token,
        fallback_user_token: null,
        headers: [],
      },
      errors: [],
    };
  }
}
