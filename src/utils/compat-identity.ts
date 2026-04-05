import type { IncomingHttpHeaders } from "node:http";

export interface CompatIdentity {
  licenseKey: string;
  machineId: string;
  instanceId: string;
  appVersion?: string;
}

export function resolveCompatIdentity(
  headers: IncomingHttpHeaders,
  fallback?: {
    licenseKey?: string;
    machineId?: string;
    instanceId?: string;
    appVersion?: string;
  },
): CompatIdentity {
  // Support both underscores (legacy/local) and hyphens (Nginx/Standard)
  const licenseKey = (headers["license-key"] || headers["license_key"] || fallback?.licenseKey || "") as string;
  const machineId = (headers["machine-id"] || headers["machine_id"] || fallback?.machineId || "") as string;
  const instanceId = (headers["instance"] || headers["instance_id"] || headers["instance_name"] || fallback?.instanceId || "") as string;
  const appVersion = (headers["app-version"] || headers["app_version"] || fallback?.appVersion || "") as string;

  return {
    licenseKey: licenseKey.trim(),
    machineId: machineId.trim(),
    instanceId: instanceId.trim(),
    appVersion: appVersion.trim() || undefined,
  };
}
