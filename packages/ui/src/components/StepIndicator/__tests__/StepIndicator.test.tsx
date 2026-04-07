import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StepIndicator } from "..";
import type { Step } from "..";

const steps: Step[] = [
  { id: "1", label: "Account", status: "complete" },
  { id: "2", label: "Profile", status: "current" },
  { id: "3", label: "Launch", status: "upcoming" },
];

describe("StepIndicator", () => {
  it("renders all steps", () => {
    render(<StepIndicator steps={steps} />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Launch")).toBeInTheDocument();
  });

  it("renders horizontal orientation", () => {
    const { container } = render(
      <StepIndicator steps={steps} orientation="horizontal" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders vertical orientation", () => {
    const { container } = render(
      <StepIndicator steps={steps} orientation="vertical" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with data-testid", () => {
    render(<StepIndicator steps={steps} data-testid="step-indicator" />);
    expect(screen.getByTestId("step-indicator")).toBeInTheDocument();
  });
});
