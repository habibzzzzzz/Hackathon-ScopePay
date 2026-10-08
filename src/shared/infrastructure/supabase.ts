import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/shared/config/env";

export async function supabaseServer() {
  const config = env();
  const jar = await cookies();
  return createServerClient(
    config.NEXT_PUBLIC_SUPABASE_URL!,
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            for (const { name, value, options } of values)
              jar.set(name, value, {
                ...options,
                secure: config.NEXT_PUBLIC_APP_URL.startsWith("https:"),
                sameSite: "lax",
              });
          } catch {
            /* Session refresh is written by the proxy on Server Component requests. */
          }
        },
      },
    },
  );
}
export function supabaseAdmin() {
  const config = env();
  return createClient(
    config.NEXT_PUBLIC_SUPABASE_URL!,
    config.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
