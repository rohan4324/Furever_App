// Custom EventTarget-based implementation for browser compatibility
class CustomEventEmitter extends EventTarget {
  emit(type: string, detail?: any) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type: string, listener: EventListener) {
    this.addEventListener(type, listener);
  }

  off(type: string, listener: EventListener) {
    this.removeEventListener(type, listener);
  }
}

// Global polyfills for simple-peer
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { 
    env: {},
    nextTick: (fn: Function) => setTimeout(fn, 0)
  };
  (window as any).CustomEventEmitter = CustomEventEmitter;
}

export { CustomEventEmitter };
