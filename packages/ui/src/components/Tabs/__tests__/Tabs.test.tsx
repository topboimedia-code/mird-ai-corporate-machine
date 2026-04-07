import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Tabs } from "..";
import type { Tab } from "..";

const tabs: Tab[] = [
  { id: "a", label: "Tab A", content: <div>Content A</div> },
  { id: "b", label: "Tab B", content: <div>Content B</div> },
  { id: "c", label: "Tab C", content: <div>Content C</div>, disabled: true },
];

describe("Tabs", () => {
  it("renders all tab labels", () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText("Tab A")).toBeInTheDocument();
    expect(screen.getByText("Tab B")).toBeInTheDocument();
    expect(screen.getByText("Tab C")).toBeInTheDocument();
  });

  it("shows first tab content by default", () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText("Content A")).toBeInTheDocument();
  });

  it("switches content on tab click", async () => {
    render(<Tabs tabs={tabs} />);
    await userEvent.click(screen.getByText("Tab B"));
    expect(screen.getByText("Content B")).toBeInTheDocument();
  });

  it("renders with defaultTab", () => {
    render(<Tabs tabs={tabs} defaultTab="b" />);
    expect(screen.getByText("Content B")).toBeInTheDocument();
  });

  it("renders with data-testid", () => {
    render(<Tabs tabs={tabs} data-testid="my-tabs" />);
    expect(screen.getByTestId("my-tabs")).toBeInTheDocument();
  });
});
