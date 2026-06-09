// Formatting helpers (frontend-architecture.md §11). Dates use IST, currency is INR.

const IST = "en-IN";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(IST, { day: "numeric", month: "short", year: "numeric" });
}

export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(IST, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "₹28.5L" style compact INR for offer amounts and bands. */
export function formatLakhs(lakhs: number): string {
  return `₹${lakhs.toLocaleString(IST)}L`;
}

/** Compact "just now" / "4h ago" / "3d ago" relative time for feeds and the bell. */
export function relativeTime(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDate(d);
}

export function formatINR(rupees: number): string {
  return new Intl.NumberFormat(IST, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/** Initials from a full name — "Aman Verma" -> "AV". */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Small whole numbers are written out for the editorial deks (design-system.md §3). */
const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
export function spell(n: number): string {
  return n >= 0 && n <= 10 ? WORDS[n] : String(n);
}

export function spellTitle(n: number): string {
  const w = spell(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
