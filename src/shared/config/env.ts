import "server-only";
import { z } from "zod";

const schema = z.object({
  APP_MODE: z.enum(["demo", "live"]).default("demo"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z
    .string()
    .regex(/^[a-zA-Z0-9._-]+$/)
    .default("gemini-2.5-flash"),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_SELLER_USER_ID: z.uuid().optional(),
  PAYPAL_MERCHANT_EMAIL: z.email().optional(),
  PAYPAL_ENV: z.enum(["sandbox", "live"]).default("sandbox"),
  DEMO_DATA_DIR: z.string().default(".data"),
});
let cached: z.infer<typeof schema> | undefined;
export function env() {
  if (cached) return cached;
  const parsed = schema.parse(
    Object.fromEntries(
      Object.entries(process.env).filter(([, value]) => value !== ""),
    ),
  );
  if (parsed.APP_MODE === "live") {
    for (const key of [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "AI_API_KEY",
      "PAYPAL_CLIENT_ID",
      "PAYPAL_CLIENT_SECRET",
      "PAYPAL_WEBHOOK_ID",
      "PAYPAL_MERCHANT_EMAIL",
    ] as const) {
      if (!parsed[key]) throw new Error(`Live mode requires ${key}.`);
    }
  }
  if (
    process.env.NODE_ENV === "production" &&
    parsed.APP_MODE === "demo" &&
    process.env.APP_MODE !== "demo"
  )
    throw new Error("Production requires an explicit APP_MODE (live or demo).");
  cached = parsed;
  return cached;
}
