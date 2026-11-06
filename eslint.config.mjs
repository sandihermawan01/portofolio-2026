import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

// ESLint 9 requires a flat config. `eslint-config-next` still ships its
// rules in the old eslintrc shape, so FlatCompat bridges the two — this is
// the setup Next.js itself documents for v9 (see
// https://nextjs.org/docs/app/api-reference/config/eslint).
const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "tests/rules/**"],
  },
];

export default eslintConfig;
