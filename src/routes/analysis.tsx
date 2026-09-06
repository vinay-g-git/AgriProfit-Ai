import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { FarmForm, DEMO_FARM } from "@/components/FarmForm";
import { RecommendationCard } from "@/components/RecommendationCard";
import { CropCard } from "@/components/CropCard";
import { ComparisonTable } from "@/components/ComparisonTable";
import { ProfitChart } from "@/components/ProfitChart";
import { Disclaimer } from "@/components/Disclaimer";
import { AiAdvisorChat } from "@/components/AiAdvisorChat";
import { DataSourcesPanel } from "@/components/DataSourcesPanel";
import { SustainabilityCard } from "@/components/SustainabilityCard";
import { CropStageCard } from "@/components/CropStageCard";
import { RiskAlertsCard } from "@/components/RiskAlertsCard";
import { analyzeFarm } from "@/services/recommendationEngine";
import { applyMultimodalContext, getActiveDataSources } from "@/services/multimodalFusion";
import { getSustainabilityPlan } from "@/services/sustainabilityEngine";
import { getStageInsight } from "@/services/cropStageEngine";
import { getRiskAlerts } from "@/services/riskAlertEngine";
import { formatINR } from "@/services/profitCalculator";
import type { FarmInput, MultimodalContext } from "@/types";

export const Route = createFileRoute("/analysis")({
  validateSearch: (search: Record<string, unknown>): { demo?: boolean } =>
    search["demo"] === true || search["demo"] === "true" ? { demo: true } : {},
  head: () => ({
    meta: [
      { title: "Farm Analysis — AgriProfit AI" },
      {
        name: "description",
        content:
          "Enter your soil, water, budget and risk preference to see crop suitability scores, estimated profit and ROI.",
      },
      { property: "og:title", content: "Farm Analysis — AgriProfit AI" },
      {
        property: "og:description",
        content: "Crop suitability scores, estimated profit and ROI for your farm conditions.",
      },
    ],
  }),
  component: Analysis,
});

function Analysis() {
  const search = Route.useSearch();
  const demo = search.demo === true;
  const [farm, setFarm] = useState<FarmInput | null>(null);
  const [context, setContext] = useState<MultimodalContext>({});
  const baseResults = useMemo(() => (farm ? analyzeFarm(farm) : []), [farm]);
  const results = useMemo(
    () => (farm ? applyMultimodalContext(baseResults, farm, context) : []),
    [farm, baseResults, context],
  );
  const dataSources = useMemo(() => getActiveDataSources(context), [context]);
  const sustainabilityPlan = useMemo(
    () => (farm && results[0] ? getSustainabilityPlan(results[0].crop, farm, context) : null),
    [farm, results, context],
  );
  const stageInsight = useMemo(
    () => (results[0] ? getStageInsight(results[0].crop, context.daysSinceSowing) : null),
    [results, context.daysSinceSowing],
  );
  const riskAlerts = useMemo(
    () => (results[0] ? getRiskAlerts(results[0].crop, context, stageInsight) : []),
    [results, context, stageInsight],
  );

  function handleAnalyze(input: FarmInput, ctx: MultimodalContext) {
    setFarm(input);
    setContext(ctx);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() =>
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  }

  const summary = farm
    ? [
        { label: "Location", value: farm.location },
        { label: "Land Area", value: `${farm.landArea} acre${farm.landArea === 1 ? "" : "s"}` },
        { label: "Soil", value: farm.soilType },
        { label: "Water", value: farm.waterAvailability },
        { label: "Budget", value: formatINR(farm.budget) },
        { label: "Risk Preference", value: farm.riskPreference },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        {demo ? (
          <FarmForm initial={DEMO_FARM} onAnalyze={handleAnalyze} />
        ) : (
          <FarmForm onAnalyze={handleAnalyze} />
        )}

        {farm && results[0] && (
          <div id="results" className="space-y-8 scroll-mt-20">
            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
              <h2 className="text-xl font-semibold">Your Farm Analysis</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {summary.map((s) => (
                  <div key={s.label}>
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="mt-0.5 font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <DataSourcesPanel sources={dataSources} />

            <RiskAlertsCard alerts={riskAlerts} cropName={results[0]!.crop.name} />

            <RecommendationCard
              analysis={results[0]!}
              farm={farm}
              results={results}
              context={context}
            />

            {sustainabilityPlan && (
              <SustainabilityCard plan={sustainabilityPlan} cropName={results[0]!.crop.name} />
            )}

            {stageInsight && (
              <CropStageCard insight={stageInsight} cropName={results[0]!.crop.name} />
            )}

            <section>
              <h2 className="text-xl font-semibold">Other Suitable Options</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {results.slice(1, 3).map((r, i) => (
                  <CropCard key={r.crop.id} analysis={r} rank={i + 2} />
                ))}
              </div>
            </section>

            <ComparisonTable results={results} />
            <ProfitChart results={results} />
            <AiAdvisorChat farm={farm} results={results} context={context} />
            <Disclaimer />
          </div>
        )}
      </main>
    </div>
  );
}
