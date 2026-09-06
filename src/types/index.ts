export type SoilType = "Red Soil" | "Black Soil" | "Alluvial Soil" | "Sandy Soil" | "Loamy Soil";
export type Level = "Low" | "Medium" | "High";
export type LocationName = "Karnataka" | "Tamil Nadu" | "Andhra Pradesh" | "Telangana" | "Other";

export interface Crop {
  id: string;
  name: string;
  suitableSoils: SoilType[];
  waterRequirement: Level;
  minimumBudgetPerAcre: number;
  estimatedYieldPerAcre: number; // quintals per acre
  estimatedSellingPrice: number; // rupees per quintal
  productionCostPerAcre: number;
  risk: Level;
  growingDuration: string;
  description: string;
}

export interface FarmInput {
  location: LocationName;
  landArea: number;
  soilType: SoilType;
  waterAvailability: Level;
  budget: number;
  riskPreference: Level;
}

export interface CropAnalysis {
  crop: Crop;
  investment: number;
  revenue: number;
  profit: number;
  roi: number;
  score: number;
  breakdown: {
    soil: number;
    water: number;
    budget: number;
    profit: number;
    risk: number;
  };
  reasons: { ok: boolean; text: string }[];
}

/**
 * --- Multimodal Farm Data Ingestion ---
 * These types model the additional (all optional) data sources described in
 * the "Multimodal AI Farm Decision Support System" problem statement:
 * visual data (crop photos), audio data (voice observations), structured
 * environmental data (weather, soil reports) and historical farm records.
 *
 * Both `cropPhotoNote` and `voiceObservation` are always plain text under
 * the hood — that's what the fusion layer and downstream
 * recommendation/insight logic actually reason over — but each can also be
 * auto-filled by an upstream AI step: computer-vision photo analysis (see
 * `cropPhotoAnalysis` / src/services/cropVision.server.ts) or live-recorded
 * speech-to-text transcription (see `voiceTranscription` /
 * src/services/voiceTranscription.server.ts). Either field still works fine
 * as a manually typed/pasted note if no AI provider is configured.
 */

export interface SoilMetrics {
  nitrogen?: number | undefined; // kg/ha
  phosphorus?: number | undefined; // kg/ha
  potassium?: number | undefined; // kg/ha
  ph?: number | undefined;
  organicCarbon?: number | undefined; // percentage
}

export interface WeatherSnapshot {
  expectedRainfallMm?: number | undefined;
  avgTemperatureC?: number | undefined;
  forecastNote?: string | undefined; // e.g. "Dry spell expected", "Above-average monsoon"
  source: "manual" | "auto";
  /** When source is "auto": which reference point the live forecast came from
   * (e.g. "Bengaluru, Karnataka") and when it was fetched. */
  locationLabel?: string | undefined;
  fetchedAt?: string | undefined; // ISO timestamp
}

export interface FarmHistoryEntry {
  id: string;
  crop: string;
  season: string; // e.g. "Kharif 2025"
  yieldPerAcre?: number | undefined;
  notes?: string | undefined;
}

/**
 * --- Photo-Based Disease/Pest Detection ---
 * Result of sending a farmer-uploaded crop photo to a vision-capable AI
 * model (see src/lib/aiProviders.server.ts, src/services/cropVision.server.ts).
 * Deliberately framed as a preliminary visual read, not a lab diagnosis —
 * the UI and AI prompts both say so explicitly.
 */

export type PhotoFindingSeverity = "Low" | "Medium" | "High";

export interface CropPhotoFinding {
  issue: string;
  severity: PhotoFindingSeverity;
  note: string;
}

export interface CropPhotoAnalysis {
  cropLooksHealthy: boolean;
  summary: string;
  findings: CropPhotoFinding[];
  recommendedActions: string[];
  provider: "groq" | "openai";
  analyzedAt: string; // ISO timestamp
}

/**
 * --- Voice Observation — Live Recording + Auto-Transcription ---
 * Metadata about the optional AI speech-to-text pass over a farmer's
 * in-browser voice recording (see src/services/voiceTranscription.server.ts).
 * The transcript text itself lands in `voiceObservation` (edited freely
 * afterward); this just records which provider produced it and when, purely
 * for the small UI badge — nothing downstream depends on it.
 */
export interface VoiceTranscription {
  provider: "groq" | "openai";
  transcribedAt: string; // ISO timestamp
}

export interface MultimodalContext {
  cropPhotoFileName?: string | undefined;
  cropPhotoNote?: string | undefined;
  /** Result of the optional AI vision analysis of the uploaded photo (see
   * src/services/cropVision.server.ts). Left undefined until the farmer
   * runs "Analyze Photo (AI)"; cropPhotoNote may still be typed/edited
   * manually with or without it. */
  cropPhotoAnalysis?: CropPhotoAnalysis | undefined;
  voiceObservation?: string | undefined;
  /** Set once the farmer records and transcribes a voice note (see
   * VoiceTranscription above). Left undefined if voiceObservation was only
   * ever typed/pasted manually. */
  voiceTranscription?: VoiceTranscription | undefined;
  weather?: WeatherSnapshot | undefined;
  soilMetrics?: SoilMetrics | undefined;
  farmHistory?: FarmHistoryEntry[] | undefined;
  /** Days elapsed since sowing/transplanting for the crop currently being
   * grown/considered. Optional — powers crop-stage-aware insights (see
   * src/services/cropStageEngine.ts) the moment a farmer provides it. */
  daysSinceSowing?: number | undefined;
}

export type DataSourceKey = "photo" | "voice" | "weather" | "soil" | "history" | "stage";

export interface DataSourceFlag {
  key: DataSourceKey;
  label: string;
  active: boolean;
  summary?: string | undefined;
}

export interface FusionAdjustment {
  cropId: string;
  delta: number;
  reason: string;
}

/**
 * --- Sustainability & Input Optimization ---
 * Models the "Sustainability & Risk Focus" requirement from the problem
 * statement: recommending green/eco-friendly inputs and quantifying
 * reduced overall input usage. Kept simple and rule-based (illustrative,
 * demo-grade figures), mirroring the rest of the scoring engine.
 */

export type GreenInputType = "biofertilizer" | "biopesticide" | "organic-amendment" | "practice";

export interface GreenInputRecommendation {
  name: string;
  type: GreenInputType;
  replaces?: string | undefined; // conventional input this can substitute or cut down on
  note: string;
}

export interface CropSustainabilityProfile {
  cropId: string;
  greenInputs: GreenInputRecommendation[];
  reductionTips: string[];
  /** Indicative % reduction in chemical fertilizer/pesticide spend achievable
   * by following these practices, before any soil-fertility adjustment. */
  baselineReductionPct: number;
}

export interface SustainabilityPlan {
  cropId: string;
  greenInputs: GreenInputRecommendation[];
  reductionTips: string[];
  estimatedInputReductionPct: number;
  estimatedCostSavings: number;
  fertilityNote?: string | undefined;
}

/**
 * --- Crop-Stage-Aware Insights ---
 * Models the "Actionable Insights tailored to crop stage" requirement:
 * a simple growth-stage timeline per crop (as a % of total growing
 * duration) with stage-specific watch-outs and actions, driven by the
 * optional `daysSinceSowing` field the farmer can provide.
 */

export interface CropStageDefinition {
  name: string;
  /** Inclusive start/end of this stage, as a % of the crop's total growing
   * duration (0-100), so it scales to each crop's own duration range. */
  startPct: number;
  endPct: number;
  focus: string;
  actions: string[];
  watchOuts: string[];
}

export interface CropStageProfile {
  cropId: string;
  stages: CropStageDefinition[];
}

export interface StageInsight {
  cropId: string;
  daysSinceSowing: number;
  totalDurationDays: number;
  progressPct: number;
  stage: CropStageDefinition;
  stageIndex: number;
  totalStages: number;
  daysIntoStage: number;
  daysUntilNextStage: number | null;
  nextStage?: CropStageDefinition | undefined;
  isPastHarvest: boolean;
}

/**
 * --- Early-Warning Risk Alerts ---
 * Combines the live/manual weather outlook (WeatherSnapshot) with the crop
 * currently being grown/considered and, where available, its crop-stage
 * status (StageInsight) to surface short, explainable warnings a farmer can
 * act on ahead of time — e.g. "dry spell forecast + a water-hungry crop
 * currently flowering", "heavy rain forecast + waterlogging-prone crop".
 * Deliberately rule-based (same style as the rest of the scoring/insight
 * engines) rather than a predictive model, so every alert can point to
 * exactly which inputs triggered it.
 */

export type RiskAlertSeverity = "critical" | "warning" | "watch" | "info";
export type RiskAlertCategory = "irrigation" | "pest-disease" | "weather" | "data-gap";

export interface RiskAlert {
  id: string;
  severity: RiskAlertSeverity;
  category: RiskAlertCategory;
  title: string;
  message: string;
  action: string;
}
