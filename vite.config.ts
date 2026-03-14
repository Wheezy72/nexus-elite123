import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "node:module";

import { VitePWA } from "vite-plugin-pwa";

const require = createRequire(import.meta.url);
// Avoid deep imports blocked by package "exports".
// `require.resolve('libsodium-wrappers-sumo')` should point at the CJS entry.
const sodiumEntry = require.resolve("libsodium-wrappers-sumo");

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "Nexus Elite",
        short_name: "Nexus",
        description: "Your personal productivity command center",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Workaround: libsodium-wrappers-sumo ESM build references a missing ./libsodium-sumo.mjs.
      // Use an absolute path (resolved via CJS) to bypass package "exports" restrictions.
      "libsodium-wrappers-sumo": sodiumEntry,
    },
  },
}));
