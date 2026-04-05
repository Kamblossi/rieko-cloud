import { env } from "../../config/env.js";
import type { RuntimeCapabilityPayload } from "./billing-capabilities.service.js";

// Define the shape expected from the billing API
export type BillingCapabilities = {
  cloud_enabled: boolean;
  allowed_model_keys: string[];
  tier?: string | null;
  plan_code?: string | null;
};

export type ValidationContext = {
  licenseKey: string;
  machineId: string;
  instanceName: string;
  appVersion?: string;
};

type BillingValidateResponse = {
  is_active?: boolean;
  is_dev_license?: boolean;
  last_validated_at?: string | null;
  reason?: string;
  plan_code?: string | null;
  tier?: string | null;
  capabilities?: RuntimeCapabilityPayload | null;
};

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

export class BillingClient {
  private baseUrl = env.PRISM_BILLING_BASE_URL.replace(/\/$/, "");

  async validateCloudAccess(context: ValidationContext): Promise<BillingCapabilities> {
    try {
      const response = await fetch(`${this.baseUrl}/licenses/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.PRISM_BILLING_INTERNAL_TOKEN}`
        },
        body: JSON.stringify({
          license_key: context.licenseKey,
          machine_id: context.machineId,
          instance_name: context.instanceName,
          app_version: context.appVersion
        })
      });

      if (!response.ok) {
        throw new Error(`Billing API rejected request with status: ${response.status}`);
      }

      const data = (await response.json()) as BillingValidateResponse;

      // 1. Check if the license is fundamentally active
      if (!data.is_active) {
        throw new Error(`License validation failed: ${data.reason || "Unknown reason"}`);
      }

      // 2. Check if the tier specifically allows cloud access (e.g., block 'basic' tier)
      if (!data.capabilities?.cloud_enabled) {
        throw new Error("CLOUD_NOT_ENABLED_FOR_PLAN");
      }

      return {
        cloud_enabled: data.capabilities.cloud_enabled,
        allowed_model_keys: data.capabilities.allowed_model_keys || [],
        tier: data.tier,
        plan_code: data.plan_code
      };
    } catch (error) {
      // Log the actual network or parsing error internally, but throw a clean error up
      console.error("[BillingClient] Validation error:", error);
      throw error;
    }
  }

  async validateLicenseRuntime(
    input: BillingValidateLicenseInput,
  ): Promise<BillingValidateLicenseResult> {
    const response = await fetch(`${this.baseUrl}/licenses/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.PRISM_BILLING_INTERNAL_TOKEN}`,
      },
      body: JSON.stringify({
        license_key: input.licenseKey?.trim() || "ADMIN-CHECK",
        machine_id: input.machineId,
        instance_name: input.instanceId,
        app_version: input.appVersion,
      }),
    });

    if (!response.ok) {
      throw new Error(`Billing API rejected request with status: ${response.status}`);
    }

    const data = (await response.json()) as BillingValidateResponse;

    return {
      isActive: data.is_active === true,
      lastValidatedAt: data.last_validated_at ?? null,
      isDevLicense: data.is_dev_license === true,
      reason: data.reason,
      planCode: data.plan_code ?? null,
      tier: data.tier ?? null,
      capabilities: data.capabilities ?? null,
    };
  }
}
