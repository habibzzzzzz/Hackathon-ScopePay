import "server-only";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { resolve } from "node:path";
import { env } from "@/shared/config/env";
import { supabaseAdmin, supabaseServer } from "./supabase";
import { LocalRepository } from "@/modules/workspace/infrastructure/local-repository";
import { SupabaseRepository } from "@/modules/workspace/infrastructure/supabase-repository";
import { DemoAnalyzer } from "@/modules/scope-analysis/infrastructure/demo-analyzer";
import { GeminiAnalyzer } from "@/modules/scope-analysis/infrastructure/gemini-analyzer";
import { DemoGateway } from "@/modules/payments/infrastructure/demo-gateway";
import { PayPalGateway } from "@/modules/payments/infrastructure/paypal-gateway";
import { WorkspaceService } from "@/modules/workspace/application/workspace-service";

export async function runtime(publicAccess = false) {
  const config = env();
  const local = new LocalRepository(resolve(config.DEMO_DATA_DIR));
  const admin = config.APP_MODE === "live" ? supabaseAdmin() : null;
  const repository = admin
    ? new SupabaseRepository(
        publicAccess ? admin : await supabaseServer(),
        admin,
      )
    : local;
  const gateway =
    config.APP_MODE === "live"
      ? new PayPalGateway({
          clientId: config.PAYPAL_CLIENT_ID!,
          secret: config.PAYPAL_CLIENT_SECRET!,
          webhookId: config.PAYPAL_WEBHOOK_ID!,
          environment: config.PAYPAL_ENV,
          merchantEmail: config.PAYPAL_MERCHANT_EMAIL!,
        })
      : new DemoGateway(local);
  const analyzer =
    config.APP_MODE === "live"
      ? new GeminiAnalyzer(config.AI_API_KEY!, config.AI_MODEL)
      : new DemoAnalyzer();
  const service = new WorkspaceService({
    repository,
    analyzer,
    gateway,
    newId: randomUUID,
    now: () => new Date().toISOString(),
    newToken: () => randomBytes(32).toString("base64url"),
    hashToken: (t) => createHash("sha256").update(t).digest("hex"),
    invoiceSellerId:
      config.APP_MODE === "live"
        ? (config.PAYPAL_SELLER_USER_ID ?? "unconfigured-seller")
        : undefined,
  });
  return { service, repository, gateway };
}
