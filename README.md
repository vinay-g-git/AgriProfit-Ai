# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## AI Farm Advisor (Groq — free, OpenAI — optional paid fallback)

The analysis page can generate real AI insights (instead of only the
rule-based text) and includes an interactive chat where farmers can ask
follow-up questions about their results.

1. Get a **free** Groq API key at [console.groq.com/keys](https://console.groq.com/keys)
   (no credit card required).
2. Copy `.env.example` to `.env` and paste your key:
   ```sh
   cp .env.example .env
   ```
   ```
   GROQ_API_KEY=your_key_here
   ```
3. Restart `npm run dev`.

That's it — the "AgriProfit Insight" card will start showing AI-generated
text (labelled "AI · Groq"), and the "Ask the AI Farm Advisor" chat below
the results becomes interactive.

**Without a key set, nothing breaks** — the app automatically falls back to
the original rule-based explanation, and the chat widget shows a message
explaining how to enable it.

OpenAI support (`OPENAI_API_KEY`) is also wired in as an optional secondary
provider, used only if Groq isn't configured or a Groq request fails. Note
that unlike Groq, the OpenAI API is billed/paid — it's included for people
who already use it, not as the recommended default.

All AI calls happen in server functions (`src/services/aiAdvisor.server.ts`)
so your API keys are never sent to or exposed in the browser.

> **Note:** Groq deprecated `llama-3.3-70b-versatile` (the previous default
> text model here) on August 16, 2026, and separately decommissioned
> `meta-llama/llama-4-maverick-17b-128e-instruct` (the previous default
> vision model) on March 9, 2026. Defaults are now `openai/gpt-oss-120b`
> for text and `qwen/qwen3.6-27b` for vision — still overridable via
> `GROQ_MODEL` / `GROQ_VISION_MODEL` in `.env`.

## Multimodal Farm Context (fusion layer)

On the Analysis page, the "Additional Farm Data (optional)" section lets a
farmer supply extra context beyond the core form:

- **Crop photo** — upload a photo and get a preliminary AI disease/pest
  read (see below), or just describe what it shows yourself.
- **Voice observation** — record a voice note in-browser for automatic AI
  transcription (see below), or just paste/type a transcript yourself.
- **Weather outlook** — expected rainfall, average temperature, forecast note.
  Auto-fetch a live 7-day outlook for your location (see below), or enter
  it manually.
- **Soil test report** — N/P/K, pH, organic carbon.
- **Farm history** — past seasons' crops and yields, used for crop-rotation
  checks.
- **Days since sowing** — powers the crop-stage-aware insights below.

All of this is optional and additive: `src/services/multimodalFusion.ts`
turns whatever is provided into small, explainable score adjustments (e.g.
"dry forecast + high-water crop → risk penalty", "same crop as last season →
rotation caution", "soil test shows low fertility → cost caution") on top of
the existing rule-based recommendation engine, and folds a summary into the
AI advisor's prompt so its explanations reason over the same data. A "Data
Sources Used" panel on the results page shows exactly which inputs were
factored in.

## Live Weather Integration

Next to the "Weather Outlook" fields, an **"Auto-fetch live weather"**
button (`src/services/weatherService.server.ts`) pulls a live 7-day
rainfall and temperature outlook from [Open-Meteo](https://open-meteo.com)
— a free, open weather API that needs **no API key or signup** — for a
representative point in the farmer's selected state
(`src/data/locationCoordinates.ts`).

The fetched values (expected rainfall, average temperature, and a
plain-language forecast note like "Dry spell expected") populate the same
`WeatherSnapshot` fields the manual inputs use, so every consumer that
already reasons over weather — the multimodal fusion scoring, the
sustainability engine, and the AI advisor prompt — automatically benefits
without any extra wiring. Farmers can still edit any field afterward to
override the live reading with their own knowledge; auto-fetch isn't
available yet for the "Other" location option.

## AI Photo Diagnosis

In the "Additional Farm Data" section, choosing a crop photo reveals an
**"Analyze Photo (AI)"** button. It sends the image to a vision-capable
model (Groq's `qwen/qwen3.6-27b`, free tier, or OpenAI's `gpt-4o-mini` as a
paid fallback — see `src/services/cropVision.server.ts`) and returns:

- A **plain-language summary** of what the photo shows.
- Up to four specific **findings** (e.g. "leaf yellowing", "possible aphid
  cluster"), each with a Low/Medium/High severity and a one-line note.
- A short list of **recommended actions**.

The result is deliberately framed as a *preliminary visual read, not a lab
diagnosis* — both in the UI and in the AI advisor's prompt — and the farmer
can still edit the auto-filled photo note afterward. High/Medium-severity
findings also feed directly into the Early-Warning Risk Alerts card below
(as observed, not just forecast, risk), and everything is folded into the
"Data Sources Used" panel and the AI advisor's context like the other
multimodal inputs.

**Without a Groq or OpenAI key configured, nothing breaks** — the button
shows a clear message pointing at the same `.env` setup as the AI advisor
above, and the plain description box still works for the AI advisor's text
context.

## AI Voice Transcription

In the "Additional Farm Data" section, the "Voice Observation" field has a
**"Record Voice Note (AI)"** button. It captures audio in-browser (via
`MediaRecorder`, capped at 2 minutes), sends it to a speech-to-text model
(Groq's `whisper-large-v3-turbo`, free tier, or OpenAI's `whisper-1` as a
paid fallback — see `src/services/voiceTranscription.server.ts`) and drops
the returned transcript straight into the text box, appending to anything
already typed there. The farmer can freely edit the transcript afterward,
and the field is used exactly the same way downstream (multimodal fusion,
AI advisor context) whether it was recorded or typed.

**Without a Groq or OpenAI key configured, nothing breaks** — the button
shows a clear message pointing at the same `.env` setup as the AI advisor
above, and the plain text box still works for typed/pasted notes.

## Early-Warning Risk Alerts

An "Early-Warning Risk Alerts" card (`src/services/riskAlertEngine.ts`)
appears near the top of the results page and fuses several things that were
previously only shown separately:

- The **weather outlook** (live-fetched or manual).
- The recommended crop's **water requirement**.
- Where available, exactly which **growth stage** the crop is in
  (`src/services/cropStageEngine.ts`).
- Any **High/Medium-severity findings from an AI photo analysis** (see
  above) — real, observed evidence rather than a forecast-based projection.

When these line up into real risk — a dry spell forecast for a high-water
crop, heavy rain forecast for a low-water crop, a moisture-sensitive stage
(germination, flowering, grain fill) coinciding with either, or forecast
temperatures pushing into heat- or cold-stress territory — a clearly
labelled alert (Critical / Warning / Watch) explains exactly which inputs
triggered it and what to do about it, so a farmer can act *before* the
damage is visible rather than after. If no weather data has been supplied
yet, a low-priority note nudges the farmer to add it. Like the other
sections above, active alerts are also folded into the AI advisor's prompt
so its narrative and chat answers lead with the same time-sensitive
warnings instead of burying them.

This is deliberately rule-based and explainable rather than a predictive
model — the same style as the rest of the scoring/insight engines — and
directly reuses the same `WeatherSnapshot` and `StageInsight` data already
produced by the live weather and crop-stage features, so it required no new
data collection from the farmer.

## Sustainability & Input Optimization

Below the recommendation, a "Sustainability & Input Optimization" card
(`src/services/sustainabilityEngine.ts`, `src/data/greenInputs.ts`) shows,
per recommended crop:

- **Green/eco-friendly input recommendations** — biofertilizers,
  biopesticides, and organic amendments that substitute or cut down on
  conventional chemical inputs.
- **Input-reduction practices** — concrete, crop-specific ways to lower
  fertilizer, pesticide, or water use.
- An **estimated % reduction in chemical input use** and **indicative cost
  savings**, adjusted upward or downward if a soil test (from the
  multimodal context above) shows unusually high or low fertility.

This is deliberately rule-based and demo-grade (labelled as an indicative
estimate in the UI), and its output is also folded into the AI advisor's
prompt so its explanations reason over the same green-input plan.

## Crop-Stage-Aware Insights

If a farmer enters "Days Since Sowing / Transplanting" in the Additional
Farm Data section, a "Crop Stage Insights" card
(`src/services/cropStageEngine.ts`, `src/data/cropStages.ts`) appears on the
results page showing:

- A **progress timeline** — which of the crop's growth stages (e.g.
  germination, vegetative growth, flowering, grain fill, harvest) it's
  currently in, scaled to that crop's typical growing duration.
- **Stage-specific actions** — what to do right now (e.g. top-dress
  fertilizer, scout for a particular pest, adjust irrigation).
- **Stage-specific watch-outs** — the risks most relevant at that exact
  point in the season, rather than generic season-long advice.

This directly targets the "Actionable Insights tailored to crop stage"
requirement. It's fully optional — leave the field blank and everything
else works as before — and, like the sections above, its output is folded
into the AI advisor's prompt so its explanations and chat answers are also
tailored to the crop's current stage.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Groq / OpenAI (optional AI advisor)
