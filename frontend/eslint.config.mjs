import { defineConfig, globalIgnores } from "eslint/config"

import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

import tanstackQuery from "@tanstack/eslint-plugin-query"

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Third-party bundles copied in at build time (scripts/copy-map-assets.mjs).
    "public/vendor/**",
  ]),

  {
    plugins: {
      "@tanstack/query": tanstackQuery,
    },

    rules: {
      ...tanstackQuery.configs.recommended.rules,

      // A leading underscore means "deliberately unused" — a parameter
      // kept for signature stability, a destructured key discarded on
      // purpose. The codebase already writes `_locale` and
      // `({ [key]: _cleared, ...rest })` expecting that convention; this
      // is the config catching up, so the only unused-variable warnings
      // left are the accidental ones.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
])