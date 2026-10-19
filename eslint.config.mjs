import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// The previous config switched off nearly every rule (including no-undef, no-unreachable and
// react-hooks/exhaustive-deps), so "0 problems" meant nothing. These are the real rules again,
// with a short, deliberate list of relaxations.
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "off",
      // shadcn/ui primitives and the polling store intentionally read refs during render
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["src/components/ui/**"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/**", "desktop/**", "desktop-build/**", "release/**"],
  },
];

export default eslintConfig;
