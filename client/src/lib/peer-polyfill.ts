// Polyfill for simple-peer's global requirements
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: {} };
  (window as any).Buffer = require('buffer').Buffer;
}

export {};
