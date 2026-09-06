import { useState } from "react";
import { LevelBadge } from "./LevelBadge";
import { formatINR } from "@/services/profitCalculator";
import type { CropAnalysis } from "@/types";

export function CropCard({ analysis, rank }: { analysis: CropAnalysis; rank: number }) {
  const [open, setOpen] = useState(false);
  const { crop } = analysis;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-muted-foreground">
            {rank === 2 ? "🥈 Second option" : "🥉 Third option"}
          </span>
          <h3 className="mt-1 text-lg font-semibold">{crop.name}</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums text-primary">{analysis.score}</div>
          <div className="text-[11px] text-muted-foreground">/100 suitability</div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Profit</dt>
          <dd className="font-semibold tabular-nums">{formatINR(analysis.profit)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ROI</dt>
          <dd className="font-semibold tabular-nums">{Math.round(analysis.roi)}%</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <LevelBadge level={crop.waterRequirement} label="Water" />
        <LevelBadge level={crop.risk} label="Risk" />
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-4 w-full rounded-xl border border-input px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        {open ? "Hide Details" : "View Details"}
      </button>

      {open && (
        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <p className="text-muted-foreground">{crop.description}</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Investment</span>
            <span className="font-medium tabular-nums">{formatINR(analysis.investment)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-medium tabular-nums">{formatINR(analysis.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{crop.growingDuration}</span>
          </div>
          <ul className="mt-2 space-y-1">
            {analysis.reasons.map((r) => (
              <li key={r.text} className={r.ok ? "text-foreground" : "text-muted-foreground"}>
                {r.ok ? "✓" : "•"} {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
