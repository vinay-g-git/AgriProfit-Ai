import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sprout,
  IndianRupee,
  Droplets,
  Leaf,
  CalendarClock,
  CloudSun,
  ShieldAlert,
  Camera,
  Mic,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriProfit AI — Know Your Profit Before You Plant" },
      {
        name: "description",
        content:
          "Compare crop suitability, estimated cost, profit, water needs and risk for your farm before you plant. A simple decision-support demo.",
      },
      { property: "og:title", content: "AgriProfit AI — Know Your Profit Before You Plant" },
      {
        property: "og:description",
        content:
          "Compare crop suitability, estimated cost, profit, water needs and risk for your farm before you plant.",
      },
    ],
  }),
  component: Home,
});

const features = [
  {
    icon: Sprout,
    title: "Crop Recommendation",
    text: "Find crops that match your farm conditions.",
  },
  {
    icon: IndianRupee,
    title: "Profit Estimation",
    text: "Understand estimated investment, revenue and profit.",
  },
  {
    icon: Droplets,
    title: "Risk & Water Analysis",
    text: "Compare crops based on water requirements and risk.",
  },
  {
    icon: Leaf,
    title: "Sustainable Inputs",
    text: "Green input swaps and a reduced chemical-usage estimate for your crop.",
  },
  {
    icon: CalendarClock,
    title: "Crop Stage Insights",
    text: "Actions and watch-outs tailored to exactly where your crop is in its growth cycle.",
  },
  {
    icon: CloudSun,
    title: "Live Weather Outlook",
    text: "Auto-fetch a 7-day rainfall & temperature forecast for your location — no API key needed.",
  },
  {
    icon: ShieldAlert,
    title: "Early-Warning Risk Alerts",
    text: "Ahead-of-time warnings when weather, water needs and crop stage line up into real risk.",
  },
  {
    icon: Camera,
    title: "AI Photo Diagnosis",
    text: "Upload a crop photo for a preliminary AI read on visible disease or pest issues.",
  },
  {
    icon: Mic,
    title: "AI Voice Transcription",
    text: "Record a voice observation and get an automatic AI transcript — no typing needed.",
  },
];

const steps = ["Farm Details", "Crop Analysis", "Profit Estimation", "Better Decision"];

const roadmap = [
  {
    phase: "Phase 2",
    items: ["Live mandi prices", "Regional languages"],
  },
  {
    phase: "Phase 3",
    items: ["IoT sensors", "Satellite data"],
  },
  { phase: "Phase 4", items: ["ML personalisation", "WhatsApp", "Marketplace"] },
];

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Decision support for small &amp; marginal farmers
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] sm:text-6xl">
              Know Your Profit Before You Plant.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              AgriProfit AI helps farmers compare crop suitability, estimated costs, potential
              profit, water needs and risk before making a planting decision.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/analysis"
                search={{ demo: true }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Try Demo Farm <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/analysis"
                className="inline-flex items-center justify-center rounded-xl border border-input bg-card px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Analyze My Farm
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl font-semibold">How it works</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s} className="rounded-2xl border border-border bg-card p-5">
                  <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
                  <p className="mt-1 font-semibold">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Future roadmap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Not part of this MVP — possible directions after the demo.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {roadmap.map((r) => (
              <div key={r.phase} className="rounded-2xl border border-dashed border-border p-5">
                <h3 className="text-sm font-semibold text-primary">{r.phase}</h3>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {r.items.map((i) => (
                    <li key={i}>• {i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        AgriProfit AI · Demo data is used for this MVP.
      </footer>
    </div>
  );
}
