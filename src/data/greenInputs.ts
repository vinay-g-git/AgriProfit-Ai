import type { CropSustainabilityProfile } from "@/types";

/**
 * Demo estimates only. Illustrative green/eco-friendly input alternatives
 * and indicative input-reduction practices per crop, for an MVP demo — not
 * agronomic prescriptions. `baselineReductionPct` is a rough, editable
 * assumption of how much a farmer following these practices could cut
 * chemical fertilizer/pesticide spend by, before any soil-fertility
 * adjustment from a farmer's own soil test (see sustainabilityEngine.ts).
 */
export const sustainabilityProfiles: CropSustainabilityProfile[] = [
  {
    cropId: "ragi",
    greenInputs: [
      {
        name: "Farmyard manure / vermicompost",
        type: "organic-amendment",
        replaces: "Part of basal urea/DAP dose",
        note: "Apply as basal dose before sowing to cut synthetic fertilizer need.",
      },
      {
        name: "Azospirillum biofertilizer",
        type: "biofertilizer",
        replaces: "Part of nitrogen fertilizer",
        note: "Seed treatment that fixes atmospheric nitrogen, reducing urea requirement.",
      },
      {
        name: "Neem-based biopesticide",
        type: "biopesticide",
        replaces: "Chemical insecticide spray",
        note: "Effective against shoot fly and stem borer at early growth stages.",
      },
    ],
    reductionTips: [
      "Split nitrogen application into 2-3 doses instead of one large dose to reduce runoff loss.",
      "Ragi is drought-tolerant — avoid excess irrigation, which wastes water without raising yield.",
    ],
    baselineReductionPct: 20,
  },
  {
    cropId: "groundnut",
    greenInputs: [
      {
        name: "Rhizobium biofertilizer",
        type: "biofertilizer",
        replaces: "Part of nitrogen fertilizer",
        note: "Groundnut is a legume — Rhizobium inoculation fixes its own nitrogen, cutting urea need substantially.",
      },
      {
        name: "Gypsum (calcium sulfate)",
        type: "organic-amendment",
        note: "Improves pod filling; a cheaper, low-impact input compared to blanket chemical fertilizer top-ups.",
      },
      {
        name: "Trichoderma seed treatment",
        type: "biopesticide",
        replaces: "Chemical fungicide seed dressing",
        note: "Protects against soil-borne collar rot and wilt.",
      },
    ],
    reductionTips: [
      "Legume rotation naturally replenishes soil nitrogen — factor this into the next season's fertilizer plan.",
      "Avoid excess nitrogen fertilizer, which encourages vegetative growth over pod formation.",
    ],
    baselineReductionPct: 25,
  },
  {
    cropId: "tomato",
    greenInputs: [
      {
        name: "Vermicompost / well-rotted FYM",
        type: "organic-amendment",
        replaces: "Part of basal NPK dose",
        note: "Improves soil structure and nutrient retention, reducing fertilizer runoff.",
      },
      {
        name: "Pheromone traps",
        type: "practice",
        replaces: "Repeated chemical insecticide sprays",
        note: "Monitors and reduces fruit borer population with far fewer chemical sprays.",
      },
      {
        name: "Neem oil / Bacillus thuringiensis (Bt) spray",
        type: "biopesticide",
        replaces: "Broad-spectrum chemical insecticide",
        note: "Targets caterpillar pests while preserving beneficial insects.",
      },
    ],
    reductionTips: [
      "Drip irrigation with mulching cuts water use significantly versus flood irrigation for tomato.",
      "Scout twice a week and spray only when pest thresholds are crossed, instead of on a fixed calendar.",
    ],
    baselineReductionPct: 18,
  },
  {
    cropId: "onion",
    greenInputs: [
      {
        name: "Trichoderma + Pseudomonas fluorescens soil treatment",
        type: "biopesticide",
        replaces: "Chemical fungicide drench",
        note: "Suppresses basal rot and purple blotch without heavy fungicide use.",
      },
      {
        name: "Vermicompost",
        type: "organic-amendment",
        replaces: "Part of basal fertilizer dose",
        note: "Boosts bulb development while cutting synthetic fertilizer dependence.",
      },
    ],
    reductionTips: [
      "Avoid over-irrigation close to harvest — it increases storage rot and wastes water.",
      "Apply potassium in split doses to improve bulb size without excess fertilizer use.",
    ],
    baselineReductionPct: 15,
  },
  {
    cropId: "maize",
    greenInputs: [
      {
        name: "Azotobacter biofertilizer",
        type: "biofertilizer",
        replaces: "Part of nitrogen fertilizer",
        note: "Fixes atmospheric nitrogen in the root zone, reducing urea dependency.",
      },
      {
        name: "Trichogramma cards",
        type: "biopesticide",
        replaces: "Chemical spray for stem borer",
        note: "Releases parasitic wasps that control fall armyworm/stem borer biologically.",
      },
    ],
    reductionTips: [
      "Apply nitrogen in 2-3 split doses timed to crop growth stage instead of one bulk dose.",
      "Intercropping with legumes can reduce the following season's fertilizer requirement.",
    ],
    baselineReductionPct: 20,
  },
  {
    cropId: "rice",
    greenInputs: [
      {
        name: "Blue-green algae / Azolla biofertilizer",
        type: "biofertilizer",
        replaces: "Part of nitrogen fertilizer",
        note: "Fixes nitrogen in standing water, reducing urea top-dressing needs.",
      },
      {
        name: "Neem cake soil application",
        type: "organic-amendment",
        replaces: "Part of chemical fertilizer + some pesticide",
        note: "Slow-releases nutrients and has mild pest-repellent properties.",
      },
    ],
    reductionTips: [
      "Alternate wetting and drying (AWD) irrigation can cut water use by roughly 20-25% versus continuous flooding.",
      "Use a leaf colour chart to time nitrogen top-dressing instead of applying on a fixed schedule.",
    ],
    baselineReductionPct: 18,
  },
  {
    cropId: "chilli",
    greenInputs: [
      {
        name: "Neem oil / neem seed kernel extract spray",
        type: "biopesticide",
        replaces: "Chemical insecticide for thrips and mites",
        note: "Manages sucking pests, which are chilli's main chemical-input driver.",
      },
      {
        name: "Vermicompost + Trichoderma-enriched FYM",
        type: "organic-amendment",
        replaces: "Part of basal fertilizer + fungicide",
        note: "Improves root health and suppresses wilt, cutting both fertilizer and fungicide need.",
      },
    ],
    reductionTips: [
      "Yellow sticky traps reduce the need for frequent insecticide rounds against thrips/whitefly.",
      "Apply fertilizer based on a soil test rather than a flat dose — chilli is often over-fertilized.",
    ],
    baselineReductionPct: 22,
  },
  {
    cropId: "cotton",
    greenInputs: [
      {
        name: "Bt-compatible IPM: pheromone traps + Trichogramma",
        type: "practice",
        replaces: "Multiple rounds of chemical insecticide",
        note: "Reduces bollworm-driven pesticide load through monitoring and biological control.",
      },
      {
        name: "Azotobacter + Phosphate Solubilising Bacteria (PSB)",
        type: "biofertilizer",
        replaces: "Part of NPK dose",
        note: "Improves nitrogen and phosphorus availability, cutting fertilizer need.",
      },
    ],
    reductionTips: [
      "Scout weekly and spray only past economic threshold levels — cotton is prone to pesticide overuse.",
      "Drip irrigation with fertigation reduces both water and fertilizer waste compared to flood irrigation.",
    ],
    baselineReductionPct: 20,
  },
];

/** Generic fallback profile used if a crop isn't in the list above. */
export const genericSustainabilityProfile: CropSustainabilityProfile = {
  cropId: "generic",
  greenInputs: [
    {
      name: "Farmyard manure / vermicompost",
      type: "organic-amendment",
      replaces: "Part of basal chemical fertilizer dose",
      note: "Improves soil organic matter and cuts synthetic fertilizer dependence over time.",
    },
    {
      name: "Neem-based biopesticide",
      type: "biopesticide",
      replaces: "Broad-spectrum chemical insecticide",
      note: "A lower-impact first line of pest control for common sucking and chewing pests.",
    },
  ],
  reductionTips: [
    "Get a soil test before deciding fertilizer quantity — many farms over-apply by default.",
    "Spray pesticides only when pest levels cross an economic threshold, not on a fixed calendar.",
  ],
  baselineReductionPct: 15,
};
