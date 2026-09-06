import type {
  CropAnalysis,
  DataSourceFlag,
  FarmInput,
  MultimodalContext,
  WeatherSnapshot,
} from "@/types";

/**
 * Multimodal Fusion Layer
 * ------------------------
 * Orchestrates the different (optional) data sources described in the
 * "Multimodal AI Farm Decision Support System" problem statement — crop
 * photos, voice observations, weather, soil test metrics and historical
 * farm records — and merges them into:
 *
 *  1. `getActiveDataSources`   — which modalities were actually supplied,
 *                                 for a transparent "what was used" panel.
 *  2. `applyMultimodalContext` — small, explainable adjustments to the
 *                                 rule-based crop scores from
 *                                 recommendationEngine, so extra data
 *                                 actually changes the recommendation
 *                                 instead of sitting unused.
 *  3. `buildMultimodalNarrative` — a compact text summary that gets appended
 *                                 to the AI advisor's prompt context, so the
 *                                 LLM's explanation also reasons over photo
 *                                 notes, voice observations, weather and
 *                                 farm history — not just the basic form.
 *
 * Every adjustment here is intentionally simple and rule-based (mirroring
 * the existing recommendationEngine style) and always comes with a plain
 * language reason, so results stay explainable rather than a black box.
 */

const WATER_HEAVY_CROPS = new Set(["High"]);

function hasSoilMetrics(ctx?: MultimodalContext) {
  const s = ctx?.soilMetrics;
  if (!s) return false;
  return [s.nitrogen, s.phosphorus, s.potassium, s.ph, s.organicCarbon].some(
    (v) => v !== undefined && v !== null && !Number.isNaN(v),
  );
}

function hasWeather(ctx?: MultimodalContext) {
  const w = ctx?.weather;
  if (!w) return false;
  return (
    w.expectedRainfallMm !== undefined ||
    w.avgTemperatureC !== undefined ||
    Boolean(w.forecastNote?.trim())
  );
}

function hasHistory(ctx?: MultimodalContext) {
  return Boolean(ctx?.farmHistory && ctx.farmHistory.length > 0);
}

/** 0-100 soil fertility index from whatever metrics were provided (missing
 * values are simply excluded from the average rather than penalised, since
 * a farmer may only have partial soil-test results). */
export function fertilityIndex(ctx?: MultimodalContext): number | null {
  const s = ctx?.soilMetrics;
  if (!s || !hasSoilMetrics(ctx)) return null;

  const parts: number[] = [];
  if (s.nitrogen !== undefined) parts.push(Math.min(100, (s.nitrogen / 280) * 100));
  if (s.phosphorus !== undefined) parts.push(Math.min(100, (s.phosphorus / 25) * 100));
  if (s.potassium !== undefined) parts.push(Math.min(100, (s.potassium / 280) * 100));
  if (s.organicCarbon !== undefined) parts.push(Math.min(100, (s.organicCarbon / 0.75) * 100));
  if (s.ph !== undefined) {
    // Ideal band ~6.0-7.5 for most field crops; score falls off outside it.
    const distance = s.ph < 6 ? 6 - s.ph : s.ph > 7.5 ? s.ph - 7.5 : 0;
    parts.push(Math.max(0, 100 - distance * 30));
  }
  if (!parts.length) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

function isDrySignal(note?: string) {
  if (!note) return false;
  return /(dry|drought|deficit|below.?normal|scanty)/i.test(note);
}

function isWetSignal(note?: string) {
  if (!note) return false;
  return /(flood|excess|above.?normal|above.?average|heavy rain|surplus)/i.test(note);
}

// Manual "Weather Outlook" entries are, in practice, a seasonal expectation
// (hundreds of mm), while the live Open-Meteo auto-fetch (weatherService)
// only covers a 7-day outlook (tens of mm) — so the same absolute number
// means very different things depending on `source`. These bands mirror the
// ones weatherService uses to phrase its own forecast note.
const SEASONAL_DRY_MM = 400;
const SEASONAL_WET_MM = 1200;
const SHORT_RANGE_DRY_MM = 10;
const SHORT_RANGE_WET_MM = 70;

export type RainfallSignal = "dry" | "wet" | "normal" | null;

/** Single source of truth for "is this forecast dry/wet?", shared by the
 * fusion score adjustments below and the early-warning risk alert engine,
 * so the two never disagree about the same weather reading. */
export function classifyRainfallSignal(weather?: WeatherSnapshot): RainfallSignal {
  if (!weather) return null;
  if (isDrySignal(weather.forecastNote)) return "dry";
  if (isWetSignal(weather.forecastNote)) return "wet";
  if (weather.expectedRainfallMm === undefined) return null;

  const isShortRangeForecast = weather.source === "auto";
  const dryThreshold = isShortRangeForecast ? SHORT_RANGE_DRY_MM : SEASONAL_DRY_MM;
  const wetThreshold = isShortRangeForecast ? SHORT_RANGE_WET_MM : SEASONAL_WET_MM;

  if (weather.expectedRainfallMm < dryThreshold) return "dry";
  if (weather.expectedRainfallMm > wetThreshold) return "wet";
  return "normal";
}

export function getActiveDataSources(ctx?: MultimodalContext): DataSourceFlag[] {
  return [
    {
      key: "photo",
      label: "Crop Photo",
      active: Boolean(
        ctx?.cropPhotoNote?.trim() || ctx?.cropPhotoFileName || ctx?.cropPhotoAnalysis,
      ),
      summary: ctx?.cropPhotoAnalysis
        ? `AI: ${ctx.cropPhotoAnalysis.summary}`
        : ctx?.cropPhotoNote?.trim() || ctx?.cropPhotoFileName,
    },
    {
      key: "voice",
      label: "Voice Observation",
      active: Boolean(ctx?.voiceObservation?.trim()),
      summary: ctx?.voiceObservation?.trim(),
    },
    {
      key: "weather",
      label: "Weather",
      active: hasWeather(ctx),
      summary: ctx?.weather
        ? [
            ctx.weather.source === "auto" ? "Live" : null,
            ctx.weather.expectedRainfallMm !== undefined
              ? `${ctx.weather.expectedRainfallMm}mm expected rainfall`
              : null,
            ctx.weather.avgTemperatureC !== undefined
              ? `${ctx.weather.avgTemperatureC}°C avg`
              : null,
            ctx.weather.forecastNote?.trim() || null,
          ]
            .filter(Boolean)
            .join(" · ")
        : undefined,
    },
    {
      key: "soil",
      label: "Soil Test Report",
      active: hasSoilMetrics(ctx),
      summary:
        fertilityIndex(ctx) !== null ? `Fertility index ${fertilityIndex(ctx)}/100` : undefined,
    },
    {
      key: "history",
      label: "Farm History",
      active: hasHistory(ctx),
      summary: hasHistory(ctx) ? `${ctx!.farmHistory!.length} past season(s) logged` : undefined,
    },
    {
      key: "stage",
      label: "Crop Stage",
      active: ctx?.daysSinceSowing !== undefined && ctx.daysSinceSowing !== null,
      summary:
        ctx?.daysSinceSowing !== undefined
          ? `${ctx.daysSinceSowing} day(s) since sowing`
          : undefined,
    },
  ];
}

/**
 * Applies score adjustments derived from the multimodal context on top of
 * the existing rule-based results from `analyzeFarm`, then re-sorts and
 * re-ranks. Returns a new array — never mutates the input.
 */
export function applyMultimodalContext(
  results: CropAnalysis[],
  farm: FarmInput,
  ctx?: MultimodalContext,
): CropAnalysis[] {
  if (!ctx) return results;

  const fertility = fertilityIndex(ctx);
  const lastSeasonCrop = hasHistory(ctx)
    ? [...ctx.farmHistory!].sort((a, b) => a.season.localeCompare(b.season)).at(-1)?.crop
    : undefined;
  const rotationDiversity = hasHistory(ctx)
    ? new Set(ctx.farmHistory!.map((h) => h.crop.toLowerCase())).size
    : 0;

  const adjusted = results.map((r) => {
    let delta = 0;
    const extraReasons: { ok: boolean; text: string }[] = [];

    // --- Soil test metrics ---
    if (fertility !== null) {
      if (fertility >= 70) {
        delta += 5;
        extraReasons.push({
          ok: true,
          text: `Soil test shows good fertility (index ${fertility}/100)`,
        });
      } else if (fertility < 40) {
        delta -= 5;
        extraReasons.push({
          ok: false,
          text: `Soil test shows low fertility (index ${fertility}/100) — expect higher input cost`,
        });
      }
    }

    // --- Weather forecast ---
    if (ctx.weather) {
      const rainSignal = classifyRainfallSignal(ctx.weather);
      const dry = rainSignal === "dry";
      const wet = rainSignal === "wet";

      if (dry && WATER_HEAVY_CROPS.has(r.crop.waterRequirement)) {
        delta -= 8;
        extraReasons.push({
          ok: false,
          text: "Forecast points to below-normal rainfall — high water-need crop carries added risk",
        });
      }
      if (wet && r.crop.waterRequirement === "Low") {
        delta -= 4;
        extraReasons.push({
          ok: false,
          text: "Forecast points to heavy rainfall — low water-need crop may face waterlogging risk",
        });
      }
    }

    // --- Farm history / crop rotation ---
    if (lastSeasonCrop && lastSeasonCrop.toLowerCase() === r.crop.name.toLowerCase()) {
      delta -= 6;
      extraReasons.push({
        ok: false,
        text: `Same crop as last logged season — repeating ${r.crop.name} without rotation raises soil & pest risk`,
      });
    } else if (rotationDiversity >= 2) {
      delta += 3;
      extraReasons.push({ ok: true, text: "Your rotation history shows healthy crop diversity" });
    }

    if (delta === 0) return r;

    const score = Math.max(0, Math.min(100, r.score + delta));
    return { ...r, score, reasons: [...r.reasons, ...extraReasons] };
  });

  return adjusted.sort((a, b) => b.score - a.score || b.profit - a.profit);
}

/** Compact text block appended to the AI advisor's prompt context so the
 * LLM's narrative also reasons over photo/voice/weather/soil/history data. */
export function buildMultimodalNarrative(ctx?: MultimodalContext): string | null {
  if (!ctx) return null;
  const lines: string[] = [];

  if (ctx.cropPhotoNote?.trim()) {
    lines.push(`- Farmer-submitted crop photo notes: ${ctx.cropPhotoNote.trim()}`);
  }
  if (ctx.cropPhotoAnalysis) {
    const p = ctx.cropPhotoAnalysis;
    const findingsText = p.findings.length
      ? p.findings.map((f) => `${f.issue} (${f.severity} severity): ${f.note}`).join("; ")
      : "no specific issues detected";
    lines.push(
      `- AI photo analysis (${p.provider}, preliminary visual read, not a lab diagnosis): ${p.summary} ` +
        `Findings: ${findingsText}. Suggested actions: ${p.recommendedActions.join("; ") || "none"}.`,
    );
  }
  if (ctx.voiceObservation?.trim()) {
    lines.push(`- Farmer voice observation (transcribed): ${ctx.voiceObservation.trim()}`);
  }
  if (hasWeather(ctx)) {
    const w = ctx.weather!;
    const parts = [
      w.expectedRainfallMm !== undefined ? `expected rainfall ${w.expectedRainfallMm}mm` : null,
      w.avgTemperatureC !== undefined ? `avg temperature ${w.avgTemperatureC}°C` : null,
      w.forecastNote?.trim() ? `forecast note: ${w.forecastNote.trim()}` : null,
    ].filter(Boolean);
    if (parts.length) {
      const sourceNote =
        w.source === "auto"
          ? ` (live forecast${w.locationLabel ? ` for ${w.locationLabel}` : ""})`
          : "";
      lines.push(`- Weather outlook${sourceNote}: ${parts.join(", ")}`);
    }
  }
  if (hasSoilMetrics(ctx)) {
    const s = ctx.soilMetrics!;
    const parts = [
      s.nitrogen !== undefined ? `N ${s.nitrogen} kg/ha` : null,
      s.phosphorus !== undefined ? `P ${s.phosphorus} kg/ha` : null,
      s.potassium !== undefined ? `K ${s.potassium} kg/ha` : null,
      s.ph !== undefined ? `pH ${s.ph}` : null,
      s.organicCarbon !== undefined ? `organic carbon ${s.organicCarbon}%` : null,
    ].filter(Boolean);
    const fi = fertilityIndex(ctx);
    lines.push(
      `- Soil test: ${parts.join(", ")}${fi !== null ? ` (fertility index ${fi}/100)` : ""}`,
    );
  }
  if (hasHistory(ctx)) {
    const hist = ctx
      .farmHistory!.map(
        (h) => `${h.crop} (${h.season}${h.yieldPerAcre ? `, ${h.yieldPerAcre} qtl/acre` : ""})`,
      )
      .join("; ");
    lines.push(`- Farm history: ${hist}`);
  }

  if (!lines.length) return null;
  return `Additional multimodal farm data supplied by the farmer:\n${lines.join("\n")}`;
}
