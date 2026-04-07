import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "..";
import type { NavItem } from "..";

const items: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <span>D</span>,
    href: "/dashboard",
    active: true,
  },
  {
    id: "leads",
    label: "Leads",
    icon: <span>L</span>,
    href: "/leads",
    badge: 5,
  },
];

describe("Sidebar", () => {
  it("renders expanded", () => {
    const { container } = render(<Sidebar items={items} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders collapsed", () => {
    const { container } = render(<Sidebar items={items} collapsed />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders item labels when expanded", () => {
    render(<Sidebar items={items} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Leads")).toBeInTheDocument();
  });

  it("calls onToggle when toggle button clicked", async () => {
    const onToggle = vi.fn();
    render(<Sidebar items={items} onToggle={onToggle} />);
    await userEvent.click(screen.getByTestId("sidebar-toggle"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("renders sidebar item test ids", () => {
    render(<Sidebar items={items} />);
    expect(screen.getByTestId("sidebar-item-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-item-leads")).toBeInTheDocument();
  });
});
