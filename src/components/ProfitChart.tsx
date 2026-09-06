import { formatINR } from "@/services/profitCalculator";
import type { CropAnalysis } from "@/types";

/** CSS-based horizontal bar chart — no chart dependency needed. */
export function ProfitChart({ results }: { results: CropAnalysis[] }) {
  const sorted = [...results].sort((a, b) => b.profit - a.profit);
  const max = Math.max(...sorted.map((r) => Math.abs(r.profit)), 1);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <h2 className="text-xl font-semibold">Estimated Profit by Crop</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Based on your land area and demo estimates.
      </p>
      <div className="mt-6 space-y-3.5">
        {sorted.map((r) => (
          <div key={r.crop.id} className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
            <span className="truncate text-sm font-medium">{r.crop.name}</span>
            <div className="flex items-center gap-3">
              <div className="h-6 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${r.profit >= 0 ? "bg-primary" : "bg-destructive"}`}
                  style={{ width: `${Math.max(3, (Math.abs(r.profit) / max) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                {formatINR(r.profit)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
