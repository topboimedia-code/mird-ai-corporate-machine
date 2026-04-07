import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DataTable } from "..";

type Row = { id: string; name: string; status: string };

const columns = [
  { key: "name" as const, header: "Name" },
  { key: "status" as const, header: "Status" },
];

const data: Row[] = [
  { id: "1", name: "Alice", status: "active" },
  { id: "2", name: "Bob", status: "inactive" },
];

describe("DataTable", () => {
  it("renders with data", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(
      <DataTable columns={columns} data={[]} emptyState="No records found" />
    );
    expect(screen.getByText("No records found")).toBeInTheDocument();
  });

  it("renders default empty state when no data and no emptyState prop", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders loading skeleton rows", () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} loading />
    );
    const skeletonCells = container.querySelectorAll(".animate-pulse");
    expect(skeletonCells.length).toBeGreaterThan(0);
  });

  it("renders column headers", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("calls onRowClick when row is clicked", async () => {
    const onRowClick = vi.fn();
    render(
      <DataTable columns={columns} data={data} onRowClick={onRowClick} />
    );
    const rows = screen.getAllByTestId("data-table-row");
    rows[0]?.click();
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });
});
