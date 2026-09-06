import { classifyRainfallSignal } from "./multimodalFusion";
import type { Crop, MultimodalContext, RiskAlert, RiskAlertSeverity, StageInsight } from "@/types";

/**
 * Early-Warning Risk Alerts
 * -------------------------
 * Fuses the weather outlook (live-fetched or manual — see
 * weatherService.server.ts) with the crop's water/risk profile and, where
 * available, exactly where it is in its growth cycle (cropStageEngine.ts)
 * to surface short, ahead-of-time warnings a farmer can act on — instead of
 * making them notice a dry spell or a vulnerable growth stage themselves.
 *
 * Deliberately rule-based and explainable (same style as the rest of the
 * scoring/insight engines): every alert states exactly which inputs
 * triggered it and what to do about it, rather than being a black-box
 * prediction.
 */

const HEAT_STRESS_C = 35;
const COLD_STRESS_C = 12;

// Stages named/tagged with these words tend to be the most moisture- and
// weather-sensitive points in a crop's cycle (as opposed to, say, land
// preparation or a late maturity/harvest window).
const MOISTURE_SENSITIVE_STAGE = /germinat|seedling|flower|fruit|grain|pod|tuber|boll/i;

function severityRank(s: RiskAlertSeverity): number {
  return { critical: 0, warning: 1, watch: 2, info: 3 }[s];
}

/**
 * Builds the ranked list of active risk alerts for the top-recommended
 * crop. Returns an empty array when there simply isn't enough signal yet
 * (no weather data at all is instead surfaced as a single low-priority
 * "info" nudge, not silence, so farmers know alerts will sharpen once they
 * add an outlook).
 */
export function getRiskAlerts(
  crop: Crop,
  ctx: MultimodalContext | undefined,
  stageInsight: StageInsight | null,
): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const weather = ctx?.weather;
  const rainSignal = classifyRainfallSignal(weather);
  const isSensitiveStage = stageInsight
    ? MOISTURE_SENSITIVE_STAGE.test(stageInsight.stage.name)
    : false;
  const stageClause = stageInsight
    ? ` It's currently in the "${stageInsight.stage.name}" stage${
        isSensitiveStage ? ", a moisture-sensitive period" : ""
      }.`
    : "";

  // --- Dry spell + a crop that needs meaningful water ---
  if (rainSignal === "dry" && crop.waterRequirement !== "Low") {
    alerts.push({
      id: "dry-irrigation",
      severity: crop.waterRequirement === "High" || isSensitiveStage ? "critical" : "warning",
      category: "irrigation",
      title: "Irrigation risk — dry spell ahead",
      message: `${
        weather?.forecastNote ?? "Below-normal rainfall is expected"
      } while ${crop.name} needs ${crop.waterRequirement.toLowerCase()} water.${stageClause}`,
      action: isSensitiveStage
        ? `Arrange supplemental irrigation now — the "${stageInsight?.stage.name}" stage is especially sensitive to water stress.`
        : "Plan supplemental irrigation or check soil moisture over the next few days.",
    });
  }

  // --- Heavy rain + a crop that doesn't want wet feet ---
  if (rainSignal === "wet" && crop.waterRequirement === "Low") {
    alerts.push({
      id: "wet-waterlogging",
      severity: isSensitiveStage ? "critical" : "warning",
      category: "irrigation",
      title: "Waterlogging risk — heavy rain ahead",
      message: `${
        weather?.forecastNote ?? "Above-normal rainfall is expected"
      }, but ${crop.name} prefers low water — excess moisture can bring on root rot or waterlogging.${stageClause}`,
      action: "Clear field drainage channels and avoid low-lying plots before the rain arrives.",
    });
  }

  // --- Wet + humid conditions raising fungal/pest pressure ---
  if (rainSignal === "wet" && stageInsight) {
    alerts.push({
      id: "disease-humidity",
      severity: isSensitiveStage ? "warning" : "watch",
      category: "pest-disease",
      title: "Higher disease pressure expected",
      message: `Wet, humid conditions ahead raise the risk of fungal disease during the "${stageInsight.stage.name}" stage.`,
      action:
        "Scout the crop closely over the next week and consider a preventive biofungicide (see the Sustainability plan below).",
    });
  }

  // --- Heat stress ---
  if (weather?.avgTemperatureC !== undefined && weather.avgTemperatureC >= HEAT_STRESS_C) {
    alerts.push({
      id: "heat-stress",
      severity: isSensitiveStage ? "warning" : "watch",
      category: "weather",
      title: "Heat stress risk",
      message: `Average temperatures around ${weather.avgTemperatureC}°C are forecast${
        weather.locationLabel ? ` near ${weather.locationLabel}` : ""
      }.${stageClause}`,
      action:
        "Favor early-morning or evening irrigation to cool the canopy and reduce heat stress.",
    });
  }

  // --- Cold stress ---
  if (weather?.avgTemperatureC !== undefined && weather.avgTemperatureC <= COLD_STRESS_C) {
    alerts.push({
      id: "cold-stress",
      severity: "watch",
      category: "weather",
      title: "Cold stress risk",
      message: `Average temperatures as low as ${weather.avgTemperatureC}°C are forecast, which can slow growth or damage sensitive seedlings.`,
      action: "Watch young plants closely for cold/frost damage over the next few days.",
    });
  }

  // --- Photo-detected issues (observed evidence, not just a forecast) ---
  const photoAnalysis = ctx?.cropPhotoAnalysis;
  if (photoAnalysis) {
    for (const finding of photoAnalysis.findings) {
      alerts.push({
        id: `photo-${finding.issue
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 40)}`,
        severity:
          finding.severity === "High"
            ? "critical"
            : finding.severity === "Medium"
              ? "warning"
              : "watch",
        category: "pest-disease",
        title: `Photo shows: ${finding.issue}`,
        message: finding.note,
        action:
          photoAnalysis.recommendedActions[0] ??
          "Inspect the crop closely and consult a local agronomist if it worsens.",
      });
    }
  }

  // --- No weather data supplied at all — alerts can't get sharper than this ---
  if (!weather) {
    alerts.push({
      id: "no-weather-data",
      severity: "info",
      category: "data-gap",
      title: "No weather outlook yet",
      message: "Early-warning alerts get much sharper once a weather outlook is available.",
      action:
        'Use "Auto-fetch live weather" in the Additional Farm Data section above, or enter it manually.',
    });
  }

  return alerts.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

/** Compact text block appended to the AI advisor's prompt context so its
 * narrative/chat answers also flag the same early-warning risks. */
export function buildRiskAlertNarrative(alerts: RiskAlert[]): string | null {
  const actionable = alerts.filter((a) => a.category !== "data-gap");
  if (!actionable.length) return null;

  const lines = actionable.map(
    (a) =>
      `- [${a.severity.toUpperCase()}] ${a.title}: ${a.message} Recommended action: ${a.action}`,
  );
  return `Early-warning risk alerts currently active for this crop:\n${lines.join("\n")}`;
}
