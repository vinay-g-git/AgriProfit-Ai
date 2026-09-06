import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  CloudSun,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Mic,
  Square,
} from "lucide-react";
import { fetchLiveWeather } from "@/services/weatherService.server";
import { analyzeCropPhoto } from "@/services/cropVision.server";
import { transcribeVoiceNote } from "@/services/voiceTranscription.server";
import type { FarmHistoryEntry, LocationName, MultimodalContext } from "@/types";

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
// Voice notes are meant to be short observations, not long recordings — cap
// at 2 minutes so the upload stays small and transcription stays quick.
const MAX_RECORDING_MS = 2 * 60 * 1000;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Optional "extra data" section that feeds the multimodal fusion layer
 * (see src/services/multimodalFusion.ts). Everything here is optional —
 * the core Analyze flow works fine with none of it filled in.
 *
 * Crop photo can be sent to a vision-capable AI model for a preliminary
 * disease/pest read (src/services/cropVision.server.ts). Voice notes can be
 * recorded live in-browser and auto-transcribed via a speech-to-text model
 * (src/services/voiceTranscription.server.ts). Both fall back gracefully to
 * a plain typed/pasted note if no AI provider is configured.
 */
export function FarmContextForm({
  location,
  value,
  onChange,
}: {
  location: LocationName;
  value: MultimodalContext;
  onChange: (next: MultimodalContext) => void;
}) {
  const [open, setOpen] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function patch(next: Partial<MultimodalContext>) {
    onChange({ ...value, ...next });
  }

  // Stop any in-progress recording/timer if the form unmounts mid-recording.
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (recordStopTimeoutRef.current) clearTimeout(recordStopTimeoutRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recorder?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleFetchWeather() {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetchLiveWeather({ data: { location } });
      if (res.available) {
        patch({ weather: res.weather });
      } else {
        setWeatherError(res.message);
      }
    } catch {
      setWeatherError("Couldn't reach the weather service just now. Please try again shortly.");
    } finally {
      setWeatherLoading(false);
    }
  }

  function handlePhotoSelected(file: File | undefined) {
    setPhotoError(null);
    patch({ cropPhotoFileName: file?.name ?? undefined, cropPhotoAnalysis: undefined });
    if (!file) {
      setPhotoDataUrl(null);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoDataUrl(null);
      setPhotoError("That image is a bit large — please choose one under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => setPhotoError("Couldn't read that image file. Please try another.");
    reader.readAsDataURL(file);
  }

  async function handleAnalyzePhoto() {
    if (!photoDataUrl) return;
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      const res = await analyzeCropPhoto({
        data: { imageDataUrl: photoDataUrl, farmerNote: value.cropPhotoNote },
      });
      if (res.available) {
        patch({
          cropPhotoAnalysis: res.analysis,
          cropPhotoNote: value.cropPhotoNote?.trim() ? value.cropPhotoNote : res.analysis.summary,
        });
      } else {
        setPhotoError(
          res.reason === "not_configured"
            ? "AI photo analysis isn't set up yet. Add a free Groq API key (GROQ_API_KEY) to your .env file to enable it — see the README."
            : res.reason === "too_large"
              ? res.message
              : res.reason === "invalid_image"
                ? "That file doesn't look like a supported image (png/jpg/webp/gif)."
                : "Couldn't analyze that photo just now. Please try again in a moment.",
        );
      }
    } catch {
      setPhotoError("Couldn't analyze that photo just now. Please try again in a moment.");
    } finally {
      setPhotoLoading(false);
    }
  }

  function stopRecordingInternal() {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (recordStopTimeoutRef.current) {
      clearTimeout(recordStopTimeoutRef.current);
      recordStopTimeoutRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    recorder?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  async function handleStartRecording() {
    setVoiceError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Voice recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        if (blob.size === 0) return;

        setTranscribing(true);
        setVoiceError(null);
        try {
          const audioDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("read failed"));
            reader.onerror = () => reject(new Error("read failed"));
            reader.readAsDataURL(blob);
          });

          const res = await transcribeVoiceNote({ data: { audioDataUrl } });
          if (res.available) {
            const existing = value.voiceObservation?.trim();
            patch({
              voiceObservation: existing ? `${existing} ${res.text}` : res.text,
              voiceTranscription: { provider: res.provider, transcribedAt: res.transcribedAt },
            });
          } else {
            setVoiceError(
              res.reason === "not_configured"
                ? "Voice transcription isn't set up yet. Add a free Groq API key (GROQ_API_KEY) to your .env file to enable it — see the README."
                : res.reason === "too_large"
                  ? res.message
                  : res.reason === "invalid_audio"
                    ? "That recording couldn't be read. Please try again."
                    : "Couldn't transcribe that recording just now. Please try again in a moment.",
            );
          }
        } catch {
          setVoiceError(
            "Couldn't transcribe that recording just now. Please try again in a moment.",
          );
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      recordStopTimeoutRef.current = setTimeout(stopRecordingInternal, MAX_RECORDING_MS);
    } catch {
      setVoiceError("Couldn't access your microphone. Please check permissions and try again.");
    }
  }

  function handleStopRecording() {
    stopRecordingInternal();
  }

  function addHistoryRow() {
    const row: FarmHistoryEntry = { id: uid(), crop: "", season: "" };
    patch({ farmHistory: [...(value.farmHistory ?? []), row] });
  }

  function updateHistoryRow(id: string, patchRow: Partial<FarmHistoryEntry>) {
    patch({
      farmHistory: (value.farmHistory ?? []).map((h) => (h.id === id ? { ...h, ...patchRow } : h)),
    });
  }

  function removeHistoryRow(id: string) {
    patch({ farmHistory: (value.farmHistory ?? []).filter((h) => h.id !== id) });
  }

  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left sm:px-5"
      >
        <span>
          <span className="text-sm font-semibold">Additional Farm Data (optional)</span>
          <span className="ml-2 text-xs text-muted-foreground">
            Photo notes, voice observations, weather, soil test, history &amp; crop stage
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-6 border-t border-dashed border-border px-4 py-5 sm:px-5">
          {/* Crop photo */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="cropPhoto">
              Crop Photo
            </label>
            <input
              id="cropPhoto"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
              onChange={(e) => handlePhotoSelected(e.target.files?.[0])}
            />
            {photoDataUrl && (
              <div className="mt-2.5 flex items-center gap-3">
                <img
                  src={photoDataUrl}
                  alt="Selected crop photo preview"
                  className="h-16 w-16 rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={handleAnalyzePhoto}
                  disabled={photoLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {photoLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {photoLoading ? "Analyzing…" : "Analyze Photo (AI)"}
                </button>
              </div>
            )}
            <textarea
              placeholder="What does the photo show? e.g. yellowing leaves on lower stems, wilting patch near the field edge…"
              rows={2}
              className={`${fieldClass} mt-2.5`}
              value={value.cropPhotoNote ?? ""}
              onChange={(e) => patch({ cropPhotoNote: e.target.value })}
            />
            {photoError && (
              <p className="mt-1.5 text-xs font-medium text-destructive">{photoError}</p>
            )}
            {value.cropPhotoAnalysis && (
              <div className="mt-2.5 rounded-2xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  {value.cropPhotoAnalysis.cropLooksHealthy ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  )}
                  AI Photo Analysis ·{" "}
                  {value.cropPhotoAnalysis.provider === "groq" ? "Groq" : "OpenAI"}
                </div>
                <p className="mt-1.5 text-sm">{value.cropPhotoAnalysis.summary}</p>
                {value.cropPhotoAnalysis.findings.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {value.cropPhotoAnalysis.findings.map((f) => (
                      <li key={f.issue}>
                        • <span className="font-medium text-foreground">{f.issue}</span> (
                        {f.severity}) — {f.note}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {value.cropPhotoAnalysis
                ? "Preliminary AI read, not a lab diagnosis — you can still edit the note above."
                : 'Choose a photo, then "Analyze Photo (AI)" for a preliminary disease/pest read — or just describe what\'s visible above.'}
            </p>
          </div>

          {/* Voice observation */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="voiceObs">
              Voice Observation (transcript)
            </label>
            <div className="mb-2.5 flex items-center gap-2">
              {!recording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={transcribing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {transcribing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" />
                  )}
                  {transcribing ? "Transcribing…" : "Record Voice Note (AI)"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20"
                >
                  <Square className="h-3 w-3 animate-pulse fill-current" />
                  Stop ({formatSeconds(recordSeconds)})
                </button>
              )}
            </div>
            <textarea
              id="voiceObs"
              placeholder='e.g. "Pests spotted on the groundnut leaves this morning, soil looks dry near the borewell side."'
              rows={2}
              className={fieldClass}
              value={value.voiceObservation ?? ""}
              onChange={(e) =>
                patch({ voiceObservation: e.target.value, voiceTranscription: undefined })
              }
            />
            {voiceError && (
              <p className="mt-1.5 text-xs font-medium text-destructive">{voiceError}</p>
            )}
            {value.voiceTranscription && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Transcribed by AI ·{" "}
                {value.voiceTranscription.provider === "groq" ? "Groq" : "OpenAI"}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {value.voiceTranscription
                ? "You can still edit the transcript above before analyzing."
                : "Record a voice note for automatic transcription, or paste/type notes directly."}
            </p>
          </div>

          {/* Crop stage */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="daysSinceSowing">
              Days Since Sowing / Transplanting
            </label>
            <input
              id="daysSinceSowing"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 35"
              className={`${fieldClass} sm:max-w-xs`}
              value={value.daysSinceSowing ?? ""}
              onChange={(e) =>
                patch({ daysSinceSowing: e.target.value ? Number(e.target.value) : undefined })
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              If you've already sown or transplanted your top-recommended crop, tell us how many
              days ago — you'll get actions and watch-outs tailored to its current growth stage.
            </p>
          </div>

          {/* Weather */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">Weather Outlook</span>
              <button
                type="button"
                onClick={handleFetchWeather}
                disabled={weatherLoading || location === "Other"}
                className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {weatherLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CloudSun className="h-3.5 w-3.5" />
                )}
                {weatherLoading ? "Fetching…" : "Auto-fetch live weather"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="number"
                placeholder="Expected rainfall (mm)"
                className={fieldClass}
                value={value.weather?.expectedRainfallMm ?? ""}
                onChange={(e) =>
                  patch({
                    weather: {
                      ...value.weather,
                      source: "manual",
                      expectedRainfallMm: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
              <input
                type="number"
                placeholder="Avg temperature (°C)"
                className={fieldClass}
                value={value.weather?.avgTemperatureC ?? ""}
                onChange={(e) =>
                  patch({
                    weather: {
                      ...value.weather,
                      source: "manual",
                      avgTemperatureC: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
              />
              <input
                type="text"
                placeholder="Forecast note e.g. 'dry spell expected'"
                className={fieldClass}
                value={value.weather?.forecastNote ?? ""}
                onChange={(e) =>
                  patch({
                    weather: { ...value.weather, source: "manual", forecastNote: e.target.value },
                  })
                }
              />
            </div>
            {value.weather?.source === "auto" ? (
              <p className="mt-1.5 text-xs font-medium text-primary">
                Live · Open-Meteo — near {value.weather.locationLabel}. Edit any field above to
                override with your own reading.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-fetch pulls a live 7-day rainfall &amp; temperature outlook for your selected
                location, or enter what you know from a forecast yourself.
              </p>
            )}
            {weatherError && (
              <p className="mt-1.5 text-xs font-medium text-destructive">{weatherError}</p>
            )}
            {location === "Other" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Auto-fetch isn't available for "Other" locations yet — enter values manually.
              </p>
            )}
          </div>

          {/* Soil metrics */}
          <div>
            <span className="mb-1.5 block text-sm font-medium">Soil Test Report</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["nitrogen", "N (kg/ha)"],
                  ["phosphorus", "P (kg/ha)"],
                  ["potassium", "K (kg/ha)"],
                  ["ph", "pH"],
                  ["organicCarbon", "Organic carbon (%)"],
                ] as const
              ).map(([key, label]) => (
                <input
                  key={key}
                  type="number"
                  step="0.1"
                  placeholder={label}
                  className={fieldClass}
                  value={value.soilMetrics?.[key] ?? ""}
                  onChange={(e) =>
                    patch({
                      soilMetrics: {
                        ...value.soilMetrics,
                        [key]: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                />
              ))}
            </div>
          </div>

          {/* Farm history */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium">Farm History (past seasons)</span>
              <button
                type="button"
                onClick={addHistoryRow}
                className="inline-flex items-center gap-1 rounded-lg border border-input px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" /> Add season
              </button>
            </div>
            {(value.farmHistory ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground">
                No past seasons logged yet. Add one to factor crop rotation into your score.
              </p>
            )}
            <div className="space-y-2">
              {(value.farmHistory ?? []).map((h) => (
                <div key={h.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                  <input
                    type="text"
                    placeholder="Crop e.g. Tomato"
                    className={fieldClass}
                    value={h.crop}
                    onChange={(e) => updateHistoryRow(h.id, { crop: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Season e.g. Kharif 2025"
                    className={fieldClass}
                    value={h.season}
                    onChange={(e) => updateHistoryRow(h.id, { season: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Yield (qtl/acre)"
                    className={fieldClass}
                    value={h.yieldPerAcre ?? ""}
                    onChange={(e) =>
                      updateHistoryRow(h.id, {
                        yieldPerAcre: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeHistoryRow(h.id)}
                    aria-label="Remove season"
                    className="rounded-lg p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
