import { useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { askAiAdvisor, type AdvisorChatMessage } from "@/services/aiAdvisor.server";
import type { CropAnalysis, FarmInput, MultimodalContext } from "@/types";

const SUGGESTIONS = [
  "Why is this crop better than the others?",
  "What if my budget was lower?",
  "What are the biggest risks with this crop?",
  "How can I reduce my input costs sustainably?",
  "What should I be doing at my crop's current growth stage?",
];

export function AiAdvisorChat({
  farm,
  results,
  context,
}: {
  farm: FarmInput;
  results: CropAnalysis[];
  context?: MultimodalContext | undefined;
}) {
  const [messages, setMessages] = useState<AdvisorChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    const nextHistory = [...messages, { role: "user", content: q } as AdvisorChatMessage];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);
    setNotice(null);

    try {
      const res = await askAiAdvisor({
        data: { farm, results, question: q, history: messages, context },
      });

      if (res.available) {
        setMessages([...nextHistory, { role: "assistant", content: res.text }]);
      } else {
        setNotice(res.error);
        // remove the user's message that couldn't be answered so they can retry cleanly
        setMessages(messages);
      }
    } catch {
      setNotice("Something went wrong reaching the AI advisor. Please try again.");
      setMessages(messages);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Ask the AI Farm Advisor</h2>
          <p className="text-xs text-muted-foreground">
            Ask follow-up questions about your results — answers are grounded in your farm data
            above.
          </p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-input bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div ref={listRef} className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>
      )}

      {notice && (
        <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
          {notice}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your crop recommendation…"
          maxLength={500}
          disabled={loading}
          className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/25 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Send"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
}
