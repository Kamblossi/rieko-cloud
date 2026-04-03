import { z } from "zod";
import { env } from "../../config/env.js";
import type { RuntimeCapabilityPayload } from "./billing-capabilities.service.js";

const billingCapabilitiesSchema = z.object({
  cloud_enabled: z.boolean(),
  dev_space_enabled: z.boolean(),
  byok_enabled: z.boolean(),
  allowed_model_keys: z.array(z.string()),
  monthly_generation_limit: z.number().int().nullable(),
  trial_request_limit: z.number().int().nullable(),
  device_limit: z.number().int(),
});

const billingValidateResponseSchema = z.object({
  is_active: z.boolean(),
  last_validated_at: z.string().nullable(),
  is_dev_license: z.boolean(),
  reason: z.string().optional(),
  plan_code: z.string().nullable().optional(),
  tier: z.string().nullable().optional(),
  capabilities: billingCapabilitiesSchema.nullable().optional(),
});

export type BillingValidateLicenseInput = {
  licenseKey?: string;
  machineId: string;
  instanceId: string;
  appVersion?: string;
};

export type BillingValidateLicenseResult = {
  isActive: boolean;
  lastValidatedAt: string | null;
  isDevLicense: boolean;
  reason?: string;
  planCode: string | null;
  tier: string | null;
  capabilities: RuntimeCapabilityPayload | null;
};

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class BillingClient {
  private readonly baseUrl = env.PRISM_BILLING_BASE_URL.replace(/\/+$/, "");

  async validateLicenseRuntime(
    input: BillingValidateLicenseInput,
  ): Promise<BillingValidateLicenseResult> {
    const response = await fetch(`${this.baseUrl}/licenses/validate`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.PRISM_BILLING_INTERNAL_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        license_key: input.licenseKey?.trim() || "ADMIN-CHECK",
        machine_id: input.machineId,
        instance_name: input.instanceId,
        ...(input.appVersion ? { app_version: input.appVersion } : {}),
      }),
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      const details =
        typeof payload === "string"
          ? payload
          : payload
            ? JSON.stringify(payload)
            : "No response body";

      throw new Error(
        `Billing validation request failed (${response.status}): ${details}`,
      );
    }

    const parsed = billingValidateResponseSchema.parse(payload);

    return {
      isActive: parsed.is_active,
      lastValidatedAt: parsed.last_validated_at,
      isDevLicense: parsed.is_dev_license,
      reason: parsed.reason,
      planCode: parsed.plan_code ?? null,
      tier: parsed.tier ?? null,
      capabilities: parsed.capabilities ?? null,
    };
  }
}
