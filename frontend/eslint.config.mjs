import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Too many instances to fix at once — address incrementally
      "@typescript-eslint/no-explicit-any": "warn",
      // JSX text escaping — cosmetic, doesn't affect behaviour
      "react/no-unescaped-entities": "warn",
      // New React 19 strict rules; existing code needs migration
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
];
