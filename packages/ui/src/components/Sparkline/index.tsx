import type { SparklineProps } from "./Sparkline.types";

const colorMap: Record<string, string> = {
  cyan: "#00D4FF",
  green: "#00FF88",
  orange: "#FF6B35",
  red: "#FF3B3B",
};

export function Sparkline({
  data,
  width = 80,
  height = 32,
  color = "cyan",
  "data-testid": testId,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <div
        data-testid={testId}
        style={{ width, height }}
        className="bg-surface rounded"
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * w;
      const y = pad + (1 - (v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      data-testid={testId}
    >
      <polyline
        points={points}
        stroke={colorMap[color]}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
