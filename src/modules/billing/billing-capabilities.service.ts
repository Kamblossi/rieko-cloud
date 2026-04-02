export type CapabilityContext = {
  isAdmin?: boolean;
  planCode?: string | null;
};

export type CapabilityResult = {
  isAdmin: boolean;
  planCode: string | null;
  allowedModelKeys: string[];
};

const ALL_MODEL_KEYS = ["auto", "fast", "premium", "vision", "code", "audio", "audio-auto"];
const DEFAULT_PAID_MODEL_KEYS = ["auto", "fast", "audio", "audio-auto"];
const PREMIUM_MODEL_KEYS = ["auto", "fast", "premium", "vision", "code", "audio", "audio-auto"];

export class BillingCapabilitiesService {
  resolveCapabilities(context: CapabilityContext): CapabilityResult {
    const isAdmin = context.isAdmin === true;
    const planCode = context.planCode?.trim() || null;

    if (isAdmin) {
      return {
        isAdmin,
        planCode,
        allowedModelKeys: ALL_MODEL_KEYS,
      };
    }

    const normalizedPlan = (planCode || "").toLowerCase();
    const isPremiumPlan =
      normalizedPlan.includes("premium") ||
      normalizedPlan.includes("pro") ||
      normalizedPlan.includes("enterprise");

    return {
      isAdmin,
      planCode,
      allowedModelKeys: isPremiumPlan ? PREMIUM_MODEL_KEYS : DEFAULT_PAID_MODEL_KEYS,
    };
  }
}