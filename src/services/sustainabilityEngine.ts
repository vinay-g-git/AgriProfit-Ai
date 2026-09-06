import { sustainabilityProfiles, genericSustainabilityProfile } from "@/data/greenInputs";
import { fertilityIndex } from "./multimodalFusion";
import type { Crop, FarmInput, MultimodalContext, SustainabilityPlan } from "@/types";

/** Rough, demo-only assumption of what share of per-acre production cost is
 * driven by fertilizer + pesticide spend (the part these practices target).
 * Everything here is clearly labelled as an indicative estimate in the UI. */
const INPUT_COST_SHARE = 0.35;

const MIN_REDUCTION_PCT = 5;
const MAX_REDUCTION_PCT = 40;

function clampPct(value: number) {
  return Math.max(MIN_REDUCTION_PCT, Math.min(MAX_REDUCTION_PCT, Math.round(value)));
}

/**
 * Builds a sustainability & input-optimization plan for a given crop:
 * green/eco-friendly input swaps plus a quantified, explainable estimate of
 * how much overall chemical input use (and cost) could be reduced. This
 * directly targets the problem statement's requirement to "strictly
 * recommend green/eco-friendly chemicals" and "optimize for reduced overall
 * input usage".
 */
export function getSustainabilityPlan(
  crop: Crop,
  farm: FarmInput,
  ctx?: MultimodalContext,
): SustainabilityPlan {
  const profile =
    sustainabilityProfiles.find((p) => p.cropId === crop.id) ?? genericSustainabilityProfile;

  let reductionPct = profile.baselineReductionPct;
  let fertilityNote: string | undefined;

  const fertility = fertilityIndex(ctx);
  if (fertility !== null) {
    if (fertility >= 70) {
      reductionPct += 5;
      fertilityNote =
        "Your soil test shows good existing fertility — you can safely cut synthetic fertilizer further than the default estimate.";
    } else if (fertility < 40) {
      reductionPct -= 4;
      fertilityNote =
        "Your soil test shows low fertility — build up organic matter first before cutting inputs aggressively.";
    }
  }

  reductionPct = clampPct(reductionPct);

  const investment = crop.productionCostPerAcre * farm.landArea;
  const estimatedCostSavings = Math.round(investment * INPUT_COST_SHARE * (reductionPct / 100));

  return {
    cropId: crop.id,
    greenInputs: profile.greenInputs,
    reductionTips: profile.reductionTips,
    estimatedInputReductionPct: reductionPct,
    estimatedCostSavings,
    fertilityNote,
  };
}

/** Compact text block appended to the AI advisor's prompt context so its
 * narrative also reasons over the green-input plan for the top crop. */
export function buildSustainabilityNarrative(crop: Crop, plan: SustainabilityPlan): string {
  const inputs = plan.greenInputs
    .map((i) => `${i.name} (${i.type}${i.replaces ? `, replaces ${i.replaces}` : ""}): ${i.note}`)
    .join("; ");
  const tips = plan.reductionTips.join("; ");

  return `Sustainability plan for ${crop.name}: estimated ${plan.estimatedInputReductionPct}% reduction in chemical fertilizer/pesticide use is achievable, worth roughly the cost savings already noted. Recommended green/eco-friendly inputs: ${inputs}. Input-reduction practices: ${tips}.${
    plan.fertilityNote ? ` Note: ${plan.fertilityNote}` : ""
  }`;
}
