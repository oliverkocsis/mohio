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

const clientRects = {
  length: 0,
  item: () => null,
  [Symbol.iterator]: function* iterator() {},
};

document.createRange = (() =>
  ({
    setStart() {},
    setEnd() {},
    collapse() {},
    cloneContents() {
      return document.createDocumentFragment();
    },
    cloneRange() {
      return this as unknown as Range;
    },
    commonAncestorContainer: document.body,
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    }),
    getClientRects: () => clientRects,
  })) as unknown as () => Range;

if (window.Range?.prototype) {
  window.Range.prototype.getBoundingClientRect = () => ({
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    x: 0,
    y: 0,
    toJSON: () => undefined,
  });
  window.Range.prototype.getClientRects = () => clientRects as unknown as DOMRectList;
}
