import { Camera, Mic, CloudSun, FlaskConical, History, Sprout, Info } from "lucide-react";
import type { DataSourceFlag, DataSourceKey } from "@/types";

const ICONS: Record<DataSourceKey, React.ComponentType<{ className?: string }>> = {
  photo: Camera,
  voice: Mic,
  weather: CloudSun,
  soil: FlaskConical,
  history: History,
  stage: Sprout,
};

/** Shows which multimodal data sources fed into this analysis, so the
 * fusion behind the score stays transparent instead of a black box. */
export function DataSourcesPanel({ sources }: { sources: DataSourceFlag[] }) {
  const activeCount = sources.filter((s) => s.active).length;

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">
          Data Sources Used {activeCount > 0 ? `(${activeCount}/${sources.length})` : ""}
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {activeCount > 0
          ? "Your recommendation and AI insight were adjusted using the extra data below."
          : "Only your core farm details were used. Add a crop photo note, voice observation, weather outlook, soil test or farm history above for a more tailored result."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {sources.map((s) => {
          const Icon = ICONS[s.key];
          return (
            <span
              key={s.key}
              title={s.summary}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                s.active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-input bg-card text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
              {s.active && s.summary ? (
                <span className="hidden max-w-[16rem] truncate sm:inline">— {s.summary}</span>
              ) : null}
            </span>
          );
        })}
      </div>
    </section>
  );
}
