module.exports = {
  extends: ["next", "prettier", "eslint:recommended"],
  settings: {
    next: {
      rootDir: ["apps/*/", "packages/*/"],
    },
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "error",
    "no-unused-vars": "warn",
    "no-console": ["warn", { allow: ["warn", "error", "info"] }]
  },
};
