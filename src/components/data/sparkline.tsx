import { c } from "@/lib/tokens";

// Minimal line sparkline (design-system.md §7.2). Pure SVG — no animation needed.
export function Sparkline({
  points,
  width = 100,
  height = 32,
  className = "h-10 w-full",
}: {
  points: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / span) * height;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = height - ((points[points.length - 1] - min) / span) * height;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className}>
      <path d={d} fill="none" stroke={c.ink} strokeWidth={1.2} strokeLinecap="round" />
      <circle cx={width} cy={lastY} r={2} fill={c.accent} />
    </svg>
  );
}
