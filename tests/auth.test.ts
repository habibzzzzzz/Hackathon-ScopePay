import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAppUrl } from "@/shared/config/app-url";

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
  signUp: vi.fn(),
  resend: vi.fn(),
}));
vi.mock("@/shared/config/env", () => ({
  env: () => ({
    APP_MODE: "live",
    NEXT_PUBLIC_APP_URL: "https://scopepay.example",
  }),
}));
vi.mock("@/shared/infrastructure/supabase", () => ({
  supabaseServer: async () => ({ auth }),
}));
vi.mock("@/shared/infrastructure/runtime", () => ({
  runtime: async () => ({ repository: { rateLimit: async () => {} } }),
}));
import { GET } from "@/app/auth/callback/route";
import { POST } from "@/app/api/auth/route";

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("deployed application origin", () => {
  it("normalizes the configured origin and trailing slash", () => {
    expect(
      resolveAppUrl({ NEXT_PUBLIC_APP_URL: " https://scopepay.example/ " }),
    ).toBe("https://scopepay.example");
  });
  it("replaces a leftover localhost on Vercel with its deployment domain", () => {
    expect(
      resolveAppUrl({
        APP_MODE: "live",
        NODE_ENV: "production",
        VERCEL: "1",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        VERCEL_PROJECT_PRODUCTION_URL: "scopepay.vercel.app",
      }),
    ).toBe("https://scopepay.vercel.app");
  });
  it("uses the preview deployment origin for preview fallback", () => {
    expect(
      resolveAppUrl({
        VERCEL_ENV: "preview",
        VERCEL_URL: "preview.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "scopepay.vercel.app",
      }),
    ).toBe("https://preview.vercel.app");
  });
  it.each([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
    "http://scopepay.example",
  ])("rejects unsafe live production URL %s", (url) => {
    expect(() =>
      resolveAppUrl({
        APP_MODE: "live",
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: url,
      }),
    ).toThrow();
  });
  it.each([
    "<domain-vercel>",
    "https://scopepay.example/auth/callback",
    "https://user:password@scopepay.example",
    "ftp://scopepay.example",
  ])("rejects invalid origin %s", (url) => {
    expect(() => resolveAppUrl({ NEXT_PUBLIC_APP_URL: url })).toThrow();
  });
});

describe("email confirmation callback", () => {
  it("exchanges PKCE code and redirects to the canonical origin", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await GET(
      new Request(
        "https://untrusted.example/auth/callback?code=confirmation-code&next=https://evil.example",
      ),
    );
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith(
      "confirmation-code",
    );
    expect(response.headers.get("location")).toBe(
      "https://scopepay.example/app/settings",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("accepts email token hash for confirmation in a different browser", async () => {
    auth.verifyOtp.mockResolvedValue({ error: null });
    const response = await GET(
      new Request(
        "https://scopepay.example/auth/callback?token_hash=test-hash&type=email",
      ),
    );
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: "test-hash",
      type: "email",
    });
    expect(response.headers.get("location")).toBe(
      "https://scopepay.example/app/settings",
    );
  });
  it("returns expired links to the retry screen", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({
      error: { message: "expired" },
    });
    const response = await GET(
      new Request("https://scopepay.example/auth/callback?code=expired"),
    );
    expect(response.headers.get("location")).toBe(
      "https://scopepay.example/login?confirmation=failed",
    );
  });
  it("handles provider outages without exposing the token", async () => {
    auth.exchangeCodeForSession.mockRejectedValue(new Error("provider down"));
    const response = await GET(
      new Request("https://scopepay.example/auth/callback?code=secret"),
    );
    expect(response.headers.get("location")).toBe(
      "https://scopepay.example/login?confirmation=failed",
    );
  });
  it("rejects unsupported OTP types", async () => {
    const response = await GET(
      new Request(
        "https://scopepay.example/auth/callback?token_hash=hash&type=recovery",
      ),
    );
    expect(auth.verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("confirmation=failed");
  });
});

describe("confirmation email requests", () => {
  function request(body: unknown) {
    return new Request("https://scopepay.example/api/auth", {
      method: "POST",
      headers: {
        Origin: "https://scopepay.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }
  it("registers with the deployed callback URL", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const response = await POST(
      request({
        action: "register",
        email: "seller@example.com",
        password: "test-password",
      }),
    );
    expect(response.status).toBe(200);
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "seller@example.com",
      password: "test-password",
      options: { emailRedirectTo: "https://scopepay.example/auth/callback" },
    });
  });
  it("resends confirmation with the canonical callback and no account disclosure", async () => {
    auth.resend.mockResolvedValue({ error: null });
    const response = await POST(
      request({ action: "resend", email: "seller@example.com" }),
    );
    expect(response.status).toBe(200);
    expect(auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "seller@example.com",
      options: { emailRedirectTo: "https://scopepay.example/auth/callback" },
    });
    expect((await response.json()).data.message).toContain(
      "If this account needs confirmation",
    );
  });
  it("reports resend failure without provider details", async () => {
    auth.resend.mockResolvedValue({
      error: { message: "private provider details" },
    });
    const response = await POST(
      request({ action: "resend", email: "seller@example.com" }),
    );
    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain(
      "private provider details",
    );
  });
});
