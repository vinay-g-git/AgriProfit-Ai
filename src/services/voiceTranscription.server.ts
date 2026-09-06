import { createServerFn } from "@tanstack/react-start";
import { transcribeAudio, isAiConfigured } from "@/lib/aiProviders.server";

/**
 * Voice Observation — Live Recording + Auto-Transcription
 * ---------------------------------------------------------
 * Sends a farmer-recorded voice note (captured in-browser via
 * MediaRecorder, see FarmContextForm.tsx) to a speech-to-text model
 * (Groq's Whisper — free — or OpenAI's whisper-1, via
 * src/lib/aiProviders.server.ts) and returns the plain transcript text,
 * which the UI drops straight into the existing `voiceObservation` field
 * that the multimodal fusion layer and AI advisor already know how to use.
 *
 * Runs server-side only (server function) so the audio bytes and API keys
 * never need to be handled anywhere except this request.
 */

// Rough guard on the base64 data URL length (≈1.37x the raw file size).
// Voice observations are meant to be short (a minute or two), so this is
// generous but still protects against accidentally huge uploads.
const MAX_DATA_URL_LENGTH = 15 * 1024 * 1024;

function guessFileName(mimeType: string): string {
  const ext = mimeType.split("/")[1]?.split(";")[0] ?? "webm";
  return `voice-note.${ext}`;
}

/**
 * Parses a `data:` URL into its base media type and base64 payload.
 *
 * Deliberately NOT a single regex: real-world data URLs (e.g. from
 * MediaRecorder) look like `data:audio/webm;codecs=opus;base64,AAAA...` —
 * there can be any number of `;param=value` segments (codecs, charset,
 * etc.) between the media type and the `;base64` marker, in any order, so
 * matching a fixed `;base64,` right after the media type is too brittle.
 */
function parseAudioDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  if (!dataUrl.startsWith("data:")) return null;
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return null;

  const header = dataUrl.slice(5, commaIndex); // e.g. "audio/webm;codecs=opus;base64"
  const base64 = dataUrl.slice(commaIndex + 1);
  const segments = header.split(";");
  const mimeType = segments[0]?.trim() ?? "";

  if (!mimeType.toLowerCase().startsWith("audio/")) return null;
  if (!segments.slice(1).some((s) => s.trim().toLowerCase() === "base64")) return null;
  if (!base64) return null;

  return { mimeType, base64 };
}

export const transcribeVoiceNote = createServerFn({ method: "POST" })
  .validator((data: { audioDataUrl: string }) => data)
  .handler(async ({ data }) => {
    if (!isAiConfigured()) {
      return { available: false as const, reason: "not_configured" as const };
    }

    const parsed = parseAudioDataUrl(data.audioDataUrl);
    if (!parsed) {
      return { available: false as const, reason: "invalid_audio" as const };
    }
    if (data.audioDataUrl.length > MAX_DATA_URL_LENGTH) {
      return {
        available: false as const,
        reason: "too_large" as const,
        message:
          "That recording is too long to transcribe — please keep voice notes under ~2 minutes.",
      };
    }

    const { mimeType, base64 } = parsed;

    try {
      const audioBuffer = Buffer.from(base64, "base64");
      if (audioBuffer.length === 0) {
        return { available: false as const, reason: "invalid_audio" as const };
      }

      const { text, provider } = await transcribeAudio(
        audioBuffer,
        guessFileName(mimeType),
        mimeType,
      );

      return { available: true as const, text, provider, transcribedAt: new Date().toISOString() };
    } catch (err) {
      console.error("[ai] transcribeVoiceNote failed:", err);
      return { available: false as const, reason: "error" as const };
    }
  });
