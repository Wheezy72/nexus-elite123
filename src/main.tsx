import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";
import { migrateLegacyStorageKeys } from "./lib/storageMigration";

const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

// Avoid service worker caching when running locally (it can cause confusing stale builds).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  if (isLocalhost) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
  } else {
    registerSW({ immediate: true });
  }
}

migrateLegacyStorageKeys();

createRoot(document.getElementById("root")!).render(<App />);
