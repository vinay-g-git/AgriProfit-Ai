import type { CropStageProfile } from "@/types";

/**
 * Per-crop growth-stage timelines used by src/services/cropStageEngine.ts to
 * power "Actionable Insights tailored to crop stage" (problem statement).
 *
 * Stage boundaries are expressed as a % of the crop's total growing
 * duration (see Crop.growingDuration in src/data/crops.ts) rather than fixed
 * day counts, so the same profile scales sensibly whether a farmer's actual
 * season runs toward the short or long end of that duration range.
 *
 * Demo-grade, illustrative agronomy — good enough to guide a farmer's
 * attention to the right actions at the right time, not a substitute for
 * local agricultural extension advice.
 */
export const cropStageProfiles: CropStageProfile[] = [
  {
    cropId: "ragi",
    stages: [
      {
        name: "Germination & Establishment",
        startPct: 0,
        endPct: 12,
        focus: "Seedlings emerging and establishing root systems.",
        actions: [
          "Ensure good seed-soil contact and light irrigation if no rain",
          "Thin overcrowded patches once seedlings are a few cm tall",
        ],
        watchOuts: ["Bird damage on emerging seedlings", "Waterlogging in low patches"],
      },
      {
        name: "Vegetative / Tillering",
        startPct: 12,
        endPct: 45,
        focus: "Tiller and leaf development builds the plant's yield potential.",
        actions: [
          "Apply first top-dressing of nitrogen if soil test shows low N",
          "Hand-weed or hoe between rows to reduce competition",
        ],
        watchOuts: ["Blast disease in humid conditions", "Stem borer on young tillers"],
      },
      {
        name: "Flowering / Ear Emergence",
        startPct: 45,
        endPct: 70,
        focus: "Ear heads emerge — this is the most water-sensitive window.",
        actions: [
          "Avoid moisture stress; irrigate if a dry spell coincides with this stage",
          "Scout for finger millet blast on ear heads",
        ],
        watchOuts: ["Neck blast can cause major yield loss if untreated"],
      },
      {
        name: "Grain Fill & Maturity",
        startPct: 70,
        endPct: 92,
        focus: "Grains fill and ripen; crop water need tapers off.",
        actions: [
          "Reduce irrigation as ears begin to droop and change colour",
          "Guard against bird damage on ripening ears",
        ],
        watchOuts: ["Lodging in heavy wind/rain if plants are top-heavy"],
      },
      {
        name: "Harvest Window",
        startPct: 92,
        endPct: 100,
        focus: "Crop is ready — timing the harvest protects grain quality.",
        actions: [
          "Harvest once ears turn brown and grain is hard, before shattering starts",
          "Dry threshed grain well before storage to avoid mould",
        ],
        watchOuts: ["Delayed harvest risks grain shattering and storage pests"],
      },
    ],
  },
  {
    cropId: "groundnut",
    stages: [
      {
        name: "Germination & Establishment",
        startPct: 0,
        endPct: 12,
        focus: "Seedlings emerge and establish; early vigour sets the stand.",
        actions: [
          "Confirm even germination and gap-fill within the first 10-12 days",
          "Keep soil moist but not waterlogged",
        ],
        watchOuts: ["Soil-borne collar rot in waterlogged soil"],
      },
      {
        name: "Vegetative Growth",
        startPct: 12,
        endPct: 40,
        focus: "Branching and leaf canopy expand ahead of flowering.",
        actions: [
          "First weeding/earthing-up to support pegging later",
          "Apply gypsum around early flowering for better pod development",
        ],
        watchOuts: ["Leaf miner and thrips damage on young leaves"],
      },
      {
        name: "Flowering & Pegging",
        startPct: 40,
        endPct: 65,
        focus: "Flowers form pegs that must reach the soil to develop pods.",
        actions: [
          "Keep soil loose near the base so pegs can penetrate easily",
          "Maintain consistent soil moisture — this stage is drought-sensitive",
        ],
        watchOuts: ["Poor pegging in compacted or crusted soil reduces pod count"],
      },
      {
        name: "Pod Development & Maturity",
        startPct: 65,
        endPct: 90,
        focus: "Pods fill below ground; irrigation needs decline near the end.",
        actions: [
          "Watch for leaf spot disease and treat early if spotted",
          "Reduce irrigation 2-3 weeks before expected harvest",
        ],
        watchOuts: ["Late leaf spot/rust can defoliate plants before pod fill finishes"],
      },
      {
        name: "Harvest Window",
        startPct: 90,
        endPct: 100,
        focus: "Pods are mature — digging on time avoids losses in the soil.",
        actions: [
          "Sample-dig a few plants to confirm pod maturity before full harvest",
          "Dry pods well to avoid aflatoxin risk in storage",
        ],
        watchOuts: ["Delayed harvest raises aflatoxin risk in humid conditions"],
      },
    ],
  },
  {
    cropId: "tomato",
    stages: [
      {
        name: "Nursery / Transplant Establishment",
        startPct: 0,
        endPct: 10,
        focus: "Transplants settle in and root out.",
        actions: [
          "Water lightly and frequently right after transplanting",
          "Provide shade for the first few days in strong sun",
        ],
        watchOuts: ["Transplant shock and damping-off in waterlogged beds"],
      },
      {
        name: "Vegetative Growth",
        startPct: 10,
        endPct: 35,
        focus: "Rapid leaf and stem growth before flowering begins.",
        actions: [
          "Stake or trellis plants before they sprawl",
          "First split dose of nitrogen fertilizer",
        ],
        watchOuts: ["Whitefly buildup — a vector for leaf curl virus"],
      },
      {
        name: "Flowering & Fruit Set",
        startPct: 35,
        endPct: 60,
        focus: "Flowers set fruit — the most sensitive window for yield.",
        actions: [
          "Ensure steady, even irrigation to avoid flower/fruit drop",
          "Scout for fruit borer and pinch off affected shoots",
        ],
        watchOuts: ["Heat stress or moisture swings cause flower drop"],
      },
      {
        name: "Fruit Development & Ripening",
        startPct: 60,
        endPct: 90,
        focus: "Fruit bulks up and ripens across successive harvests.",
        actions: [
          "Begin staggered picking as fruits ripen — don't wait for all at once",
          "Watch for late blight in humid, cool weather",
        ],
        watchOuts: ["Late blight can spread fast in cool, wet conditions"],
      },
      {
        name: "Peak Harvest Window",
        startPct: 90,
        endPct: 100,
        focus: "Multiple harvest rounds — timely picking protects market price.",
        actions: [
          "Harvest every 2-3 days to keep fruit quality and price up",
          "Grade fruit by ripeness for different market channels",
        ],
        watchOuts: ["Overripe fruit left on the vine invites fruit fly and rot"],
      },
    ],
  },
  {
    cropId: "onion",
    stages: [
      {
        name: "Establishment",
        startPct: 0,
        endPct: 15,
        focus: "Seedlings/sets establish roots and initial leaves.",
        actions: ["Keep soil consistently moist but well-drained", "Gap-fill weak patches early"],
        watchOuts: ["Damping-off in waterlogged nursery beds"],
      },
      {
        name: "Vegetative / Leaf Growth",
        startPct: 15,
        endPct: 50,
        focus: "Leaf number and size build the plant's bulb-forming capacity.",
        actions: [
          "Weed regularly — onion competes poorly with weeds",
          "Split nitrogen doses to sustain steady leaf growth",
        ],
        watchOuts: ["Thrips damage curling and silvering leaves"],
      },
      {
        name: "Bulb Initiation & Bulking",
        startPct: 50,
        endPct: 80,
        focus: "Bulbs begin forming and swelling — day-length sensitive stage.",
        actions: [
          "Switch to potash-rich nutrition to support bulb development",
          "Maintain even moisture; avoid drought stress during bulking",
        ],
        watchOuts: ["Purple blotch disease in humid weather"],
      },
      {
        name: "Maturity & Neck Fall",
        startPct: 80,
        endPct: 92,
        focus: "Tops start yellowing and falling over as bulbs mature.",
        actions: [
          "Stop irrigation once ~50% of necks have fallen over",
          "Avoid mechanical damage to bulbs while they finish curing in the field",
        ],
        watchOuts: ["Continued irrigation at this stage risks bulb rot in storage"],
      },
      {
        name: "Harvest & Curing",
        startPct: 92,
        endPct: 100,
        focus: "Bulbs are lifted and cured for storage or sale.",
        actions: [
          "Harvest on a dry day and cure bulbs in shade for 1-2 weeks",
          "Remove any damaged or diseased bulbs before storage",
        ],
        watchOuts: ["Poor curing leads to storage rot and price loss"],
      },
    ],
  },
  {
    cropId: "maize",
    stages: [
      {
        name: "Germination & Emergence",
        startPct: 0,
        endPct: 10,
        focus: "Seedlings emerge and establish a uniform stand.",
        actions: ["Gap-fill within 10 days", "Control early weeds before canopy closes"],
        watchOuts: ["Fall armyworm damage on emerging whorls"],
      },
      {
        name: "Vegetative Growth",
        startPct: 10,
        endPct: 45,
        focus: "Rapid stalk and leaf growth builds plant biomass.",
        actions: [
          "First top-dress nitrogen around knee-high stage",
          "Scout whorls regularly for fall armyworm",
        ],
        watchOuts: ["Fall armyworm can cause severe whorl damage if unchecked"],
      },
      {
        name: "Tasseling & Silking",
        startPct: 45,
        endPct: 65,
        focus: "Pollination window — the single most critical stage for grain set.",
        actions: [
          "Ensure the crop is not moisture-stressed during silking",
          "Avoid spraying that disrupts pollinators during peak silking",
        ],
        watchOuts: ["Drought stress here causes poor kernel set/barren cobs"],
      },
      {
        name: "Grain Fill",
        startPct: 65,
        endPct: 90,
        focus: "Kernels fill and dry down toward physiological maturity.",
        actions: [
          "Maintain moisture through the milk and dough stages",
          "Watch for stem/cob rot in waterlogged fields",
        ],
        watchOuts: ["Waterlogging late in the season promotes stalk rot"],
      },
      {
        name: "Harvest Window",
        startPct: 90,
        endPct: 100,
        focus: "Cobs reach physiological maturity (black layer) and dry down.",
        actions: [
          "Harvest once husks dry and kernels are hard",
          "Dry grain to safe moisture before storage",
        ],
        watchOuts: ["Field-drying too long invites weevils and lodging losses"],
      },
    ],
  },
  {
    cropId: "rice",
    stages: [
      {
        name: "Nursery / Transplanting",
        startPct: 0,
        endPct: 15,
        focus: "Seedlings raised and transplanted, then establish in the main field.",
        actions: [
          "Maintain shallow standing water after transplanting to reduce stress",
          "Gap-fill missing hills within a week",
        ],
        watchOuts: ["Transplant shock in seedlings older than ~25-30 days"],
      },
      {
        name: "Vegetative / Tillering",
        startPct: 15,
        endPct: 45,
        focus: "Tiller number determines the crop's yield potential.",
        actions: [
          "Maintain 2-5cm standing water to support tillering",
          "First top-dress nitrogen at active tillering",
        ],
        watchOuts: ["Stem borer and leaf folder on young tillers"],
      },
      {
        name: "Panicle Initiation & Flowering",
        startPct: 45,
        endPct: 70,
        focus: "Panicles form and flower — the most water-sensitive window.",
        actions: [
          "Never let the field dry out from panicle initiation through flowering",
          "Scout for neck blast and brown planthopper",
        ],
        watchOuts: ["Water stress at flowering causes severe spikelet sterility"],
      },
      {
        name: "Grain Fill & Maturity",
        startPct: 70,
        endPct: 92,
        focus: "Grains fill and ripen; field water is gradually drained.",
        actions: [
          "Drain the field 7-10 days before expected harvest",
          "Guard against bird damage as panicles ripen",
        ],
        watchOuts: ["Lodging risk rises if nitrogen was excessive earlier"],
      },
      {
        name: "Harvest Window",
        startPct: 92,
        endPct: 100,
        focus: "Grain moisture drops to the ideal harvest range.",
        actions: [
          "Harvest when ~80-85% of grains have turned golden",
          "Dry paddy promptly to avoid discoloration and pest damage",
        ],
        watchOuts: ["Delayed harvest after full maturity increases grain shattering"],
      },
    ],
  },
  {
    cropId: "chilli",
    stages: [
      {
        name: "Nursery / Transplant Establishment",
        startPct: 0,
        endPct: 12,
        focus: "Transplants root out and establish in the main field.",
        actions: [
          "Water lightly right after transplanting; avoid waterlogging",
          "Provide temporary shade in intense heat",
        ],
        watchOuts: ["Damping-off and wilt in poorly drained beds"],
      },
      {
        name: "Vegetative Growth",
        startPct: 12,
        endPct: 35,
        focus: "Branching builds the framework that will carry the fruit load.",
        actions: [
          "Stake tall varieties before branches get heavy",
          "Scout regularly for thrips and mites on new growth",
        ],
        watchOuts: ["Thrips-transmitted leaf curl virus"],
      },
      {
        name: "Flowering & Fruit Set",
        startPct: 35,
        endPct: 60,
        focus: "Flowering and fruit set determine total pod count.",
        actions: [
          "Keep irrigation even — moisture swings cause flower drop",
          "Continue thrips/mite monitoring, a key yield-limiting pest here",
        ],
        watchOuts: ["Flower drop under heat stress or irregular watering"],
      },
      {
        name: "Fruit Development & Ripening",
        startPct: 60,
        endPct: 88,
        focus: "Pods bulk up and change colour across multiple flushes.",
        actions: [
          "Begin staggered picking of green pods for fresh market if applicable",
          "Watch for fruit rot/anthracnose in humid weather",
        ],
        watchOuts: ["Anthracnose fruit rot spreads fast in wet, humid spells"],
      },
      {
        name: "Peak Harvest Window",
        startPct: 88,
        endPct: 100,
        focus: "Multiple harvest rounds for red/dry chilli or continued fresh picking.",
        actions: [
          "Harvest ripe pods every 7-10 days across the flush",
          "Dry harvested chilli fully before storage to prevent mould",
        ],
        watchOuts: ["Poor drying invites mould and quality downgrade"],
      },
    ],
  },
  {
    cropId: "cotton",
    stages: [
      {
        name: "Germination & Establishment",
        startPct: 0,
        endPct: 10,
        focus: "Seedlings emerge and establish a uniform stand.",
        actions: ["Gap-fill within 10-12 days", "Early thinning to correct plant spacing"],
        watchOuts: ["Seedling blight in cool, wet soil"],
      },
      {
        name: "Vegetative Growth",
        startPct: 10,
        endPct: 35,
        focus: "Square (bud) formation begins as the plant builds its canopy.",
        actions: [
          "Monitor for sucking pests (aphids, jassids) on new leaves",
          "First nitrogen top-dress ahead of squaring",
        ],
        watchOuts: ["Sucking pest buildup can stunt early square formation"],
      },
      {
        name: "Squaring & Flowering",
        startPct: 35,
        endPct: 60,
        focus: "Squares open into flowers — the start of the boll-forming window.",
        actions: [
          "Scout intensively for pink bollworm from first flowering onward",
          "Maintain consistent moisture through peak flowering",
        ],
        watchOuts: ["Pink bollworm entering young bolls causes major loss if missed early"],
      },
      {
        name: "Boll Development & Maturity",
        startPct: 60,
        endPct: 90,
        focus: "Bolls fill out and mature toward opening.",
        actions: [
          "Continue bollworm scouting through boll development",
          "Taper irrigation as bolls approach full maturity",
        ],
        watchOuts: ["Boll rot in waterlogged or overly dense canopies"],
      },
      {
        name: "Picking Window",
        startPct: 90,
        endPct: 100,
        focus: "Bolls open in flushes — timely, clean picking protects fibre quality.",
        actions: [
          "Pick as bolls open; avoid leaving open bolls exposed to rain",
          "Store picked cotton dry and separate from trash/leaf matter",
        ],
        watchOuts: ["Rain on open bolls stains lint and lowers grade/price"],
      },
    ],
  },
];

/** Generic 5-stage fallback for any crop not explicitly covered above. */
export const genericCropStageProfile: CropStageProfile = {
  cropId: "__generic__",
  stages: [
    {
      name: "Germination & Establishment",
      startPct: 0,
      endPct: 12,
      focus: "Seedlings emerge and establish.",
      actions: ["Ensure even moisture for germination", "Gap-fill weak patches early"],
      watchOuts: ["Waterlogging or crusting can block emergence"],
    },
    {
      name: "Vegetative Growth",
      startPct: 12,
      endPct: 45,
      focus: "Leaf and root growth build the plant's overall vigour.",
      actions: [
        "First top-dress of fertilizer if soil test shows a shortfall",
        "Keep the field weed-free while the canopy is still open",
      ],
      watchOuts: ["Early-season pest/weed pressure has outsized impact on final yield"],
    },
    {
      name: "Flowering / Reproductive Stage",
      startPct: 45,
      endPct: 70,
      focus: "Flowering and fruit/grain set — the most yield-sensitive window.",
      actions: [
        "Avoid moisture stress through this window if at all possible",
        "Scout closely for pests/disease specific to this crop",
      ],
      watchOuts: ["Stress during flowering usually causes the largest yield hit"],
    },
    {
      name: "Maturity / Fill Stage",
      startPct: 70,
      endPct: 90,
      focus: "Fruit, grain or bulb fills out and moves toward maturity.",
      actions: [
        "Begin tapering irrigation as the crop approaches maturity",
        "Continue monitoring for late-season pests and disease",
      ],
      watchOuts: ["Lodging or late disease pressure can still cut yield at this stage"],
    },
    {
      name: "Harvest Window",
      startPct: 90,
      endPct: 100,
      focus: "Crop reaches maturity and is ready for harvest.",
      actions: [
        "Confirm maturity signs before full harvest",
        "Harvest and dry/cure promptly to protect quality",
      ],
      watchOuts: ["Delayed harvest risks quality loss and weather damage"],
    },
  ],
};
