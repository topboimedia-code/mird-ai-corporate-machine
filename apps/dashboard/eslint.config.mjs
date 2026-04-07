// eslint.config.mjs — ESLint 10 flat config for apps/dashboard
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "coverage/**", "next-env.d.ts"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Security: OWASP A03
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      // Allow _ prefix for intentionally unused destructured variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  }
);
