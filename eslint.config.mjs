import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      // Disable React Compiler strict rules that conflict with valid patterns
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    // Node.js files
    files: ["server.js", "jest.config.js", "jest.setup.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        global: "readonly",
        Headers: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
      },
    },
  },
  {
    // Ignore auto-generated files
    files: ["next-env.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  }
);
