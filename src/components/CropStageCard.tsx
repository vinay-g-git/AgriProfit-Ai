import { Sprout, ListChecks, AlertTriangle, ArrowRight } from "lucide-react";
import type { StageInsight } from "@/types";

/** Surfaces the current growth-stage-aware insight for the recommended crop
 * (see src/services/cropStageEngine.ts): a progress timeline plus
 * stage-specific actions and watch-outs, driven by the optional
 * "days since sowing" the farmer provided. */
export function CropStageCard({ insight, cropName }: { insight: StageInsight; cropName: string }) {
  const { stage, stageIndex, totalStages, progressPct, daysSinceSowing, totalDurationDays } =
    insight;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sprout className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Crop Stage Insights</h2>
          <p className="text-xs text-muted-foreground">
            Where {cropName} is in its growth cycle, {daysSinceSowing} day
            {daysSinceSowing === 1 ? "" : "s"} after sowing.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Stage {stageIndex + 1} of {totalStages}
          </span>
          <span>
            {progressPct}% through ~{totalDurationDays}-day season
            {insight.isPastHarvest ? " · past typical duration" : ""}
          </span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Current stage */}
      <div className="mt-5 rounded-2xl bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Current Stage
          </span>
          <span className="text-sm font-semibold">{stage.name}</span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{stage.focus}</p>
      </div>

      {insight.nextStage && insight.daysUntilNextStage !== null && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
          Next: <span className="font-medium text-foreground">{insight.nextStage.name}</span> in
          about {insight.daysUntilNextStage} day{insight.daysUntilNextStage === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <ListChecks className="h-4 w-4 text-success" /> Do This Now
          </h3>
          <ul className="mt-2.5 space-y-1.5 text-sm">
            {stage.actions.map((a) => (
              <li key={a} className="flex gap-2">
                <span className="text-success">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning" /> Watch Out For
          </h3>
          <ul className="mt-2.5 space-y-1.5 text-sm">
            {stage.watchOuts.map((w) => (
              <li key={w} className="flex gap-2">
                <span className="text-warning">•</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
