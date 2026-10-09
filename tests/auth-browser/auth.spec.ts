import { expect, test } from "@playwright/test";

test("login shows progress, recovers on error and navigates after success", async ({
  page,
}) => {
  let finish: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/auth", async (route) => {
    await held;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        data: null,
        error: { message: "Check your credentials." },
      }),
    });
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("seller@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("button", { name: "Signing in..." }),
  ).toBeDisabled();
  await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
  finish!();
  await expect(page.locator(".auth-panel").getByRole("alert")).toHaveText(
    "Check your credentials.",
  );
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.unroute("**/api/auth");
  await page.route("**/api/auth", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: { redirect: "/pricing" }, error: null }),
    }),
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
});

test("registration and resend show progress and remain usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let finish: (() => void) | undefined;
  let held = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const actions: string[] = [];
  await page.route("**/api/auth", async (route) => {
    actions.push(route.request().postDataJSON().action);
    await held;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: { redirect: null, message: "Check your email." },
        error: null,
      }),
    });
  });
  await page.goto("/register");
  await page.getByLabel("Email", { exact: true }).fill("seller@example.com");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("button", { name: "Creating account..." }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Resend confirmation email" }),
  ).toBeDisabled();
  finish!();
  await expect(page.getByRole("status")).toHaveText("Check your email.");
  held = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.getByRole("button", { name: "Resend confirmation email" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Sending confirmation email...",
  );
  finish!();
  await expect(page.getByRole("status")).toHaveText("Check your email.");
  expect(actions).toEqual(["register", "resend"]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const resend = await page
    .getByRole("button", { name: "Resend confirmation email" })
    .boundingBox();
  expect(resend!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: "artifacts/anti-slop/auth-register-mobile.png",
    fullPage: true,
  });
});
