import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const directory = resolve("artifacts/anti-slop");
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(error.message));
const results = [];
async function inspect(name) {
  await page.locator("h1").first().waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  const audit = await page.evaluate(() => {
    const parse = (value) => (value.match(/[\d.]+/g) ?? []).map(Number);
    const composite = (front, back) => {
      const alpha = front[3] ?? 1;
      return front.slice(0, 3).map((v, i) => v * alpha + back[i] * (1 - alpha));
    };
    const luminance = (rgb) =>
      rgb
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (a, b) => {
      const first = luminance(a);
      const second = luminance(b);
      return (
        (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
      );
    };
    const samples = [];
    for (const element of document.querySelectorAll("body *")) {
      const text = [...element.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join(" ");
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (
        !text ||
        !box.width ||
        !box.height ||
        element.closest("button:disabled") ||
        style.visibility === "hidden" ||
        style.display === "none" ||
        element.tagName === "SCRIPT" ||
        element.tagName === "STYLE"
      )
        continue;
      const parents = [];
      let current = element;
      while (current) {
        parents.unshift(current);
        current = current.parentElement;
      }
      let background = [255, 255, 255];
      for (const parent of parents)
        background = composite(
          parse(getComputedStyle(parent).backgroundColor),
          background,
        );
      const foreground = composite(parse(style.color), background);
      const ratio = contrast(foreground, background);
      const size = parseFloat(style.fontSize);
      const minimum =
        size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
          ? 3
          : 4.5;
      samples.push({
        text: text.slice(0, 90),
        ratio: Number(ratio.toFixed(2)),
        minimum,
        pass: ratio >= minimum,
      });
    }
    const undersized = [
      ...document.querySelectorAll("button,a,input,select,summary"),
    ]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.height < 44;
      })
      .map((e) => ({
        label: (e.textContent || e.getAttribute("aria-label") || e.tagName)
          .trim()
          .slice(0, 80),
        height: Math.round(e.getBoundingClientRect().height),
      }));
    return {
      viewport: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      samples,
      contrastFailures: samples.filter((s) => !s.pass),
      undersizedTargets: undersized,
    };
  });
  results.push({ name, url: new URL(page.url()).pathname, ...audit });
  await page.screenshot({
    path: resolve(directory, `${name}.png`),
    fullPage: true,
  });
}
try {
  await page.goto("http://localhost:3200/");
  await inspect("landing-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await inspect("landing-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://localhost:3200/login");
  await page.getByRole("button", { name: "Open demo workspace" }).click();
  await page.waitForURL("**/app/dashboard");
  await inspect("empty-dashboard");
  await page.getByRole("button", { name: "Load sample project" }).click();
  await page
    .getByRole("link", { name: "HAVN Coffee Website", exact: true })
    .click();
  await page.getByRole("button", { name: "Use sample request" }).click();
  await page
    .getByRole("button", { name: "Analyze scope", exact: true })
    .click();
  await page.getByRole("heading", { name: "Scope assessment" }).waitFor();
  await inspect("project-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await inspect("project-mobile");
  await page.setViewportSize({ width: 720, height: 500 });
  await inspect("project-200percent-equivalent");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Create change-order draft" }).click();
  await page
    .getByRole("button", { name: "Create client approval link" })
    .click();
  const link = await page.getByLabel("Client approval link").inputValue();
  await page.goto(link);
  await inspect("client-approval-desktop");
  await page.setViewportSize({ width: 375, height: 812 });
  await inspect("client-approval-mobile");
  await page
    .getByRole("button", { name: "Approve & create demo invoice" })
    .click();
  await page
    .getByRole("button", { name: "Simulate payment (no money moves)" })
    .click();
  await page.getByText("Simulated payment recorded. Thank you.").waitFor();
  await page.goto("http://localhost:3200/app/dashboard");
  await inspect("paid-dashboard-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await inspect("paid-dashboard-desktop");
  const report = { consoleErrors, results };
  await writeFile(
    resolve(directory, "measurements.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        consoleErrors,
        measurements: results.map((r) => ({
          name: r.name,
          overflow: r.overflow,
          contrastFailures: r.contrastFailures,
          undersizedTargets: r.undersizedTargets,
        })),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
