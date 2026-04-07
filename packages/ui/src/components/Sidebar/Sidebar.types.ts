import type { ReactNode } from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
  badge?: string | number;
  active?: boolean;
}

export interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  logo?: ReactNode;
  "data-testid"?: string;
}
