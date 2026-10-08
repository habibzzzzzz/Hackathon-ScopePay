import "server-only";
import { cookies } from "next/headers";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { env } from "@/shared/config/env";
import { supabaseServer } from "./supabase";
import { ApplicationError } from "@/shared/errors/application-error";
import { LocalRepository } from "@/modules/workspace/infrastructure/local-repository";
import { resolve } from "node:path";

export async function session() {
  if (env().APP_MODE === "live") {
    const client = await supabaseServer();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    return error || !user
      ? null
      : { id: user.id, email: user.email ?? "", demo: false };
  }
  const token = (await cookies()).get("scopepay-demo")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const repository = new LocalRepository(resolve(env().DEMO_DATA_DIR));
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const profile = await repository.mutate((data) => {
    const entry = data.sessions.find(
      (s) => s.tokenHash === tokenHash && Date.parse(s.expiresAt) > Date.now(),
    );
    return entry ? data.profiles.find((p) => p.id === entry.userId) : null;
  });
  return profile ? { id: profile.id, email: profile.email, demo: true } : null;
}
export async function requireSession(page = false) {
  const user = await session();
  if (!user) {
    if (page) redirect("/login");
    throw new ApplicationError("UNAUTHENTICATED", "Sign in to continue.", 401);
  }
  return user;
}
export async function startDemo() {
  if (env().APP_MODE !== "demo")
    throw new ApplicationError(
      "DEMO_DISABLED",
      "Demo sessions are unavailable.",
      404,
    );
  const token = randomBytes(32).toString("hex");
  const id = randomUUID();
  const now = new Date().toISOString();
  const repository = new LocalRepository(resolve(env().DEMO_DATA_DIR));
  await repository.save("profiles", {
    id,
    userId: id,
    createdAt: now,
    fullName: "Demo freelancer",
    businessName: "Demo workspace",
    profession: "Web developer",
    country: "Indonesia",
    email: "freelancer@example.com",
    currency: "USD",
    hourlyRateMinor: 2000,
    minimumChargeMinor: 5000,
    riskPercent: 10,
    urgencyPercent: 100,
  });
  await repository.mutate((data) => {
    data.sessions = data.sessions.filter(
      (s) => Date.parse(s.expiresAt) > Date.now(),
    );
    data.sessions.push({
      tokenHash: createHash("sha256").update(token).digest("hex"),
      userId: id,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  });
  (await cookies()).set("scopepay-demo", token, {
    httpOnly: true,
    secure: env().NEXT_PUBLIC_APP_URL.startsWith("https:"),
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return { id, email: "freelancer@example.com", demo: true };
}
