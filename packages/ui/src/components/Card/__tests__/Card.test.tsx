import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "..";

describe("Card", () => {
  it("renders default variant", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders elevated variant", () => {
    const { container } = render(<Card variant="elevated">Content</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders outlined variant", () => {
    const { container } = render(<Card variant="outlined">Content</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders with no padding", () => {
    const { container } = render(<Card padding="none">Content</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
