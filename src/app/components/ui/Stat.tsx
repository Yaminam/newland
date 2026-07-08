"use client";

import { cn } from "@/app/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatProps {
  label: string;
  value: string | number;
  delta?: number;
  sparkline?: number[];
  className?: string;
}

function MiniSparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 56;
  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--blue)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Stat({ label, value, delta, sparkline, className }: StatProps) {
  const isPositive = delta !== undefined && delta >= 0;
  const isNegative = delta !== undefined && delta < 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-[var(--r-lg)] bg-[var(--surface)] p-4",
        className
      )}
    >
      <span
        className="uppercase tracking-wider"
        style={{
          color: "var(--muted-2)",
          fontSize: 11,
          lineHeight: "16px",
          fontWeight: 500,
        }}
      >
        {label}
      </span>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="font-bold"
            style={{
              color: "var(--ink)",
              fontSize: 22,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.2,
            }}
          >
            {value}
          </span>

          {delta !== undefined && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: isPositive
                  ? "var(--pos-bg)"
                  : "var(--neg-bg)",
                color: isPositive ? "var(--pos)" : "var(--neg)",
                fontSize: 11,
              }}
            >
              {isPositive ? (
                <TrendingUp size={12} strokeWidth={1.75} />
              ) : (
                <TrendingDown size={12} strokeWidth={1.75} />
              )}
              {Math.abs(delta)}%
            </span>
          )}
        </div>

        {sparkline && sparkline.length > 1 && (
          <MiniSparkline data={sparkline} />
        )}
      </div>
    </div>
  );
}
