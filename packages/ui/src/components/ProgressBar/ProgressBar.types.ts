export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "cyan" | "green" | "orange" | "red";
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  "data-testid"?: string;
}
