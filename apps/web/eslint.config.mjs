import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  { ignores: ["node_modules/**", ".next/**", "dist/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/features/listener/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/creator/**", "@/features/creator/*"],
              message: "Vague F: listener ne doit pas importer creator directement.",
            },
            {
              group: ["@/features/admin/**", "@/features/admin/*"],
              message: "Vague F: listener ne doit pas importer admin directement.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/creator/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/listener/**", "@/features/listener/*"],
              message: "Vague F: creator ne doit pas importer listener directement.",
            },
            {
              group: ["@/features/admin/**", "@/features/admin/*"],
              message: "Vague F: creator ne doit pas importer admin directement.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/listener/**", "@/features/listener/*"],
              message: "Vague F: admin ne doit pas importer listener directement.",
            },
            {
              group: ["@/features/creator/**", "@/features/creator/*"],
              message: "Vague F: admin ne doit pas importer creator directement.",
            },
          ],
        },
      ],
    },
  },
];
