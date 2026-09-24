import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// Browser APIs jsdom lacks that Radix, cmdk, the router and the panels use.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};

// Node 25's experimental localStorage shadows jsdom's and is unusable without --localstorage-file.
if (typeof globalThis.localStorage?.setItem !== "function") {
  const items = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, String(value)),
      removeItem: (key: string) => void items.delete(key),
      clear: () => items.clear(),
      key: (index: number) => [...items.keys()][index] ?? null,
      get length() {
        return items.size;
      },
    } satisfies Storage,
  });
}

Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as DOMRectList;
Range.prototype.getBoundingClientRect = () => new DOMRect();
