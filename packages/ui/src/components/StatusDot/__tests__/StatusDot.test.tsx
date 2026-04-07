import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusDot } from "..";
import type { StatusDotColor } from "..";

describe("StatusDot", () => {
  const statuses: StatusDotColor[] = [
    "online",
    "processing",
    "at-risk",
    "offline",
    "standby",
  ];

  statuses.forEach((status) => {
    it(`renders ${status} status`, () => {
      const { container } = render(
        <StatusDot status={status} data-testid={`dot-${status}`} />
      );
      expect(screen.getByTestId(`dot-${status}`)).toBeInTheDocument();
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  it("renders with custom label", () => {
    render(<StatusDot status="online" label="System Online" />);
    expect(screen.getByLabelText("System Online")).toBeInTheDocument();
  });

  it("renders with all size variants", () => {
    const sizes = ["sm", "md", "lg"] as const;
    sizes.forEach((size) => {
      const { unmount } = render(<StatusDot status="online" size={size} />);
      unmount();
    });
  });
});
