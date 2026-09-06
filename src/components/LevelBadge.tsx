import type { Level } from "@/types";

const styles: Record<Level, string> = {
  Low: "bg-success/12 text-success",
  Medium: "bg-warning/15 text-warning",
  High: "bg-danger/12 text-danger",
};

export function LevelBadge({ level, label }: { level: Level; label?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[level]}`}
    >
      {label ? `${label}: ` : ""}
      {level}
    </span>
  );
}
