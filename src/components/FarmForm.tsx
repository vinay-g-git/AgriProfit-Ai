import { useState } from "react";
import { FarmContextForm } from "./FarmContextForm";
import type { FarmInput, Level, LocationName, MultimodalContext, SoilType } from "@/types";

export const DEMO_FARM: FarmInput = {
  location: "Karnataka",
  landArea: 2,
  soilType: "Red Soil",
  waterAvailability: "Medium",
  budget: 60000,
  riskPreference: "Medium",
};

const locations: LocationName[] = [
  "Karnataka",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Telangana",
  "Other",
];
const soils: SoilType[] = ["Red Soil", "Black Soil", "Alluvial Soil", "Sandy Soil", "Loamy Soil"];
const levels: Level[] = ["Low", "Medium", "High"];

type Draft = {
  location: LocationName;
  landArea: string;
  soilType: SoilType | "";
  waterAvailability: Level | "";
  budget: string;
  riskPreference: Level;
};

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

export function FarmForm({
  initial,
  onAnalyze,
}: {
  initial?: FarmInput;
  onAnalyze: (farm: FarmInput, context: MultimodalContext) => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    location: initial?.location ?? "Karnataka",
    landArea: initial ? String(initial.landArea) : "",
    soilType: initial?.soilType ?? "",
    waterAvailability: initial?.waterAvailability ?? "",
    budget: initial ? String(initial.budget) : "",
    riskPreference: initial?.riskPreference ?? "Medium",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [context, setContext] = useState<MultimodalContext>({});

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const area = Number(draft.landArea);
    const budget = Number(draft.budget);
    if (!draft.landArea.trim()) next["landArea"] = "Please enter your land area.";
    else if (!(area > 0)) next["landArea"] = "Land area must be greater than 0.";
    if (!draft.budget.trim()) next["budget"] = "Please enter your budget.";
    else if (!(budget > 0)) next["budget"] = "Budget must be greater than 0.";
    if (!draft.soilType) next["soilType"] = "Please select a soil type.";
    if (!draft.waterAvailability) next["waterAvailability"] = "Please select water availability.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onAnalyze(
      {
        location: draft.location,
        landArea: area,
        soilType: draft.soilType as SoilType,
        waterAvailability: draft.waterAvailability as Level,
        budget,
        riskPreference: draft.riskPreference,
      },
      context,
    );
  }

  function fillDemo() {
    setErrors({});
    setDraft({
      location: DEMO_FARM.location,
      landArea: String(DEMO_FARM.landArea),
      soilType: DEMO_FARM.soilType,
      waterAvailability: DEMO_FARM.waterAvailability,
      budget: String(DEMO_FARM.budget),
      riskPreference: DEMO_FARM.riskPreference,
    });
  }

  const err = (k: string) =>
    errors[k] !== undefined ? (
      <p className="mt-1.5 text-xs font-medium text-destructive">{errors[k]}</p>
    ) : null;

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7"
    >
      <h2 className="text-xl font-semibold">Farm Details</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your farm conditions to compare crop options.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="location">
            Location
          </label>
          <select
            id="location"
            className={fieldClass}
            value={draft.location}
            onChange={(e) => set("location", e.target.value as LocationName)}
          >
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="landArea">
            Land Area (acres)
          </label>
          <input
            id="landArea"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            placeholder="e.g. 2"
            className={fieldClass}
            value={draft.landArea}
            onChange={(e) => set("landArea", e.target.value)}
          />
          {err("landArea")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="soil">
            Soil Type
          </label>
          <select
            id="soil"
            className={fieldClass}
            value={draft.soilType}
            onChange={(e) => set("soilType", e.target.value as SoilType)}
          >
            <option value="">Select soil type</option>
            {soils.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {err("soilType")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="water">
            Water Availability
          </label>
          <select
            id="water"
            className={fieldClass}
            value={draft.waterAvailability}
            onChange={(e) => set("waterAvailability", e.target.value as Level)}
          >
            <option value="">Select water availability</option>
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          {err("waterAvailability")}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="budget">
            Budget (₹)
          </label>
          <input
            id="budget"
            type="number"
            min="0"
            step="1000"
            inputMode="numeric"
            placeholder="e.g. 60000"
            className={fieldClass}
            value={draft.budget}
            onChange={(e) => set("budget", e.target.value)}
          />
          {err("budget")}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Risk Preference</span>
          <div className="flex gap-2">
            {levels.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => set("riskPreference", l)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  draft.riskPreference === l
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FarmContextForm location={draft.location} value={context} onChange={setContext} />

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Analyze My Farm
        </button>
        <button
          type="button"
          onClick={fillDemo}
          className="flex-1 rounded-xl border border-input bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Try Demo Farm
        </button>
      </div>
    </form>
  );
}
