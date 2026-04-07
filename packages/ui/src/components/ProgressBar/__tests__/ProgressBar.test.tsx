import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressBar } from "..";

describe("ProgressBar", () => {
  it("renders with value 50", () => {
    const { container } = render(
      <ProgressBar value={50} data-testid="progress" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with value 0", () => {
    render(<ProgressBar value={0} showValue label="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders with value 100", () => {
    render(<ProgressBar value={100} showValue />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders progressbar role", () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("clamps value above 100 to 100%", () => {
    render(<ProgressBar value={150} showValue />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders label", () => {
    render(<ProgressBar value={50} label="Leads" />);
    expect(screen.getByText("Leads")).toBeInTheDocument();
  });
});
