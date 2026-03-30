// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Suppress unhandled rejections from spriteCache.ts fetch calls in jsdom
// (no real server to fetch from, but these are non-fatal preload errors)
process.on('unhandledRejection', (reason: any) => {
  if (reason?.message?.includes('Invalid URL') || reason?.message?.includes('Failed to parse URL')) {
    return; // Swallow sprite preload errors in test environment
  }
  throw reason; // Re-throw real errors
});
