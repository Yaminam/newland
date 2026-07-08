"use client";

import { cn } from "@/app/lib/utils";

interface MatchRingProps {
  score: number;
  size?: 28 | 36 | 48 | 64;
  className?: string;
}

function getColor(score: number): string {
  if (score >= 90) return "var(--pos)";
  if (score >= 75) return "var(--blue)";
  if (score >= 60) return "var(--warn)";
  return "var(--faint)";
}

const fontSizeMap: Record<number, number> = {
  28: 9,
  36: 11,
  48: 14,
  64: 18,
};

export function MatchRing({ score, size = 48, className }: MatchRingProps) {
  const strokeWidth = size <= 36 ? 2.5 : 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getColor(score);
  const center = size / 2;
  const fontSize = fontSizeMap[size] ?? 14;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.6s ease-out, stroke 0.3s ease",
          }}
        />
      </svg>
      <span
        className="absolute font-bold"
        style={{
          color,
          fontSize,
          fontVariantNumeric: "tabular-nums",
          transition: "color 0.3s ease",
        }}
      >
        {score}
      </span>
    </div>
  );
}
