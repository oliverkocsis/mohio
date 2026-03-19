import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: "dist/preload",
    sourcemap: true,
    ssr: path.resolve(__dirname, "src/preload/index.ts"),
    rollupOptions: {
      external: ["electron"],
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
