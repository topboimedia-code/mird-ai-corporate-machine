import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "..";

describe("Badge", () => {
  it("renders cyan solid", () => {
    const { container } = render(<Badge color="cyan">Cyan</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders green solid", () => {
    const { container } = render(<Badge color="green">Green</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders orange solid", () => {
    const { container } = render(<Badge color="orange">Orange</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders red solid", () => {
    const { container } = render(<Badge color="red">Red</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders gray solid", () => {
    const { container } = render(<Badge color="gray">Gray</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders outline variant", () => {
    const { container } = render(
      <Badge color="cyan" variant="outline">
        Outline
      </Badge>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders children", () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});
