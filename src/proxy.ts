import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/shared/config/env";

export async function proxy(request: NextRequest) {
  const config = env();
  if (config.APP_MODE === "demo") return NextResponse.next();
  let response = NextResponse.next({ request });
  const client = createServerClient(
    config.NEXT_PUBLIC_SUPABASE_URL!,
    config.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values)
            response.cookies.set(name, value, options);
        },
      },
    },
  );
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user && request.nextUrl.pathname.startsWith("/app")) {
    const redirected = NextResponse.redirect(new URL("/login", request.url));
    for (const cookie of response.cookies.getAll())
      redirected.cookies.set(cookie);
    return redirected;
  }
  return response;
}
export const config = { matcher: ["/app/:path*", "/api/v1/:path*"] };
