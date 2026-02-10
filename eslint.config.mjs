import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";

const nextCoreWebVitals = nextPlugin.configs["core-web-vitals"];

export default [
  {
    ignores: ["node_modules/*", ".next/*", "out/*", "dist/*"]
  },
  js.configs.recommended,
  {
    ...nextCoreWebVitals,
    files: ["**/*.{js,jsx}"],
    plugins: {
      ...nextCoreWebVitals.plugins,
      react: reactPlugin
    },
    languageOptions: {
      ...nextCoreWebVitals.languageOptions,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ...nextCoreWebVitals.languageOptions?.parserOptions,
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          ...(nextCoreWebVitals.languageOptions?.parserOptions?.ecmaFeatures ?? {}),
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      ...nextCoreWebVitals.rules,
      "react/no-array-index-key": "warn",
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"]
        }
      ]
    }
  }
];
