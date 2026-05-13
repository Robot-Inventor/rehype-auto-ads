import { defineConfig } from "eslint/config";
import { eslintConfig } from "@robot-inventor/eslint-config";

export default defineConfig(
    {
        ignores: ["**/*.test.ts"]
    },
    ...eslintConfig
);
