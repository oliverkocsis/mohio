import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "mohioDesktop", {
  value: {
    appVersion: "0.1.0",
    electronVersion: "35.0.0",
    platform: "test",
  },
  configurable: true,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  }),
});

class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverStub,
});

HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
