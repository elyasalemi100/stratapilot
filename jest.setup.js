import "@testing-library/jest-dom";

// JSDOM doesn't include ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
