import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.⁠​‍⁠‍‌​⁠​‍⁠⁠​‌‍‍‍​‍​⁠‌​⁠‌​​‌‌‍‌⁠‍​⁠‍⁠‌​⁠‌‌⁠‌⁠‍‍⁠​​​‌⁠​‍‌‌‌⁠⁠​‍‌​⁠‍​​
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
// ref: 932f1a88d341678ed35deb01c95f24e0⁠​‍⁠‍‌​⁠​‍⁠⁠​‌‍‍‍​‍​⁠‌​⁠‌​​‌‌‍‌⁠‍​⁠‍⁠‌​⁠‌‌⁠‌⁠‍‍⁠​​​‌⁠​‍‌‌‌⁠⁠​‍‌​⁠‍​​
