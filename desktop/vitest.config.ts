import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@renderer": path.resolve(__dirname, "src/renderer"),
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/renderer/test/setup.ts"],
  },
});
