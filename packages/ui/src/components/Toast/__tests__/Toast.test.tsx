import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ToastProvider, useToast } from "..";

function ToastTrigger() {
  const { toast } = useToast();
  return (
    <button onClick={() => toast({ type: "success", title: "It worked!" })}>
      Show Toast
    </button>
  );
}

describe("ToastProvider", () => {
  it("renders children without crashing", () => {
    render(
      <ToastProvider>
        <div data-testid="child">Hello</div>
      </ToastProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders the toast container", () => {
    render(
      <ToastProvider>
        <div />
      </ToastProvider>
    );
    expect(screen.getByTestId("toast-container")).toBeInTheDocument();
  });

  it("shows a toast when triggered", async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );
    await userEvent.click(screen.getByText("Show Toast"));
    expect(screen.getByText("It worked!")).toBeInTheDocument();
  });
});
