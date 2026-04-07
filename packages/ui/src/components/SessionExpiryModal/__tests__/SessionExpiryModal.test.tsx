import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SessionExpiryModal } from "..";

describe("SessionExpiryModal", () => {
  it("renders when open", () => {
    const { container } = render(
      <SessionExpiryModal
        open={true}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders nothing when closed", () => {
    const { queryByTestId } = render(
      <SessionExpiryModal
        open={false}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    expect(queryByTestId("session-logout-button")).toBeNull();
  });

  it("renders logout and refresh buttons when open", () => {
    const { getByTestId } = render(
      <SessionExpiryModal
        open={true}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    expect(getByTestId("session-logout-button")).toBeInTheDocument();
    expect(getByTestId("session-refresh-button")).toBeInTheDocument();
  });
});
