import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AlertBanner } from "..";

describe("AlertBanner", () => {
  it("renders info type", () => {
    const { container } = render(
      <AlertBanner type="info" title="Info Message" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders warning type", () => {
    const { container } = render(
      <AlertBanner type="warning" title="Warning Message" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders error type", () => {
    const { container } = render(
      <AlertBanner type="error" title="Error Message" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders success type", () => {
    const { container } = render(
      <AlertBanner type="success" title="Success Message" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders description", () => {
    render(
      <AlertBanner type="info" title="Title" description="Some description" />
    );
    expect(screen.getByText("Some description")).toBeInTheDocument();
  });

  it("renders dismissible and hides on click", async () => {
    const onDismiss = vi.fn();
    render(
      <AlertBanner
        type="info"
        title="Dismissible"
        dismissible
        onDismiss={onDismiss}
        data-testid="banner"
      />
    );
    expect(screen.getByTestId("banner")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByTestId("banner")).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("has role alert", () => {
    render(<AlertBanner type="warning" title="Alert" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
