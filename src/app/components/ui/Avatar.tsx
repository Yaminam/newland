"use client";

import { cn } from "@/app/lib/utils";

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
} as const;

const fontSizeMap = {
  sm: 11,
  md: 13,
  lg: 16,
  xl: 22,
} as const;

const gradients = [
  ["var(--t-angel)", "var(--t-vc)"],
  ["var(--t-vc)", "var(--t-bank)"],
  ["var(--t-bank)", "var(--t-nbfc)"],
  ["var(--t-nbfc)", "var(--t-fo)"],
  ["var(--t-fo)", "var(--t-cvc)"],
  ["var(--t-cvc)", "var(--t-angel)"],
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const px = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const gradientIndex = hashName(name) % gradients.length;
  const [from, to] = gradients[gradientIndex];

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none",
        className
      )}
      style={{ width: px, height: px }}
      aria-label={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${from}, ${to})`,
            fontSize,
          }}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
