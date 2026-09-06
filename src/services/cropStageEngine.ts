import { cropStageProfiles, genericCropStageProfile } from "@/data/cropStages";
import type { Crop, CropStageDefinition, StageInsight } from "@/types";

/**
 * Crop-Stage-Aware Insights
 * -------------------------
 * Targets the problem statement's "Actionable Insights tailored to crop
 * stage" requirement. Given a crop and how many days have passed since
 * sowing/transplanting (farmer-provided, optional), works out which growth
 * stage the crop is currently in (see src/data/cropStages.ts) and surfaces
 * stage-specific actions and watch-outs — instead of generic, one-size-fits-
 * all advice regardless of where the crop actually is in its season.
 */

/** Parses a "100-120 days" style duration string into an average day count.
 * Falls back to 110 (a reasonable mid-season default) if unparseable. */
export function parseAverageDurationDays(growingDuration: string): number {
  const matches = growingDuration.match(/\d+/g);
  if (!matches || !matches.length) return 110;
  const nums = matches.map(Number);
  if (nums.length === 1) return nums[0]!;
  return Math.round((nums[0]! + nums[1]!) / 2);
}

function getStageProfile(cropId: string) {
  return cropStageProfiles.find((p) => p.cropId === cropId) ?? genericCropStageProfile;
}

/**
 * Computes the current growth-stage insight for a crop, given how many days
 * have passed since sowing. Returns null when no valid `daysSinceSowing`
 * was supplied — callers should treat this feature as fully optional.
 */
export function getStageInsight(crop: Crop, daysSinceSowing?: number): StageInsight | null {
  if (daysSinceSowing === undefined || daysSinceSowing === null || Number.isNaN(daysSinceSowing)) {
    return null;
  }
  if (daysSinceSowing < 0) return null;

  const totalDurationDays = parseAverageDurationDays(crop.growingDuration);
  const profile = getStageProfile(crop.id);
  const clampedDays = Math.min(daysSinceSowing, totalDurationDays);
  const progressPct = Math.min(100, Math.round((clampedDays / totalDurationDays) * 100));
  const isPastHarvest = daysSinceSowing > totalDurationDays;

  const stageIndex = isPastHarvest
    ? profile.stages.length - 1
    : Math.max(
        0,
        profile.stages.findIndex((s) => progressPct >= s.startPct && progressPct <= s.endPct),
      );
  const stage = profile.stages[stageIndex] as CropStageDefinition;
  const nextStage = profile.stages[stageIndex + 1];

  const stageStartDays = Math.round((stage.startPct / 100) * totalDurationDays);
  const stageEndDays = Math.round((stage.endPct / 100) * totalDurationDays);
  const daysIntoStage = Math.max(0, daysSinceSowing - stageStartDays);
  const daysUntilNextStage = nextStage ? Math.max(0, stageEndDays - daysSinceSowing) : null;

  return {
    cropId: crop.id,
    daysSinceSowing,
    totalDurationDays,
    progressPct,
    stage,
    stageIndex,
    totalStages: profile.stages.length,
    daysIntoStage,
    daysUntilNextStage,
    nextStage,
    isPastHarvest,
  };
}

/** Compact text block appended to the AI advisor's prompt context so its
 * narrative/chat answers also reason over where the crop is in its growth
 * cycle right now, not just the static crop profile. */
export function buildStageNarrative(crop: Crop, insight: StageInsight | null): string | null {
  if (!insight) return null;

  const { stage, progressPct, daysSinceSowing, totalDurationDays, daysUntilNextStage, nextStage } =
    insight;

  const timing = insight.isPastHarvest
    ? `${daysSinceSowing} days have passed since sowing, beyond the crop's typical ${totalDurationDays}-day duration — the crop should be at or near harvest.`
    : `${daysSinceSowing} of an estimated ${totalDurationDays} growing days have passed (${progressPct}% through the season)`;

  const nextStageNote =
    nextStage && daysUntilNextStage !== null
      ? ` The next stage, "${nextStage.name}", is expected in roughly ${daysUntilNextStage} day(s).`
      : "";

  return `Crop stage status for ${crop.name}: ${timing} The crop is currently in the "${stage.name}" stage — ${stage.focus} Recommended actions right now: ${stage.actions.join("; ")}. Watch out for: ${stage.watchOuts.join("; ")}.${nextStageNote}`;
}
