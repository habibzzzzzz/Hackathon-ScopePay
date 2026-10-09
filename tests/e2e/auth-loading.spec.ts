import { expect, test } from "@playwright/test";

test("auth loading blocks duplicate submission and recovers after failure", async ({
  page,
}) => {
  let finish: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let requests = 0;
  await page.route("**/api/auth", async (route) => {
    requests++;
    await held;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        data: null,
        error: { message: "Please retry sign-in." },
      }),
    });
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  const pending = page.getByRole("button", { name: "Opening workspace..." });
  await expect(pending).toBeDisabled();
  await expect(pending).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("status")).toHaveText("Opening workspace...");
  await expect.poll(() => requests).toBe(1);
  finish!();
  await expect(page.locator(".auth-panel").getByRole("alert")).toHaveText(
    "Please retry sign-in.",
  );
  await expect(
    page.getByRole("button", { name: "Open demo workspace" }),
  ).toBeEnabled();
  await page.unroute("**/api/auth");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
});

test("root confirmation fallback reaches auth handler and failed links explain retry", async ({
  page,
}) => {
  await page.goto("/?code=test-old-confirmation");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/login?confirmation=failed");
  await expect(page.locator(".auth-panel").getByRole("alert")).toContainText(
    "expired or could not be verified",
  );
  await expect(
    page.getByRole("link", { name: "Request a new confirmation email" }),
  ).toHaveAttribute("href", "/register");
});
