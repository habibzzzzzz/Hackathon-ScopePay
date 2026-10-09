import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/auth-browser",
  timeout: 60000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100/login",
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      APP_MODE: "live",
      NEXT_PUBLIC_APP_URL: "http://localhost:3100",
      NEXT_PUBLIC_SUPABASE_URL: "https://auth-test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-publishable-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-server-key",
      AI_API_KEY: "test-ai-key",
      PAYPAL_CLIENT_ID: "test-client-id",
      PAYPAL_CLIENT_SECRET: "test-client-secret",
      PAYPAL_WEBHOOK_ID: "test-webhook-id",
      PAYPAL_MERCHANT_EMAIL: "seller@example.com",
    },
  },
});
