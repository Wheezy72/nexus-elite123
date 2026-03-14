import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Avoid deep imports blocked by package "exports".
// `require.resolve('libsodium-wrappers-sumo')` should point at the CJS entry.
const sodiumEntry = require.resolve("libsodium-wrappers-sumo");

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "libsodium-wrappers-sumo": sodiumEntry,
    },
  },
});
