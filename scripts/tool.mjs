import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const executables = {
  next: "next/dist/bin/next",
  vitest: "vitest/vitest.mjs",
  playwright: "@playwright/test/cli.js",
};
const [tool, ...args] = process.argv.slice(2);
if (!(tool in executables)) throw new Error("Unsupported tool.");
const temp = resolve(".tmp");
mkdirSync(temp, { recursive: true });
const child = spawn(
  process.execPath,
  [resolve("node_modules", executables[tool]), ...args],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      TEMP: temp,
      TMP: temp,
      TMPDIR: temp,
      PLAYWRIGHT_BROWSERS_PATH: resolve(".playwright-browsers"),
    },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
