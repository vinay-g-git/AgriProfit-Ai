/**
 * Server-only AI provider layer.
 *
 * Primary provider: Groq (https://console.groq.com) — has a genuinely free
 * developer tier (no credit card required) and an OpenAI-compatible chat
 * completions API, so it's the default/recommended provider for this app.
 *
 * Secondary provider: OpenAI — supported for people who already have an
 * OpenAI key, but the OpenAI API is billed (no ongoing free tier), so it is
 * ONLY used as a fallback if GROQ_API_KEY is missing or a Groq call fails,
 * and only if OPENAI_API_KEY is explicitly set.
 *
 * This file must never be imported from client components — it reads
 * process.env secrets and calls out with them. TanStack Start strips
 * `.server.ts` handler code from the client bundle automatically as long as
 * it's only reached through a createServerFn handler (see aiAdvisor.server.ts).
 */

export type AiProvider = "groq" | "openai";

export type ChatContentPart =
  { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
}

export interface AiChatResult {
  text: string;
  provider: AiProvider;
}

// Groq deprecated llama-3.3-70b-versatile (decommissioned Aug 16, 2026) in
// favor of openai/gpt-oss-120b — see console.groq.com/docs/deprecations.
// Still overridable via GROQ_MODEL for anyone who wants a different model.
const GROQ_MODEL = process.env["GROQ_MODEL"] || "openai/gpt-oss-120b";
const OPENAI_MODEL = process.env["OPENAI_MODEL"] || "gpt-4o-mini";

// Vision-capable models, used only by visionChatCompletion (crop photo
// analysis). Groq's multimodal lineup changes fairly often — Llama 4
// Maverick was decommissioned March 9, 2026; Qwen 3.6 27B is Groq's current
// production vision model, so it is the default. GROQ_VISION_MODEL can
// override it if Groq's catalog moves on again (check
// console.groq.com/docs/vision). gpt-4o-mini already handles both text and
// vision, so it doubles as the OpenAI vision model too.
const GROQ_VISION_MODEL = process.env["GROQ_VISION_MODEL"] || "qwen/qwen3.6-27b";
const OPENAI_VISION_MODEL = process.env["OPENAI_VISION_MODEL"] || OPENAI_MODEL;

// Speech-to-text models, used only by transcribeAudio (voice observation
// recording). whisper-large-v3-turbo is Groq's fast, free-tier-friendly
// Whisper model; whisper-1 is OpenAI's only transcription model.
const GROQ_WHISPER_MODEL = process.env["GROQ_WHISPER_MODEL"] || "whisper-large-v3-turbo";
const OPENAI_WHISPER_MODEL = process.env["OPENAI_WHISPER_MODEL"] || "whisper-1";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";

async function callChatApi(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens = 450,
  extraBody?: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: maxTokens,
      ...extraBody,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from AI provider");
  return text;
}

async function callTranscriptionApi(
  url: string,
  apiKey: string,
  model: string,
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([audioBuffer as unknown as BlobPart], { type: mimeType }), fileName);
  form.append("model", model);
  form.append("response_format", "json");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = (await res.json()) as { text?: string };
  const text = data.text?.trim();
  if (!text) throw new Error("Empty transcript from AI provider");
  return text;
}

function hasGroqKey() {
  return Boolean(process.env["GROQ_API_KEY"]);
}

function hasOpenAiKey() {
  return Boolean(process.env["OPENAI_API_KEY"]);
}

export function isAiConfigured(): boolean {
  return hasGroqKey() || hasOpenAiKey();
}

export function configuredProviders(): AiProvider[] {
  const list: AiProvider[] = [];
  if (hasGroqKey()) list.push("groq");
  if (hasOpenAiKey()) list.push("openai");
  return list;
}

/**
 * Sends a chat completion request. Tries Groq first (free tier), and only
 * falls back to OpenAI (paid) if Groq isn't configured or fails, and an
 * OpenAI key has explicitly been provided.
 */
export async function chatCompletion(messages: ChatMessage[]): Promise<AiChatResult> {
  const groqKey = process.env["GROQ_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];

  if (groqKey) {
    try {
      const text = await callChatApi(GROQ_URL, groqKey, GROQ_MODEL, messages);
      return { text, provider: "groq" };
    } catch (err) {
      console.error("[ai] Groq request failed:", err);
      if (!openAiKey) throw err;
      // fall through to OpenAI below
    }
  }

  if (openAiKey) {
    const text = await callChatApi(OPENAI_URL, openAiKey, OPENAI_MODEL, messages);
    return { text, provider: "openai" };
  }

  throw new Error("NO_AI_PROVIDER_CONFIGURED");
}

/**
 * Sends a chat completion request that includes an image (crop photo
 * analysis). Builds the multimodal user message in the OpenAI-compatible
 * `content: [{type:"text"},{type:"image_url"}]` format both providers
 * understand, and follows the same Groq-first-then-OpenAI-fallback policy
 * as chatCompletion — using each provider's vision-capable model.
 *
 * The `jsonMode` flag requests strict JSON output via `response_format`
 * (supported by both providers) and, on Groq, also disables Qwen 3.6's
 * "thinking" mode (`reasoning_effort: "none"`) — otherwise the model
 * prepends reasoning text before its actual answer, which breaks strict
 * JSON parsing on the caller's side even when the analysis itself is fine.
 */
export async function visionChatCompletion(
  priorMessages: ChatMessage[],
  userText: string,
  imageDataUrl: string,
  jsonMode = false,
): Promise<AiChatResult> {
  const groqKey = process.env["GROQ_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];

  const messages: ChatMessage[] = [
    ...priorMessages,
    {
      role: "user",
      content: [
        { type: "text", text: userText },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ];

  if (groqKey) {
    try {
      const text = await callChatApi(GROQ_URL, groqKey, GROQ_VISION_MODEL, messages, 1500, {
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        // qwen3 models default to "thinking" mode, which prepends reasoning
        // text before the answer — "none" gives a direct response instead.
        // Only send this for qwen3 models; other Groq models either don't
        // support the field or use a different value set (low/medium/high).
        ...(GROQ_VISION_MODEL.startsWith("qwen/") ? { reasoning_effort: "none" } : {}),
      });
      return { text, provider: "groq" };
    } catch (err) {
      console.error("[ai] Groq vision request failed:", err);
      if (!openAiKey) throw err;
      // fall through to OpenAI below
    }
  }

  if (openAiKey) {
    const text = await callChatApi(OPENAI_URL, openAiKey, OPENAI_VISION_MODEL, messages, 1500, {
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
    return { text, provider: "openai" };
  }

  throw new Error("NO_AI_PROVIDER_CONFIGURED");
}

/**
 * Transcribes a recorded voice observation (speech-to-text) using Groq's
 * Whisper models (free tier), falling back to OpenAI's whisper-1 the same
 * way chatCompletion and visionChatCompletion fall back — only if Groq
 * isn't configured or the Groq call fails, and only if an OpenAI key has
 * explicitly been provided.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<AiChatResult> {
  const groqKey = process.env["GROQ_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];

  if (groqKey) {
    try {
      const text = await callTranscriptionApi(
        GROQ_TRANSCRIPTION_URL,
        groqKey,
        GROQ_WHISPER_MODEL,
        audioBuffer,
        fileName,
        mimeType,
      );
      return { text, provider: "groq" };
    } catch (err) {
      console.error("[ai] Groq transcription request failed:", err);
      if (!openAiKey) throw err;
      // fall through to OpenAI below
    }
  }

  if (openAiKey) {
    const text = await callTranscriptionApi(
      OPENAI_TRANSCRIPTION_URL,
      openAiKey,
      OPENAI_WHISPER_MODEL,
      audioBuffer,
      fileName,
      mimeType,
    );
    return { text, provider: "openai" };
  }

  throw new Error("NO_AI_PROVIDER_CONFIGURED");
}
