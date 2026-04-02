import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8790),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  RIEKO_CLOUD_PUBLIC_URL: z.string().url(),
  PRISM_BILLING_BASE_URL: z.string().url(),
  PRISM_BILLING_INTERNAL_TOKEN: z.string().min(1),
  DESKTOP_COMPAT_KEY: z.string().min(16),
  CLOUD_SESSION_JWT_SECRET: z.string().min(16),
  CLOUD_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_HTTP_REFERER: z.string().url().optional(),
  OPENROUTER_APP_TITLE: z.string().optional(),
  PORTKEY_API_KEY: z.string().optional(),
  PORTKEY_BASE_URL: z.string().url().default("https://api.portkey.ai/v1"),
  PORTKEY_DEFAULT_CONFIG_ID: z.string().optional(),
  CORS_ORIGIN: z.string().url()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = {
  ...parsed.data,
  RIEKO_CLOUD_PRODUCTION_URL: "https://riekocloud.prismtechco.com"
} as const;
