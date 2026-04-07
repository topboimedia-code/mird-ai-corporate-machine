import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptyState } from "..";

describe("EmptyState", () => {
  it("renders with required title only", () => {
    const { container } = render(<EmptyState title="No leads yet" />);
    expect(container.firstChild).toMatchSnapshot();
    expect(screen.getByText("No leads yet")).toBeInTheDocument();
  });

  it("renders with all props", () => {
    const { container } = render(
      <EmptyState
        title="No leads yet"
        description="Leads will appear once campaigns are live."
        action={<button>View Campaigns</button>}
        data-testid="empty-state"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders description", () => {
    render(
      <EmptyState
        title="Empty"
        description="Nothing here yet."
      />
    );
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders action button", () => {
    render(
      <EmptyState
        title="Empty"
        action={<button>Take Action</button>}
      />
    );
    expect(screen.getByText("Take Action")).toBeInTheDocument();
  });

  it("renders with data-testid", () => {
    render(<EmptyState title="Empty" data-testid="my-empty" />);
    expect(screen.getByTestId("my-empty")).toBeInTheDocument();
  });
});
