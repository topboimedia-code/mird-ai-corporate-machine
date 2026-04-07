import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Input } from "..";

describe("Input", () => {
  it("renders without crashing", () => {
    const { container } = render(<Input />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with label", () => {
    render(<Input label="Email" placeholder="you@example.com" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders with error", () => {
    render(<Input label="Email" error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("renders with hint", () => {
    render(<Input label="Email" hint="We will never share your email" />);
    expect(screen.getByText("We will never share your email")).toBeInTheDocument();
  });

  it("hides hint when error is present", () => {
    render(<Input hint="Some hint" error="Some error" />);
    expect(screen.queryByText("Some hint")).not.toBeInTheDocument();
    expect(screen.getByText("Some error")).toBeInTheDocument();
  });
});
