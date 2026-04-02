import { prisma } from "../../db/prisma.js";
import {
  BillingCapabilitiesService,
  type CapabilityContext,
} from "../billing/billing-capabilities.service.js";

export type ModelPolicyModality = "text" | "audio" | "prompt";

export class ModelPolicyError extends Error {
  readonly statusCode: number;
  readonly reason: string;

  constructor(statusCode: number, reason: string, message: string) {
    super(message);
    this.name = "ModelPolicyError";
    this.statusCode = statusCode;
    this.reason = reason;
  }
}

export class ModelPolicyService {
  private readonly billingCapabilitiesService = new BillingCapabilitiesService();

  async validateModelForModality(input: {
    requestedModelKey: string;
    modality: ModelPolicyModality;
    capabilityContext?: CapabilityContext;
  }): Promise<{ modelKey: string; isAuto: boolean }> {
    const modelKey = (input.requestedModelKey || "auto").trim() || "auto";

    if (modelKey === "auto") {
      this.assertCapabilityAllowed(modelKey, input.capabilityContext);
      return { modelKey, isAuto: true };
    }

    const model = await prisma.riekoModel.findUnique({
      where: { routingKey: modelKey },
      select: {
        routingKey: true,
        modality: true,
        isAvailable: true,
        isManualSelectable: true,
      },
    });

    if (!model) {
      throw new ModelPolicyError(400, "UNKNOWN_MODEL", `Unknown model key: ${modelKey}`);
    }

    if (!model.isAvailable) {
      throw new ModelPolicyError(
        403,
        "MODEL_UNAVAILABLE",
        `Model key is not available: ${modelKey}`,
      );
    }

    if (!model.isManualSelectable) {
      throw new ModelPolicyError(
        403,
        "MODEL_NOT_MANUAL_SELECTABLE",
        `Model key cannot be selected manually: ${modelKey}`,
      );
    }

    if (!isAllowedForModality(model.modality, input.modality)) {
      throw new ModelPolicyError(
        400,
        "MODEL_MODALITY_MISMATCH",
        `Model key ${modelKey} is not allowed for ${input.modality} requests`,
      );
    }

    this.assertCapabilityAllowed(modelKey, input.capabilityContext);

    return { modelKey, isAuto: false };
  }

  private assertCapabilityAllowed(
    modelKey: string,
    capabilityContext?: CapabilityContext,
  ): void {
    const capabilities = this.billingCapabilitiesService.resolveCapabilities(
      capabilityContext ?? {},
    );

    if (!capabilities.allowedModelKeys.includes(modelKey)) {
      throw new ModelPolicyError(
        403,
        "MODEL_NOT_ALLOWED_FOR_PLAN",
        `Model key ${modelKey} is not allowed for this cloud capability tier`,
      );
    }
  }
}

function isAllowedForModality(modelModality: string, requestModality: ModelPolicyModality): boolean {
  if (requestModality === "audio") {
    return modelModality === "audio";
  }

  if (requestModality === "prompt") {
    return modelModality === "text";
  }

  return modelModality === "text" || modelModality === "vision";
}
