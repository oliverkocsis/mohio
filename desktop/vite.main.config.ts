import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: "dist/main",
    sourcemap: true,
    ssr: path.resolve(__dirname, "src/main/index.ts"),
    rollupOptions: {
      external: ["electron", "node:path"],
      output: {
        entryFileNames: "index.cjs",
        format: "cjs",
      },
    },
    target: "node22",
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
