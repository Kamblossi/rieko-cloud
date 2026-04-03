import {
  BillingCapabilitiesService,
  toRuntimeCapabilityPayload,
  type CapabilityResult,
  type RuntimeCapabilityPayload,
} from "./billing-capabilities.service.js";
import { BillingClient } from "./billing-client.js";

export type BillingAccessIdentity = {
  licenseKey: string;
  machineId: string;
  instanceId: string;
  appVersion?: string;
};

export class BillingAccessError extends Error {
  readonly statusCode: number;
  readonly reason: string;

  constructor(statusCode: number, reason: string, message: string) {
    super(message);
    this.name = "BillingAccessError";
    this.statusCode = statusCode;
    this.reason = reason;
  }
}

export class BillingAccessService {
  private readonly billingClient = new BillingClient();
  private readonly billingCapabilitiesService = new BillingCapabilitiesService();

  async validateCloudAccess(identity: BillingAccessIdentity): Promise<{
    billing: Awaited<ReturnType<BillingClient["validateLicenseRuntime"]>>;
    capabilities: CapabilityResult;
    runtimeCapabilities: RuntimeCapabilityPayload;
  }> {
    if (!identity.machineId.trim() || !identity.instanceId.trim()) {
      throw new BillingAccessError(
        400,
        "MISSING_LICENSE_CONTEXT",
        "Machine and instance identity are required for cloud access.",
      );
    }

    const billing = await this.billingClient.validateLicenseRuntime(identity);

    if (!billing.isActive) {
      throw new BillingAccessError(
        403,
        billing.reason ?? "LICENSE_INACTIVE",
        "Cloud access denied by billing validation.",
      );
    }

    const capabilities = this.billingCapabilitiesService.resolveCapabilities({
      isAdmin: billing.isDevLicense,
      planCode: billing.planCode,
      tier: billing.tier,
      capabilities: billing.capabilities,
    });

    if (!capabilities.cloudEnabled) {
      throw new BillingAccessError(
        403,
        "CLOUD_NOT_ENABLED_FOR_PLAN",
        "This plan does not include Rieko Cloud access.",
      );
    }

    return {
      billing,
      capabilities,
      runtimeCapabilities: toRuntimeCapabilityPayload(capabilities),
    };
  }
}
