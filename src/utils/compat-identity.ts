export type CompatIdentity = {
  licenseKey: string;
  machineId: string;
  instanceId: string;
  appVersion?: string;
};

export function resolveCompatIdentity(
  headers: Record<string, unknown>,
  fallback?: {
    licenseKey?: string;
    machineId?: string;
    instanceId?: string;
    appVersion?: string;
  },
): CompatIdentity {
  const licenseKey =
    typeof headers["license_key"] === "string"
      ? headers["license_key"].trim()
      : (fallback?.licenseKey ?? "").trim();
  const machineId =
    typeof headers["machine_id"] === "string"
      ? headers["machine_id"].trim()
      : (fallback?.machineId ?? "").trim();
  const instanceId =
    typeof headers["instance"] === "string"
      ? headers["instance"].trim()
      : typeof headers["instance_name"] === "string"
        ? headers["instance_name"].trim()
        : (fallback?.instanceId ?? "").trim();
  const appVersion =
    typeof headers["app_version"] === "string"
      ? headers["app_version"].trim()
      : fallback?.appVersion?.trim();

  return { licenseKey, machineId, instanceId, appVersion };
}
