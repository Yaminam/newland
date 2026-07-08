"use client";

import { cn } from "@/app/lib/utils";

/*
 * Shimmer keyframes are injected once via a <style> tag to avoid
 * depending on a global CSS file. The animation sweeps a translucent
 * highlight across the placeholder from left to right.
 */
const shimmerCSS = `
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

let injected = false;
function injectShimmer() {
  if (typeof document === "undefined" || injected) return;
  const style = document.createElement("style");
  style.textContent = shimmerCSS;
  document.head.appendChild(style);
  injected = true;
}

const shimmerStyle: React.CSSProperties = {
  background:
    "linear-gradient(90deg, var(--surface-3) 25%, var(--surface-2) 50%, var(--surface-3) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.8s ease-in-out infinite",
};

// --- SkeletonBlock ---

interface SkeletonBlockProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonBlock({
  width = "100%",
  height = 48,
  className,
}: SkeletonBlockProps) {
  injectShimmer();
  return (
    <div
      className={cn("rounded-[var(--r-md)]", className)}
      style={{ width, height, ...shimmerStyle }}
      aria-hidden
    />
  );
}

// --- SkeletonText ---

interface SkeletonTextProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonText({
  width = "60%",
  height = 14,
  className,
}: SkeletonTextProps) {
  injectShimmer();
  return (
    <div
      className={cn("rounded-[var(--r-xs)]", className)}
      style={{ width, height, ...shimmerStyle }}
      aria-hidden
    />
  );
}

// --- SkeletonCircle ---

interface SkeletonCircleProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonCircle({
  width = 48,
  height,
  className,
}: SkeletonCircleProps) {
  injectShimmer();
  const size = width;
  return (
    <div
      className={cn("shrink-0 rounded-full", className)}
      style={{ width: size, height: height ?? size, ...shimmerStyle }}
      aria-hidden
    />
  );
}
