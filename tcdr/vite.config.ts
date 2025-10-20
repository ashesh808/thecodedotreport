import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [
    react()
  ],
  appType: "custom",
  base: "/static/js",
  build: {
    outDir: "static/js",
    assetsDir: "assets",
    sourcemap: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/ts/app.ts"),
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src/ts") },
  },
});
