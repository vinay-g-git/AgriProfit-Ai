import { useState } from "react";
import { LevelBadge } from "./LevelBadge";
import { formatINR } from "@/services/profitCalculator";
import type { CropAnalysis } from "@/types";

type SortKey = "score" | "profit" | "roi";

export function ComparisonTable({ results }: { results: CropAnalysis[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const sorted = [...results].sort((a, b) => b[sortKey] - a[sortKey]);

  const options: { key: SortKey; label: string }[] = [
    { key: "score", label: "Suitability" },
    { key: "profit", label: "Profit" },
    { key: "roi", label: "ROI" },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Compare Crops</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All 8 crops scored for your farm — demo estimates.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setSortKey(o.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                sortKey === o.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2.5 pr-4 font-semibold">Crop</th>
              <th className="py-2.5 pr-4 font-semibold">Suitability</th>
              <th className="py-2.5 pr-4 font-semibold">Investment</th>
              <th className="py-2.5 pr-4 font-semibold">Revenue</th>
              <th className="py-2.5 pr-4 font-semibold">Profit</th>
              <th className="py-2.5 pr-4 font-semibold">ROI</th>
              <th className="py-2.5 pr-4 font-semibold">Water</th>
              <th className="py-2.5 font-semibold">Risk</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.crop.id} className="border-b border-border/60 last:border-0">
                <td className="py-3 pr-4 font-medium">{r.crop.name}</td>
                <td className="py-3 pr-4 tabular-nums font-semibold text-primary">{r.score}</td>
                <td className="py-3 pr-4 tabular-nums">{formatINR(r.investment)}</td>
                <td className="py-3 pr-4 tabular-nums">{formatINR(r.revenue)}</td>
                <td className="py-3 pr-4 tabular-nums font-semibold">{formatINR(r.profit)}</td>
                <td className="py-3 pr-4 tabular-nums">{Math.round(r.roi)}%</td>
                <td className="py-3 pr-4">
                  <LevelBadge level={r.crop.waterRequirement} />
                </td>
                <td className="py-3">
                  <LevelBadge level={r.crop.risk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
