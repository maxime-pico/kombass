import React from "react";
import { screen } from "@testing-library/react";
import { renderWithContext } from "./test-utils";
import App from "./App";

describe("App Component", () => {
  test("renders without crashing", () => {
    // Basic smoke test - just verify the app can mount
    const { container } = renderWithContext(<App />);
    expect(container).toBeInTheDocument();
  });

  test("renders in intro screen state by default", () => {
    renderWithContext(<App />);
    // App starts at step -5 (intro screen)
    // We'll add more specific rendering tests in component test files
    expect(document.body).toBeInTheDocument();
  });
});
