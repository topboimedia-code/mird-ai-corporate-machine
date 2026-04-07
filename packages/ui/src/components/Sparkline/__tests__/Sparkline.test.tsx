import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Sparkline } from "..";

describe("Sparkline", () => {
  it("renders SVG with data", () => {
    const { container } = render(
      <Sparkline data={[10, 20, 15, 30, 25]} data-testid="sparkline" />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders fallback div with fewer than 2 data points", () => {
    render(<Sparkline data={[]} data-testid="sparkline-empty" />);
    expect(screen.getByTestId("sparkline-empty")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeNull();
  });

  it("renders single data point as fallback", () => {
    render(<Sparkline data={[5]} data-testid="sparkline-single" />);
    expect(screen.getByTestId("sparkline-single")).toBeInTheDocument();
  });

  it("renders with all color variants without crashing", () => {
    const colors = ["cyan", "green", "orange", "red"] as const;
    colors.forEach((color) => {
      const { unmount } = render(<Sparkline data={[1, 2, 3]} color={color} />);
      unmount();
    });
  });
});
