/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
  },
};
