import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAiInsight } from "@/services/aiAdvisor.server";
import { buildInsight } from "@/services/recommendationEngine";
import type { CropAnalysis, FarmInput, MultimodalContext } from "@/types";

type State =
  | { status: "loading" }
  | { status: "ai"; text: string; provider: "groq" | "openai" }
  | { status: "fallback"; reason: "not_configured" | "error" };

export function AiInsight({
  analysis,
  farm,
  results,
  context,
}: {
  analysis: CropAnalysis;
  farm: FarmInput;
  results: CropAnalysis[];
  context?: MultimodalContext | undefined;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    getAiInsight({ data: { farm, results, context } })
      .then((res) => {
        if (cancelled) return;
        if (res.available) {
          setState({ status: "ai", text: res.text, provider: res.provider });
        } else {
          setState({
            status: "fallback",
            reason: res.reason === "not_configured" ? "not_configured" : "error",
          });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "fallback", reason: "error" });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farm, analysis.crop.id]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-primary">AgriProfit Insight — Why this crop?</h3>
        {state.status === "ai" && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            AI · {state.provider === "groq" ? "Groq" : "OpenAI"}
          </span>
        )}
      </div>

      {state.status === "loading" && (
        <div className="mt-2 space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-11/12" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      )}

      {state.status === "ai" && (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{state.text}</p>
      )}

      {state.status === "fallback" && (
        <>
          <p className="mt-2 text-sm leading-relaxed">{buildInsight(analysis, farm)}</p>
          {state.reason === "not_configured" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing the rule-based explanation. Add a free{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                Groq API key
              </a>{" "}
              as <code className="rounded bg-muted px-1 py-0.5">GROQ_API_KEY</code> in your .env
              file to turn on AI-generated insights and the chat advisor below.
            </p>
          )}
          {state.reason === "error" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing the rule-based explanation — the AI advisor couldn't respond just now.
            </p>
          )}
        </>
      )}

      <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
        {analysis.reasons.map((r) => (
          <li key={r.text} className={r.ok ? "text-foreground" : "text-muted-foreground"}>
            <span className={r.ok ? "text-success" : "text-warning"}>{r.ok ? "✓" : "!"}</span>{" "}
            {r.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
