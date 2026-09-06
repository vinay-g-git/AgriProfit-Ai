import { createServerFn } from "@tanstack/react-start";
import { visionChatCompletion, isAiConfigured } from "@/lib/aiProviders.server";
import type { CropPhotoAnalysis, CropPhotoFinding, PhotoFindingSeverity } from "@/types";

/**
 * Photo-Based Disease/Pest Detection
 * -----------------------------------
 * Sends a farmer-uploaded crop photo to a vision-capable AI model (Groq —
 * free — or OpenAI, via src/lib/aiProviders.server.ts) and turns the
 * response into the same explainable shape the rest of the app uses:
 * a plain-language summary, a short list of specific findings with a
 * severity, and concrete next actions. Framed throughout as a preliminary
 * visual read, not a lab diagnosis.
 *
 * Runs server-side only (server function) so the image bytes and API keys
 * never need to be handled in the browser beyond the initial upload.
 */

// Rough guard on the base64 data URL length (≈1.37x the raw file size),
// mainly to avoid sending huge, slow, and needlessly expensive payloads.
const MAX_DATA_URL_LENGTH = 7 * 1024 * 1024;

const ALLOWED_SEVERITIES: PhotoFindingSeverity[] = ["Low", "Medium", "High"];

const SYSTEM_PROMPT = `You are an agronomy vision assistant helping small and marginal Indian farmers get a quick, preliminary read on a crop photo before deciding whether to act or call in expert help.

Respond with ONLY strict JSON, no markdown code fences, no commentary before or after, matching exactly this shape:
{"cropLooksHealthy": boolean, "summary": string, "findings": [{"issue": string, "severity": "Low"|"Medium"|"High", "note": string}], "recommendedActions": [string]}

Rules:
- Base every finding only on what's actually visible in the photo — never invent a crop, disease, or pest that isn't plausible from the image itself.
- If the crop looks healthy, set cropLooksHealthy to true, return an empty findings array, and say so plainly in the summary — do not manufacture problems to seem useful.
- List at most 4 findings, ordered most severe first, each with a one-sentence note.
- List at most 4 concrete, practical recommendedActions a small farmer could actually do.
- Keep the summary to 1-2 sentences.
- This is a preliminary visual read, not a lab diagnosis or a substitute for an agronomist — do not claim certainty, and mention uncertainty in the summary if the photo is unclear, blurry, or ambiguous.`;

export const analyzeCropPhoto = createServerFn({ method: "POST" })
  .validator((data: { imageDataUrl: string; farmerNote?: string | undefined }) => data)
  .handler(async ({ data }) => {
    if (!isAiConfigured()) {
      return { available: false as const, reason: "not_configured" as const };
    }
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(data.imageDataUrl)) {
      return { available: false as const, reason: "invalid_image" as const };
    }
    if (data.imageDataUrl.length > MAX_DATA_URL_LENGTH) {
      return {
        available: false as const,
        reason: "too_large" as const,
        message: "That image is too large to analyze — please use a photo under ~4MB.",
      };
    }

    try {
      const userText = data.farmerNote?.trim()
        ? `Farmer's own note about this photo: "${data.farmerNote.trim()}"\n\nAnalyze the attached crop photo.`
        : "Analyze the attached crop photo.";

      const { text, provider } = await visionChatCompletion(
        [{ role: "system", content: SYSTEM_PROMPT }],
        userText,
        data.imageDataUrl,
        true, // jsonMode — see visionChatCompletion for why this matters
      );

      const parsed = parseAnalysis(text);
      if (!parsed) {
        console.error(
          "[ai] analyzeCropPhoto: unparseable response, first 300 chars:",
          text.slice(0, 300),
        );
        return { available: false as const, reason: "parse_error" as const };
      }

      const analysis: CropPhotoAnalysis = {
        ...parsed,
        provider,
        analyzedAt: new Date().toISOString(),
      };
      return { available: true as const, analysis };
    } catch (err) {
      console.error("[ai] analyzeCropPhoto failed:", err);
      return { available: false as const, reason: "error" as const };
    }
  });

function parseAnalysis(raw: string): Omit<CropPhotoAnalysis, "provider" | "analyzedAt"> | null {
  try {
    const cleaned = raw
      .trim()
      // Defensive: some models (e.g. Qwen in thinking mode) can still wrap
      // reasoning in <think> tags even with reasoning_effort disabled —
      // strip it out so a stray thinking block doesn't break JSON.parse.
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const json = JSON.parse(cleaned) as {
      cropLooksHealthy?: unknown;
      summary?: unknown;
      findings?: unknown;
      recommendedActions?: unknown;
    };

    if (typeof json.summary !== "string" || !json.summary.trim()) return null;

    const findings: CropPhotoFinding[] = Array.isArray(json.findings)
      ? json.findings
          .filter(
            (f): f is Record<string, unknown> =>
              typeof f === "object" &&
              f !== null &&
              typeof (f as Record<string, unknown>)["issue"] === "string" &&
              typeof (f as Record<string, unknown>)["note"] === "string",
          )
          .slice(0, 4)
          .map((f) => {
            const severity = f["severity"];
            return {
              issue: f["issue"] as string,
              note: f["note"] as string,
              severity: ALLOWED_SEVERITIES.includes(severity as PhotoFindingSeverity)
                ? (severity as PhotoFindingSeverity)
                : "Medium",
            };
          })
      : [];

    const recommendedActions = Array.isArray(json.recommendedActions)
      ? json.recommendedActions.filter((a): a is string => typeof a === "string").slice(0, 4)
      : [];

    return {
      cropLooksHealthy: Boolean(json.cropLooksHealthy) && findings.length === 0,
      summary: json.summary.trim(),
      findings,
      recommendedActions,
    };
  } catch (err) {
    console.error("[ai] Failed to parse crop photo analysis JSON:", err);
    return null;
  }
}
