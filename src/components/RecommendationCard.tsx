import { LevelBadge } from "./LevelBadge";
import { AiInsight } from "./AiInsight";
import { formatINR } from "@/services/profitCalculator";
import type { CropAnalysis, FarmInput, MultimodalContext } from "@/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{value}</div>
    </div>
  );
}

export function RecommendationCard({
  analysis,
  farm,
  results,
  context,
}: {
  analysis: CropAnalysis;
  farm: FarmInput;
  results: CropAnalysis[];
  context?: MultimodalContext | undefined;
}) {
  const { crop } = analysis;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            🥇 Top Crop Recommendation
          </span>
          <h2 className="mt-1.5 text-3xl font-bold sm:text-4xl">{crop.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{crop.description}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 px-5 py-3 text-center">
          <div className="text-3xl font-bold tabular-nums text-primary">{analysis.score}</div>
          <div className="text-xs font-medium text-primary/80">/100 Suitability</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Estimated Investment" value={formatINR(analysis.investment)} />
        <Stat label="Estimated Revenue" value={formatINR(analysis.revenue)} />
        <Stat label="Estimated Profit" value={formatINR(analysis.profit)} />
        <Stat label="ROI" value={`${Math.round(analysis.roi)}%`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <LevelBadge level={crop.waterRequirement} label="Water" />
        <LevelBadge level={crop.risk} label="Risk" />
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          Duration: {crop.growingDuration}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <AiInsight analysis={analysis} farm={farm} results={results} context={context} />
      </div>
    </section>
  );
}
