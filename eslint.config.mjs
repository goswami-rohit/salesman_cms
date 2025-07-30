import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
   ignores: [
      "src/generated/prisma/", // This ignores the entire folder and its contents
      "src/generated/prisma/wasm.js", // Specific file if not covered by the folder ignore
      "node_modules/",
      ".next/",
      "dist/",
      "public/",
    ],
  },
  // You might also want to generally ignore build artifacts and node_modules
  {
    rules: {
      // Disable the 'no-explicit-any' rule (the one causing "Unexpected any" errors)
      "@typescript-eslint/no-explicit-any": "off",

      // Disable the 'no-unescaped-entities' rule (the one causing "can be escaped with" errors)
      "react/no-unescaped-entities": "off",

      // --- Optional: For the warnings you're seeing ---
      // If 'no-unused-vars' is blocking your build (i.e., treated as an error),
      // you can set it to "warn" or "off" temporarily.
      "@typescript-eslint/no-unused-vars": "warn", // or "off"
      "no-unused-vars": "warn", // For JavaScript files or non-TS contexts

      // If 'no-unused-expressions' is blocking your build, set to "warn" or "off".
      "@typescript-eslint/no-unused-expressions": "warn", // or "off"
      "no-unused-expressions": "warn", // For JavaScript files or non-TS contexts
      
      // To disable the Next.js <img> warning, though it's usually just a warning
      "@next/next/no-img-element": "off", 
    }
  }
];

export default eslintConfig;
