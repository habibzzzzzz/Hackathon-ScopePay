import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/domain/**/*.ts", "src/**/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "next",
                "next/**",
                "react",
                "react/**",
                "@supabase/**",
                "node:*",
                "**/infrastructure/**",
                "**/presentation/**",
              ],
              message:
                "Domain and application layers depend on entities and ports, not framework or provider implementations.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".npm-cache/**",
    ".tmp/**",
    ".playwright-browsers/**",
    ".data/**",
    "playwright-report/**",
    "test-results/**",
    "tests/.tmp-workspace-*/**",
  ]),
]);

export default eslintConfig;
