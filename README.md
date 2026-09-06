# AgriProfit AI

AI-powered crop recommendation and farm profitability advisor for Indian farmers — with photo disease diagnosis, voice observations, live weather, and an AI chat advisor.

Built with  TanStack Start, React, TypeScript, and Tailwind CSS. AI features run on Groq's free tier by default, with OpenAI wired in as an optional paid fallback.

## Contents

- [Quickstart](#quickstart)
- [Environment variables](#environment-variables)
- [Features](#features)
  - [AI Farm Advisor](#ai-farm-advisor)
  - [Multimodal Farm Context](#multimodal-farm-context)
  - [Live Weather Integration](#live-weather-integration)
  - [AI Photo Diagnosis](#ai-photo-diagnosis)
  - [AI Voice Transcription](#ai-voice-transcription)
  - [Early-Warning Risk Alerts](#early-warning-risk-alerts)
  - [Sustainability & Input Optimization](#sustainability--input-optimization)
  - [Crop-Stage-Aware Insights](#crop-stage-aware-insights)
- [Tech stack](#tech-stack)
- [License](#license)

## Quickstart

Requires Node.js and npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

The app works fully with zero configuration — every AI feature below falls back gracefully to a rule-based or manual-entry alternative if no API key is set. To enable the AI features, see [Environment variables](#environment-variables).

## Environment variables

Copy `.env.example` to `.env` and fill in at least `GROQ_API_KEY` to enable all AI features.

| Variable               | Required | Default                  | Notes                                                                                                                        |
| ----------------------- | :------: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GROQ_API_KEY`          |    —     | —                           | Free tier, no credit card. Get one at [console.groq.com/keys](https://console.groq.com/keys). Recommended/primary provider. |
| `GROQ_MODEL`            |    ✗     | `openai/gpt-oss-120b`       | Text model, used by the AI advisor chat and insights.                                                                       |
| `GROQ_VISION_MODEL`     |    ✗     | `qwen/qwen3.6-27b`          | Vision model, used by AI photo diagnosis.                                                                                    |
| `GROQ_WHISPER_MODEL`    |    ✗     | `whisper-large-v3-turbo`    | Speech-to-text model, used by voice observation transcription.                                                              |
| `OPENAI_API_KEY`        |    —     | —                           | Optional, billed/paid. Only used if Groq isn't configured or fails.                                                         |
| `OPENAI_MODEL`          |    ✗     | `gpt-4o-mini`               | Text + vision fallback model.                                                                                               |
| `OPENAI_WHISPER_MODEL`  |    ✗     | `whisper-1`                 | Speech-to-text fallback model.                                                                                              |

**Without any key set, nothing breaks** — the app falls back to rule-based recommendations and explanations, and each AI-powered button shows a clear message on how to enable it.

Groq's model lineup changes fairly often — if a default above stops working, check [console.groq.com/docs/deprecations](https://console.groq.com/docs/deprecations) and override the relevant `_MODEL` variable.

All AI calls happen server-side (`src/lib/aiProviders.server.ts` and the `*.server.ts` files under `src/services/`), so API keys are never sent to or exposed in the browser.

## Features

### AI Farm Advisor

The analysis page generates real AI insights (instead of only rule-based text) and includes an interactive chat where farmers can ask follow-up questions about their results. Once `GROQ_API_KEY` is set, the "AgriProfit Insight" card shows AI-generated text (labelled "AI · Groq"), and the "Ask the AI Farm Advisor" chat becomes interactive.

### Multimodal Farm Context

On the Analysis page, the "Additional Farm Data (optional)" section lets a farmer supply extra context beyond the core form:

- **Crop photo** — upload a photo for a preliminary AI disease/pest read, or describe it yourself.
- **Voice observation** — record a voice note for automatic AI transcription, or type it yourself.
- **Weather outlook** — auto-fetch a live 7-day forecast, or enter it manually.
- **Soil test report** — N/P/K, pH, organic carbon.
- **Farm history** — past seasons' crops and yields, for crop-rotation checks.
- **Days since sowing** — powers the crop-stage-aware insights.

All of this is optional and additive. `src/services/multimodalFusion.ts` turns whatever is provided into small, explainable score adjustments (e.g. "dry forecast + high-water crop → risk penalty") on top of the rule-based recommendation engine, and folds a summary into the AI advisor's prompt. A "Data Sources Used" panel on the results page shows exactly which inputs were factored in.

### Live Weather Integration

An "Auto-fetch live weather" button (`src/services/weatherService.server.ts`) pulls a live 7-day rainfall and temperature outlook from [Open-Meteo](https://open-meteo.com) — free, no API key needed — for the farmer's selected state (`src/data/locationCoordinates.ts`). Farmers can still edit any field afterward to override the live reading.

### AI Photo Diagnosis

Choosing a crop photo reveals an "Analyze Photo (AI)" button (`src/services/cropVision.server.ts`) that returns a plain-language summary, up to four specific findings (each with a Low/Medium/High severity), and recommended actions. Framed explicitly as a *preliminary visual read, not a lab diagnosis*. High/Medium-severity findings also feed into the Early-Warning Risk Alerts card.

### AI Voice Transcription

The "Voice Observation" field has a "Record Voice Note (AI)" button that captures audio in-browser (capped at 2 minutes) and transcribes it via a speech-to-text model (`src/services/voiceTranscription.server.ts`), appending the transcript to the text box. Fully editable afterward, and used identically downstream whether recorded or typed.

### Early-Warning Risk Alerts

An "Early-Warning Risk Alerts" card (`src/services/riskAlertEngine.ts`) fuses the weather outlook, the recommended crop's water requirement, its current growth stage, and any high-severity photo findings. When these line up into real risk, a clearly labelled alert (Critical / Warning / Watch) explains which inputs triggered it and what to do — so a farmer can act *before* damage is visible. Deliberately rule-based and explainable rather than predictive.

### Sustainability & Input Optimization

A "Sustainability & Input Optimization" card (`src/services/sustainabilityEngine.ts`, `src/data/greenInputs.ts`) shows green/eco-friendly input recommendations, input-reduction practices, and an estimated % reduction in chemical input use with indicative cost savings — adjusted by soil test data when available.

### Crop-Stage-Aware Insights

Entering "Days Since Sowing / Transplanting" shows a "Crop Stage Insights" card (`src/services/cropStageEngine.ts`, `src/data/cropStages.ts`) with a progress timeline, stage-specific actions, and stage-specific watch-outs — tailored to exactly where the crop is in its growth cycle, rather than generic season-long advice.

## Tech stack

- [TanStack Start](https://tanstack.com/start) + TypeScript + React
- Tailwind CSS
- Groq / OpenAI (optional AI advisor, vision, and speech-to-text)
- [Open-Meteo](https://open-meteo.com) (free live weather)

## License

MIT — see [LICENSE](./LICENSE).
