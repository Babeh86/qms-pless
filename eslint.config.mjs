import { dirname } from "path";
import { fileURLToPath } from "url";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "prisma/migrations/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "public/sw.js",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { i18next },
    languageOptions: {
      parserOptions: { tsconfigRootDir: __dirname },
    },
    rules: {
      // Larangan string UI hardcode (SPEC-0001 §7)
      "i18next/no-literal-string": [
        "warn",
        {
          mode: "jsx-text-only",
          "should-validate-template": false,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "prisma/**/*.ts", "*.config.{ts,mjs}", "src/server/**/*.ts"],
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "prisma/**/*.ts", "scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];

export default eslintConfig;
