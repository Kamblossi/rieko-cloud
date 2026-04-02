import { env } from "../../config/env.js";

export class BillingClient {
  private readonly baseUrl = env.PRISM_BILLING_BASE_URL;

  async checkEntitlement(_userId: string): Promise<{ active: boolean }> {
    void this.baseUrl;
    return { active: true };
  }
}
