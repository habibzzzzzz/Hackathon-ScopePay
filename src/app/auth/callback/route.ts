import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/infrastructure/supabase";
import { env } from "@/shared/config/env";
export async function GET(request: Request) {
  if (env().APP_MODE !== "live")
    return NextResponse.redirect(new URL("/login", env().NEXT_PUBLIC_APP_URL));
  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    const { error } = await (
      await supabaseServer()
    ).auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL("/app/settings", env().NEXT_PUBLIC_APP_URL),
      );
  }
  return NextResponse.redirect(
    new URL("/login?confirmation=failed", env().NEXT_PUBLIC_APP_URL),
  );
}
