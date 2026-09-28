"use client";

import { useId, useState } from "react";
import type { RevenuePoint } from "@/types";
import { formatCompact, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

export function RevenueChart({
  data,
  className,
  interactive = true,
}: {
  data: RevenuePoint[];
  className?: string;
  interactive?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();

  const width = 720;
  const height = 260;
  const pad = { top: 18, right: 8, bottom: 30, left: 8 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(...data.map((d) => d.revenue)) * 1.14;
  const step = innerW / data.length;
  const barW = Math.min(30, step * 0.4);

  const activePoint = active !== null ? data[active] : null;
  const rawLeft =
    active !== null ? ((pad.left + step * active + step / 2) / width) * 100 : 0;
  const tooltipLeft = Math.max(14, Math.min(86, rawLeft));

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Monthly revenue chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = pad.top + innerH * (1 - g);
          return (
            <g key={g}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="#26332d"
                strokeWidth={1}
              />
              <text
                x={width - pad.right}
                y={y - 6}
                textAnchor="end"
                fill="#7a8780"
                fontSize={11}
              >
                ${formatCompact(max * g)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = pad.left + step * i + (step - barW) / 2;
          const revH = (d.revenue / max) * innerH;
          const expH = (d.expenses / max) * innerH;
          const isCurrent = i === data.length - 1;
          const isActive = active === i;

          return (
            <g key={d.month}>
              <rect
                x={x + barW * 0.24}
                y={pad.top + innerH - expH}
                width={barW * 0.52}
                height={expH}
                rx={2.5}
                fill="#33413a"
                fillOpacity={0.6}
              />
              <rect
                x={x}
                y={pad.top + innerH - revH}
                width={barW}
                height={revH}
                rx={3}
                fill={`url(#${gradientId})`}
                fillOpacity={isCurrent || isActive ? 1 : 0.82}
              />
              <text
                x={pad.left + step * i + step / 2}
                y={height - 9}
                textAnchor="middle"
                fill={isCurrent ? "#9ba8a2" : "#56615b"}
                fontSize={11}
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {interactive && active !== null ? (
          <line
            x1={pad.left + step * active + step / 2}
            y1={pad.top}
            x2={pad.left + step * active + step / 2}
            y2={height - pad.bottom}
            stroke="#33413a"
            strokeWidth={1}
          />
        ) : null}

        {interactive
          ? data.map((d, i) => (
              <rect
                key={`hit-${d.month}`}
                x={pad.left + step * i}
                y={pad.top}
                width={step}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            ))
          : null}

        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6ee7b7" />
            <stop offset="1" stopColor="#2dd4a8" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      </svg>

      {interactive && activePoint ? (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2"
          style={{ left: `${tooltipLeft}%` }}
        >
          <div className="rounded-lg border border-line-strong bg-elevated px-3 py-2 shadow-lift">
            <p className="text-xs font-medium text-foreground">
              {activePoint.month}
              {activePoint.year ? ` ${activePoint.year}` : ""}
            </p>
            <div className="mt-1.5 space-y-1 text-xs">
              <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-sm bg-primary" />
                  Revenue
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(activePoint.revenue)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-5">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-sm bg-line-strong" />
                  Expenses
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(activePoint.expenses)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-5 border-t border-line pt-1.5">
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="h-2 w-2 rounded-sm bg-foreground/30" />
                  Net
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(activePoint.revenue - activePoint.expenses)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
