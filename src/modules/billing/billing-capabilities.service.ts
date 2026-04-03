export type RuntimeCapabilityPayload = {
  cloud_enabled: boolean;
  dev_space_enabled: boolean;
  byok_enabled: boolean;
  allowed_model_keys: string[];
  monthly_generation_limit: number | null;
  trial_request_limit: number | null;
  device_limit: number;
};

export type CapabilityContext = {
  isAdmin?: boolean;
  planCode?: string | null;
  tier?: string | null;
  capabilities?: RuntimeCapabilityPayload | null;
};

export type CapabilityResult = {
  isAdmin: boolean;
  planCode: string | null;
  tier: string | null;
  cloudEnabled: boolean;
  devSpaceEnabled: boolean;
  byokEnabled: boolean;
  allowedModelKeys: string[];
  monthlyGenerationLimit: number | null;
  trialRequestLimit: number | null;
  deviceLimit: number | null;
};

const ALL_MODEL_KEYS = ["auto", "fast", "premium", "vision", "code", "audio", "audio-auto"];
const BASIC_MODEL_KEYS: string[] = [];
const DEFAULT_PAID_MODEL_KEYS = ["auto", "fast", "audio", "audio-auto"];
const PREMIUM_MODEL_KEYS = ["auto", "fast", "premium", "vision", "code", "audio", "audio-auto"];

export class BillingCapabilitiesService {
  resolveCapabilities(context: CapabilityContext): CapabilityResult {
    const isAdmin = context.isAdmin === true;
    const planCode = context.planCode?.trim() || null;
    const tier = context.tier?.trim() || null;

    if (context.capabilities) {
      return {
        isAdmin,
        planCode,
        tier,
        cloudEnabled: context.capabilities.cloud_enabled,
        devSpaceEnabled: context.capabilities.dev_space_enabled,
        byokEnabled: context.capabilities.byok_enabled,
        allowedModelKeys: [...context.capabilities.allowed_model_keys],
        monthlyGenerationLimit: context.capabilities.monthly_generation_limit,
        trialRequestLimit: context.capabilities.trial_request_limit,
        deviceLimit: context.capabilities.device_limit,
      };
    }

    if (isAdmin) {
      return {
        isAdmin,
        planCode,
        tier: tier ?? "admin",
        cloudEnabled: true,
        devSpaceEnabled: true,
        byokEnabled: true,
        allowedModelKeys: ALL_MODEL_KEYS,
        monthlyGenerationLimit: null,
        trialRequestLimit: null,
        deviceLimit: null,
      };
    }

    const normalizedPlan = (planCode || "").toLowerCase();

    if (normalizedPlan === "limited-trial") {
      return {
        isAdmin,
        planCode,
        tier: tier ?? "trial",
        cloudEnabled: true,
        devSpaceEnabled: false,
        byokEnabled: false,
        allowedModelKeys: DEFAULT_PAID_MODEL_KEYS,
        monthlyGenerationLimit: null,
        trialRequestLimit: 5,
        deviceLimit: 1,
      };
    }

    if (normalizedPlan === "basic-monthly" || normalizedPlan === "basic") {
      return {
        isAdmin,
        planCode,
        tier: tier ?? "basic",
        cloudEnabled: false,
        devSpaceEnabled: true,
        byokEnabled: true,
        allowedModelKeys: BASIC_MODEL_KEYS,
        monthlyGenerationLimit: null,
        trialRequestLimit: null,
        deviceLimit: 1,
      };
    }

    return {
      isAdmin,
      planCode,
      tier: tier ?? "pro",
      cloudEnabled: true,
      devSpaceEnabled: true,
      byokEnabled: true,
      allowedModelKeys: normalizedPlan === "pro-yearly" ? PREMIUM_MODEL_KEYS : PREMIUM_MODEL_KEYS,
      monthlyGenerationLimit: normalizedPlan === "pro-monthly" ? 1500 : null,
      trialRequestLimit: null,
      deviceLimit: normalizedPlan === "pro-yearly" ? 2 : 1,
    };
  }
}

export function toRuntimeCapabilityPayload(result: CapabilityResult): RuntimeCapabilityPayload {
  return {
    cloud_enabled: result.cloudEnabled,
    dev_space_enabled: result.devSpaceEnabled,
    byok_enabled: result.byokEnabled,
    allowed_model_keys: [...result.allowedModelKeys],
    monthly_generation_limit: result.monthlyGenerationLimit,
    trial_request_limit: result.trialRequestLimit,
    device_limit: result.deviceLimit ?? 0,
  };
}