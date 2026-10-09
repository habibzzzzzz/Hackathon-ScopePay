import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/shared/config/env";
import { requireSession, startDemo } from "@/shared/infrastructure/auth";
import { runtime } from "@/shared/infrastructure/runtime";
import { supabaseServer } from "@/shared/infrastructure/supabase";
import {
  assertOrigin,
  errorResponse,
  readJson,
} from "@/shared/presentation/http";
import { ApplicationError } from "@/shared/errors/application-error";
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("demo") }),
  z.object({ action: z.literal("logout") }),
  z.object({ action: z.literal("resend"), email: z.email() }),
  z.object({
    action: z.literal("login"),
    email: z.email(),
    password: z.string().min(8).max(128),
  }),
  z.object({
    action: z.literal("register"),
    email: z.email(),
    password: z.string().min(8).max(128),
  }),
]);
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = inputSchema.parse(await readJson(request, 2000));
    const { repository } = await runtime(true);
    await repository.rateLimit(
      `auth:${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}`,
      20,
      60,
    );
    if (input.action === "demo") {
      await startDemo();
      return NextResponse.json({
        data: { redirect: "/app/dashboard" },
        error: null,
      });
    }
    if (input.action === "logout") {
      await requireSession();
      if (env().APP_MODE === "live")
        await (await supabaseServer()).auth.signOut();
      else (await cookies()).delete("scopepay-demo");
      return NextResponse.json({ data: { redirect: "/login" }, error: null });
    }
    if (env().APP_MODE !== "live")
      throw new ApplicationError(
        "DEMO_ONLY",
        "Use the demo workspace here. Email accounts require Supabase configuration.",
      );
    const client = await supabaseServer();
    if (input.action === "resend") {
      const { error } = await client.auth.resend({
        type: "signup",
        email: input.email,
        options: {
          emailRedirectTo: `${env().NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });
      if (error)
        throw new ApplicationError(
          "RESEND_FAILED",
          "Confirmation email could not be sent. Wait a minute, then retry.",
        );
      return NextResponse.json({
        data: {
          redirect: null,
          message:
            "If this account needs confirmation, a new email has been sent. Check your inbox and spam folder.",
        },
        error: null,
      });
    }
    if (input.action === "login") {
      const { error } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error)
        throw new ApplicationError(
          "AUTH_FAILED",
          "Sign-in failed. Check your credentials and email confirmation.",
          401,
        );
      return NextResponse.json({
        data: { redirect: "/app/dashboard" },
        error: null,
      });
    }
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${env().NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
    if (error)
      throw new ApplicationError(
        "REGISTRATION_FAILED",
        "Registration could not be completed. Please retry.",
      );
    return NextResponse.json({
      data: {
        redirect: data.session ? "/app/settings" : null,
        message: "Check your email to confirm your account, then sign in.",
      },
      error: null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
