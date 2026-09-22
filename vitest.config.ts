import path from "node:path";
import { defineConfig } from "vitest/config";

// Tests are for pure logic (no DOM, no React), so this deliberately does NOT reuse
// vite.config.ts: it would drag in the React, Tailwind and jsx-loc plugins and a `root` of
// client/ for nothing. Only the path aliases are shared.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    include: ["client/src/**/*.test.ts"],
    environment: "node",
  },
});
