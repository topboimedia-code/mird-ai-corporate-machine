import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "..";

describe("Button", () => {
  it("renders primary variant", () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders secondary variant", () => {
    const { container } = render(<Button variant="secondary">Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders ghost variant", () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders danger variant", () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("shows spinner when loading", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("fires onClick when not disabled", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders full width", () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
