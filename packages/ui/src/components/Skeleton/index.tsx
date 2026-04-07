import { cn } from "../../lib/utils";
import type { SkeletonProps } from "./Skeleton.types";

export function Skeleton({
  variant = "rect",
  width,
  height,
  lines = 1,
  animate = true,
  className,
  ...props
}: SkeletonProps) {
  const base = cn("bg-surface-hover rounded", animate && "animate-pulse", className);

  if (variant === "circle") {
    const sz = width ?? height ?? 40;
    return (
      <div
        className={cn(base, "rounded-full")}
        style={{ width: sz, height: sz }}
        {...props}
      />
    );
  }

  if (variant === "text") {
    return (
      <div className="flex flex-col gap-2" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(base, "h-4")}
            style={{
              width:
                i === lines - 1 && lines > 1 ? "75%" : (width ?? "100%"),
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={base}
      style={{ width: width ?? "100%", height: height ?? 16 }}
      {...props}
    />
  );
}
