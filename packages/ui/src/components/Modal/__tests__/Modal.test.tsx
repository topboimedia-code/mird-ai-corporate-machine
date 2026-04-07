import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "..";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()}>
        Content
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders content when open", () => {
    render(
      <Modal open onClose={vi.fn()} title="Test Modal">
        <p>Modal body content</p>
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal body content")).toBeInTheDocument();
  });

  it("renders with role dialog", () => {
    render(
      <Modal open onClose={vi.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose on ESC key", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        Content
      </Modal>
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
