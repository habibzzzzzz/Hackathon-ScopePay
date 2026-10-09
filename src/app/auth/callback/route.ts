import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/infrastructure/supabase";
import { env } from "@/shared/config/env";
export async function GET(request: Request) {
  function redirect(path: string) {
    const response = NextResponse.redirect(
      new URL(path, env().NEXT_PUBLIC_APP_URL),
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  if (env().APP_MODE !== "live") return redirect("/login");
  const query = new URL(request.url).searchParams;
  const code = query.get("code");
  const tokenHash = query.get("token_hash");
  try {
    const client = await supabaseServer();
    const result = code
      ? await client.auth.exchangeCodeForSession(code)
      : tokenHash && query.get("type") === "email"
        ? await client.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
        : null;
    if (result && !result.error) return redirect("/app/settings");
  } catch {
    return redirect("/login?confirmation=failed");
  }
  return redirect("/login?confirmation=failed");
}
