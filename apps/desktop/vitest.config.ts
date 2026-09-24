import path from "node:path";
import { uiConfig } from "@repo/vitest-config/ui";
import react from "@vitejs/plugin-react";
import { defineProject, mergeConfig } from "vitest/config";

export default mergeConfig(
  uiConfig,
  defineProject({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    test: {
      setupFiles: ["./tests/setup.ts"],
    },
  }),
);
