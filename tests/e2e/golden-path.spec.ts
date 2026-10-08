import { test, expect } from "@playwright/test";

test("PRD example: baseline to $220 simulated payment", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/login");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome, Demo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load sample project" }).click();
  await page
    .getByRole("link", { name: "HAVN Coffee Website", exact: true })
    .click();
  await page.getByRole("button", { name: "Use sample request" }).click();
  await page.getByRole("button", { name: "Review project baseline" }).click();
  await expect(
    page.getByRole("heading", { name: "Questions to clarify" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Analyze scope", exact: true })
    .click();
  await expect(
    page.getByText("$220.00", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create change-order draft" }).click();
  await expect(page.getByRole("heading", { name: /CHG-/ })).toBeVisible();
  await page
    .getByRole("button", { name: "Create client approval link" })
    .click();
  const link = await page.getByLabel("Client approval link").inputValue();
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
  const client = await context.newPage();
  await client.goto(link);
  await client
    .getByRole("button", { name: "Approve & create demo invoice" })
    .click();
  await client
    .getByRole("button", { name: "Simulate payment (no money moves)" })
    .click();
  await expect(
    client.getByText("Simulated payment recorded. Thank you."),
  ).toBeVisible();
  await page.goto("/app/dashboard");
  await expect(
    page
      .locator(".stat")
      .filter({ has: page.getByText("Protected revenue", { exact: true }) })
      .getByText("$220.00"),
  ).toBeVisible();
  await expect(
    page
      .locator(".stat")
      .filter({ has: page.getByText("Collected", { exact: true }) })
      .getByText("$220.00"),
  ).toBeVisible();
  await page.goto("/app/payments");
  await page.getByRole("link", { name: "View invoice" }).click();
  await expect(
    page.getByRole("heading", { name: "Approved additional work" }),
  ).toBeVisible();
  await expect(page.getByText("paid", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("manual project setup, tenant isolation and mobile layout", async ({
  page,
  browser,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await page.goto("/app/settings");
  await page.getByLabel("Full name", { exact: true }).fill("Test freelancer");
  await page.getByRole("button", { name: "Save profile and pricing" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.goto("/app/clients/new");
  await page.getByLabel("Client name").fill("Test client");
  await page.getByLabel("Client email").fill("client@example.com");
  await page.getByRole("button", { name: "Save client" }).click();
  await expect(
    page.getByRole("heading", { name: "Test client", exact: true }),
  ).toBeVisible();
  await page.goto("/app/projects/new");
  await page.getByLabel("Project name").fill("Manual test project");
  await page
    .getByRole("combobox", { name: "Client", exact: true })
    .selectOption({ label: "Test client" });
  await page.getByLabel("Original contract value").fill("1500");
  await page.getByLabel("Start date").fill("2026-10-08");
  await page.getByLabel("Target completion date").fill("2026-10-28");
  await page
    .getByLabel("Included scope")
    .fill("Responsive website with reservation form");
  await page.getByLabel("Deliverables").fill("Website and documentation");
  await page.getByLabel("Revision policy").fill("Two revision rounds");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Manual test project" }),
  ).toBeVisible();
  const projectUrl = page.url();
  await page.getByRole("link", { name: "Edit baseline" }).click();
  await page.getByLabel("Excluded scope").fill("Google login and PDF export");
  await page.getByRole("button", { name: "Save baseline" }).click();
  await expect(
    page.getByText("Google login and PDF export", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Client request")
    .fill("Please add a complex loyalty system");
  await page
    .getByRole("button", { name: "Analyze scope", exact: true })
    .click();
  await expect(page.getByText("uncertain", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Dismiss result" }).click();
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of [
    projectUrl,
    "/app/dashboard",
    "/app/projects",
    "/app/clients",
    "/app/change-orders",
    "/app/payments",
    "/app/settings",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  const isolated = await browser.newContext();
  const other = await isolated.newPage();
  await other.goto("/login");
  await other.getByRole("button", { name: "Open demo workspace" }).click();
  await expect(other).toHaveURL(/\/app\/dashboard$/);
  await other.goto(projectUrl);
  await expect(
    other.getByRole("heading", { name: "Page unavailable" }),
  ).toBeVisible();
  await isolated.close();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/app/dashboard");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});

test("public link rejection, revocation and request origin protection", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  await page.getByRole("button", { name: "Load sample project" }).click();
  await page
    .getByRole("link", { name: "HAVN Coffee Website", exact: true })
    .click();
  await page.getByRole("link", { name: "Create manually" }).click();
  await page
    .getByLabel("Requested changes")
    .fill("Manual additional reporting work");
  await page.getByLabel(/Additional charge/).fill("50");
  await page.getByRole("button", { name: "Create draft", exact: true }).click();
  await page
    .getByRole("button", { name: "Create client approval link" })
    .click();
  const link = await page.getByLabel("Client approval link").inputValue();
  const ownerUrl = page.url();
  await page.goto(link);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reject proposed changes" }).click();
  await expect(page.getByText(/You rejected this change order/)).toBeVisible();
  await page.goto(ownerUrl);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Revoke approval link" }).click();
  await expect(page.getByText(/Link revoked\./)).toBeVisible();
  await page.goto(link);
  await expect(
    page.getByRole("heading", { name: "Approval link unavailable" }),
  ).toBeVisible();
  const result = await request.post("/api/auth", {
    data: { action: "demo" },
    headers: { Origin: "https://untrusted.example" },
  });
  expect(result.status()).toBe(403);
  await page.goto("/c/123");
  await expect(
    page.getByRole("heading", { name: "Approval link unavailable" }),
  ).toBeVisible();
});

test("marketing routes and keyboard focus", async ({ page }) => {
  for (const route of [
    "/",
    "/features",
    "/pricing",
    "/terms",
    "/privacy",
    "/register",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});
