import type { Crop } from "@/types";

export function formatINR(value: number): string {
  return "₹" + Math.round(value).toLocaleString("en-IN");
}

export function calculateEconomics(crop: Crop, landArea: number) {
  const revenue = crop.estimatedYieldPerAcre * crop.estimatedSellingPrice * landArea;
  const investment = crop.productionCostPerAcre * landArea;
  const profit = revenue - investment;
  const roi = investment > 0 ? (profit / investment) * 100 : 0;
  return { revenue, investment, profit, roi };
}
