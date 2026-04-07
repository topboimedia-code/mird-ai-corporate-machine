import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton } from "..";

describe("Skeleton", () => {
  it("renders rect variant", () => {
    const { container } = render(<Skeleton variant="rect" height={80} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders text variant", () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders circle variant", () => {
    const { container } = render(
      <Skeleton variant="circle" width={48} height={48} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders multiple text lines", () => {
    const { container } = render(<Skeleton variant="text" lines={4} />);
    // firstChild is the flex wrapper; its direct children are the skeleton lines
    const lines = container.firstChild?.childNodes;
    expect(lines?.length).toBe(4);
  });

  it("renders without animation when animate=false", () => {
    const { container } = render(<Skeleton animate={false} />);
    expect(
      container.firstChild?.toString().includes("animate-pulse")
    ).toBe(false);
  });
});
