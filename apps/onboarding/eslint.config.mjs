// eslint.config.mjs — ESLint 10 flat config for apps/onboarding
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "coverage/**", "next-env.d.ts"],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  }
);
