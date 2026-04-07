export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: "cyan" | "green" | "orange" | "red";
  "data-testid"?: string;
}
