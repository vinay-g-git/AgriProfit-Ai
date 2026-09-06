import { crops } from "@/data/crops";
import { calculateEconomics } from "./profitCalculator";
import type { CropAnalysis, Crop, FarmInput, Level } from "@/types";

const levelRank: Record<Level, number> = { Low: 1, Medium: 2, High: 3 };

// Soil compatibility: 30 points
function soilScore(crop: Crop, farm: FarmInput) {
  return crop.suitableSoils.includes(farm.soilType) ? 30 : 10;
}

// Water compatibility: 25 points
function waterScore(crop: Crop, farm: FarmInput) {
  const diff = levelRank[crop.waterRequirement] - levelRank[farm.waterAvailability];
  if (diff <= 0) return 25; // needs same or less water than available
  return diff === 1 ? 12 : 4;
}

// Budget compatibility: 20 points
function budgetScore(crop: Crop, farm: FarmInput) {
  const needed = crop.productionCostPerAcre * farm.landArea;
  if (farm.budget >= needed) return 20;
  const ratio = farm.budget / needed;
  if (ratio >= 0.8) return 12;
  if (ratio >= 0.6) return 6;
  return 0;
}

// Profit potential: 15 points (relative ROI across the dataset)
function profitScore(roi: number, maxRoi: number) {
  if (maxRoi <= 0) return 0;
  return Math.max(0, Math.round((roi / maxRoi) * 15));
}

// Risk compatibility: 10 points
function riskScore(crop: Crop, farm: FarmInput) {
  const diff = levelRank[crop.risk] - levelRank[farm.riskPreference];
  if (diff <= 0) return 10;
  return diff === 1 ? 5 : 0;
}

export function analyzeFarm(farm: FarmInput): CropAnalysis[] {
  const economics = crops.map((crop) => ({ crop, ...calculateEconomics(crop, farm.landArea) }));
  const maxRoi = Math.max(...economics.map((e) => e.roi));

  const results: CropAnalysis[] = economics.map(({ crop, revenue, investment, profit, roi }) => {
    const breakdown = {
      soil: soilScore(crop, farm),
      water: waterScore(crop, farm),
      budget: budgetScore(crop, farm),
      profit: profitScore(roi, maxRoi),
      risk: riskScore(crop, farm),
    };
    const score = Math.min(
      100,
      breakdown.soil + breakdown.water + breakdown.budget + breakdown.profit + breakdown.risk,
    );

    const reasons = [
      {
        ok: breakdown.soil === 30,
        text: breakdown.soil === 30
          ? `Compatible with ${farm.soilType}`
          : `Not a typical match for ${farm.soilType}`,
      },
      {
        ok: breakdown.water === 25,
        text: breakdown.water === 25
          ? `Water requirement (${crop.waterRequirement}) fits your ${farm.waterAvailability} availability`
          : `Needs ${crop.waterRequirement} water, above your ${farm.waterAvailability} availability`,
      },
      {
        ok: breakdown.budget === 20,
        text: breakdown.budget === 20
          ? "Estimated investment fits within your budget"
          : "Estimated investment exceeds your budget",
      },
      {
        ok: breakdown.profit >= 10,
        text: breakdown.profit >= 10
          ? "Good estimated profit potential"
          : "Modest estimated profit potential",
      },
      {
        ok: breakdown.risk === 10,
        text: breakdown.risk === 10
          ? `${crop.risk} risk suits your ${farm.riskPreference} risk preference`
          : `${crop.risk} risk is above your ${farm.riskPreference} risk preference`,
      },
    ];

    return { crop, revenue, investment, profit, roi, score, breakdown, reasons };
  });

  return results.sort((a, b) => b.score - a.score || b.profit - a.profit);
}

export function buildInsight(a: CropAnalysis, farm: FarmInput): string {
  const good = a.reasons.filter((r) => r.ok).length;
  const base = `${a.crop.name} scores ${a.score}/100 for a ${farm.landArea}-acre ${farm.soilType.toLowerCase()} farm in ${farm.location}`;
  if (good >= 4) {
    return `${base} because it matches the selected soil type, fits the available water level and stays within the estimated farming budget.`;
  }
  return `${base}. It ranks highest among the compared crops, though some conditions are only a partial match — review the checklist below.`;
}
