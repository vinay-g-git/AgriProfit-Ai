import { createServerFn } from "@tanstack/react-start";
import { chatCompletion, isAiConfigured } from "@/lib/aiProviders.server";
import { formatINR } from "./profitCalculator";
import { buildMultimodalNarrative } from "./multimodalFusion";
import { getSustainabilityPlan, buildSustainabilityNarrative } from "./sustainabilityEngine";
import { getStageInsight, buildStageNarrative } from "./cropStageEngine";
import { getRiskAlerts, buildRiskAlertNarrative } from "./riskAlertEngine";
import type { CropAnalysis, FarmInput, MultimodalContext } from "@/types";

export interface AdvisorChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Keep only what the model actually needs — smaller payload, and avoids
// leaking the full crop catalog / scoring internals into the prompt.
function summarizeResults(results: CropAnalysis[]) {
  return results.slice(0, 4).map((r) => ({
    name: r.crop.name,
    score: r.score,
    investment: r.investment,
    revenue: r.revenue,
    profit: r.profit,
    roi: r.roi,
    risk: r.crop.risk,
    water: r.crop.waterRequirement,
    duration: r.crop.growingDuration,
  }));
}

function buildFarmContext(
  farm: FarmInput,
  results: CropAnalysis[],
  context?: MultimodalContext | undefined,
) {
  const ranked = summarizeResults(results)
    .map(
      (r, i) =>
        `${i + 1}. ${r.name} — suitability ${r.score}/100, est. investment ${formatINR(r.investment)}, ` +
        `est. revenue ${formatINR(r.revenue)}, est. profit ${formatINR(r.profit)}, ROI ${r.roi.toFixed(0)}%, ` +
        `risk: ${r.risk}, water need: ${r.water}, duration: ${r.duration}.`,
    )
    .join("\n");

  const base = `Farmer profile:
- Location: ${farm.location}
- Land area: ${farm.landArea} acre(s)
- Soil type: ${farm.soilType}
- Water availability: ${farm.waterAvailability}
- Budget: ${formatINR(farm.budget)}
- Risk preference: ${farm.riskPreference}

Crop options ranked by a rule-based suitability score (soil match, water fit, budget fit, profit potential, risk fit — scores already reflect any additional data below):
${ranked}`;

  const multimodal = buildMultimodalNarrative(context);
  const sustainability = results.length
    ? buildSustainabilityNarrative(
        results[0]!.crop,
        getSustainabilityPlan(results[0]!.crop, farm, context),
      )
    : null;
  const stageInsight = results.length
    ? getStageInsight(results[0]!.crop, context?.daysSinceSowing)
    : null;
  const stage = results.length ? buildStageNarrative(results[0]!.crop, stageInsight) : null;
  const riskAlerts = results.length
    ? buildRiskAlertNarrative(getRiskAlerts(results[0]!.crop, context, stageInsight))
    : null;

  return [base, multimodal, sustainability, stage, riskAlerts].filter(Boolean).join("\n\n");
}

const SYSTEM_PROMPT = `You are the AgriProfit AI farm advisor. You help small and marginal Indian farmers understand crop recommendations in plain, practical, encouraging language.
Rules:
- Base every number you mention only on the data given to you. Never invent prices, yields, or figures that weren't provided.
- Keep answers concise (roughly 3-6 sentences) unless the farmer explicitly asks for more detail.
- Use simple, direct language — avoid jargon.
- When relevant, mention the green/eco-friendly input options and input-reduction practices provided in the context — these are a core part of the recommendation, not an afterthought.
- If an AI photo analysis is provided in the context, treat it as a preliminary visual read, not a confirmed diagnosis — say so if you reference it, and suggest an in-person/expert check for anything serious.
- If crop stage status is provided in the context, tailor your actions and cautions to that specific stage (what to do right now, what to watch out for) rather than giving generic season-long advice.
- If early-warning risk alerts are provided in the context, treat them as the most time-sensitive information you have — mention the most severe one(s) and their recommended action explicitly, don't bury them.
- These are estimates for decision support, not guarantees or professional financial advice — make that clear if the farmer is making a final decision.
- If asked something unrelated to farming, crops, or this analysis, politely redirect to farming topics.`;

/**
 * Generates a short natural-language recommendation for the top-ranked
 * crop. Falls back gracefully (available: false) when no API key is
 * configured, so the UI can show the existing rule-based explanation
 * instead of breaking.
 */
export const getAiInsight = createServerFn({ method: "POST" })
  .validator(
    (data: { farm: FarmInput; results: CropAnalysis[]; context?: MultimodalContext | undefined }) =>
      data,
  )
  .handler(async ({ data }) => {
    if (!isAiConfigured()) {
      return { available: false as const, reason: "not_configured" as const };
    }
    if (!data.results.length) {
      return { available: false as const, reason: "no_results" as const };
    }

    try {
      const context = buildFarmContext(data.farm, data.results, data.context);
      const topCrop = data.results[0]!.crop.name;
      const { text, provider } = await chatCompletion([
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `${context}\n\nWrite a short, friendly recommendation explaining why ${topCrop} ` +
            `is the top match for this farmer, and include one honest caution or risk to watch out for.`,
        },
      ]);
      return { available: true as const, text, provider };
    } catch (err) {
      console.error("[ai] getAiInsight failed:", err);
      return { available: false as const, reason: "error" as const };
    }
  });

/**
 * Interactive follow-up chat — lets the farmer ask questions about their
 * results ("why not tomato?", "what if my budget was lower?", etc.).
 */
export const askAiAdvisor = createServerFn({ method: "POST" })
  .validator(
    (data: {
      farm: FarmInput;
      results: CropAnalysis[];
      question: string;
      history: AdvisorChatMessage[];
      context?: MultimodalContext | undefined;
    }) => data,
  )
  .handler(async ({ data }) => {
    if (!isAiConfigured()) {
      return {
        available: false as const,
        error:
          "The AI advisor isn't set up yet. Add a free Groq API key (GROQ_API_KEY) to your .env file to enable it.",
      };
    }
    const question = data.question.trim();
    if (!question) {
      return { available: false as const, error: "Type a question first." };
    }
    if (question.length > 500) {
      return { available: false as const, error: "Please keep questions under 500 characters." };
    }

    try {
      const context = buildFarmContext(data.farm, data.results, data.context);
      // Cap history so the prompt stays small and cheap.
      const recentHistory = data.history.slice(-8);
      const { text, provider } = await chatCompletion([
        { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
        ...recentHistory,
        { role: "user", content: question },
      ]);
      return { available: true as const, text, provider };
    } catch (err) {
      console.error("[ai] askAiAdvisor failed:", err);
      return {
        available: false as const,
        error: "The AI advisor is temporarily unavailable. Please try again in a moment.",
      };
    }
  });
