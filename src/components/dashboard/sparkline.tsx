import { cn } from "@/lib/cn";

export function Sparkline({
  data,
  positive = true,
  className,
}: {
  data: number[];
  positive?: boolean;
  className?: string;
}) {
  const width = 96;
  const height = 32;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = pad + (index / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `M ${points[0][0]} ${height - pad} L ${points
    .map(([x, y]) => `${x} ${y}`)
    .join(" L ")} L ${points[points.length - 1][0]} ${height - pad} Z`;

  const color = positive ? "#2dd4a8" : "#f87171";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-8 w-24", className)}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path d={area} fill={color} fillOpacity={0.12} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
