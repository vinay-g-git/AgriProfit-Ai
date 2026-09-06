import { Leaf, Sprout, Droplet } from "lucide-react";
import { formatINR } from "@/services/profitCalculator";
import type { GreenInputType, SustainabilityPlan } from "@/types";

const TYPE_LABEL: Record<GreenInputType, string> = {
  biofertilizer: "Biofertilizer",
  biopesticide: "Biopesticide",
  "organic-amendment": "Organic Amendment",
  practice: "Practice",
};

const TYPE_STYLE: Record<GreenInputType, string> = {
  biofertilizer: "bg-success/10 text-success",
  biopesticide: "bg-primary/10 text-primary",
  "organic-amendment": "bg-warning/10 text-warning",
  practice: "bg-muted text-muted-foreground",
};

/** Surfaces the green/eco-friendly input plan and reduced-input estimate
 * for the recommended crop (see src/services/sustainabilityEngine.ts). */
export function SustainabilityCard({
  plan,
  cropName,
}: {
  plan: SustainabilityPlan;
  cropName: string;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
          <Leaf className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Sustainability &amp; Input Optimization</h2>
          <p className="text-xs text-muted-foreground">
            Green input swaps and reduced-input estimate for {cropName}.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface p-4">
          <div className="text-xs font-medium text-muted-foreground">Estimated Input Reduction</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-success">
            {plan.estimatedInputReductionPct}%
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            vs. a conventional, unoptimized input plan for this crop
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <div className="text-xs font-medium text-muted-foreground">Estimated Cost Savings</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-success">
            {formatINR(plan.estimatedCostSavings)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Indicative demo estimate, not a guaranteed figure
          </p>
        </div>
      </div>

      {plan.fertilityNote && (
        <p className="mt-4 rounded-xl bg-primary/5 px-3.5 py-2.5 text-xs font-medium text-primary">
          {plan.fertilityNote}
        </p>
      )}

      <div className="mt-5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sprout className="h-4 w-4 text-success" /> Recommended Green Inputs
        </h3>
        <ul className="mt-2.5 space-y-2">
          {plan.greenInputs.map((g) => (
            <li key={g.name} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{g.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_STYLE[g.type]}`}
                >
                  {TYPE_LABEL[g.type]}
                </span>
                {g.replaces && (
                  <span className="text-[11px] text-muted-foreground">replaces: {g.replaces}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{g.note}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Droplet className="h-4 w-4 text-primary" /> Input-Reduction Practices
        </h3>
        <ul className="mt-2.5 space-y-1.5 text-sm">
          {plan.reductionTips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-success">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
