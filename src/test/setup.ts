import "@testing-library/jest-dom";

// Vitest runs in JSDOM, but we rely on Web Crypto in a few places.
// Node provides the implementation; expose it on window for browser-like code.
if (!window.crypto) {
  // @ts-expect-error - test-only shim
  window.crypto = globalThis.crypto;
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
