import { AlertTriangle, ShieldAlert, Eye, Info, ShieldCheck } from "lucide-react";
import type { RiskAlert, RiskAlertSeverity } from "@/types";

/** Surfaces early-warning risk alerts (see src/services/riskAlertEngine.ts)
 * for the recommended crop — short, explainable warnings that combine the
 * weather outlook with the crop's water needs and current growth stage, so
 * a farmer can act ahead of time instead of after damage is visible. */
export function RiskAlertsCard({ alerts, cropName }: { alerts: RiskAlert[]; cropName: string }) {
  const actionable = alerts.filter((a) => a.category !== "data-gap");
  const infoOnly = alerts.filter((a) => a.category === "data-gap");
  const categoriesPresent = new Set(actionable.map((a) => a.category));
  const sourceLabels = [
    categoriesPresent.has("weather") || categoriesPresent.has("irrigation")
      ? "weather outlook"
      : null,
    categoriesPresent.has("pest-disease") ? "photo/crop-stage signals" : null,
  ].filter((s): s is string => Boolean(s));

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <ShieldAlert className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Early-Warning Risk Alerts</h2>
          <p className="text-xs text-muted-foreground">
            {actionable.length > 0
              ? `${actionable.length} active alert${actionable.length === 1 ? "" : "s"} for ${cropName}, based on ${sourceLabels.join(" and ") || "the data provided"}.`
              : `No active weather- or photo-driven risks detected for ${cropName} right now.`}
          </p>
        </div>
      </div>

      {actionable.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {actionable.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </ul>
      ) : (
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-success/10 p-4 text-sm text-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p>
            Nothing in the current outlook points to elevated irrigation, waterlogging or
            temperature stress for {cropName}. Keep monitoring — this updates automatically as new
            weather data comes in.
          </p>
        </div>
      )}

      {infoOnly.map((alert) => (
        <div
          key={alert.id}
          className="mt-3 flex items-start gap-2.5 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-medium text-foreground">{alert.title}.</span> {alert.message}{" "}
            {alert.action}
          </p>
        </div>
      ))}
    </section>
  );
}

const SEVERITY_STYLES: Record<
  RiskAlertSeverity,
  { badge: string; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  critical: {
    badge: "border-danger/30 bg-danger/10 text-danger",
    label: "Critical",
    icon: AlertTriangle,
  },
  warning: {
    badge: "border-warning/30 bg-warning/10 text-warning",
    label: "Warning",
    icon: AlertTriangle,
  },
  watch: { badge: "border-primary/30 bg-primary/10 text-primary", label: "Watch", icon: Eye },
  info: {
    badge: "border-input bg-muted text-muted-foreground",
    label: "Info",
    icon: Info,
  },
};

function AlertItem({ alert }: { alert: RiskAlert }) {
  const style = SEVERITY_STYLES[alert.severity];
  const Icon = style.icon;

  return (
    <li className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style.badge}`}
        >
          <Icon className="h-3 w-3" />
          {style.label}
        </span>
        <span className="text-sm font-semibold">{alert.title}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
      <p className="mt-2 flex items-start gap-1.5 text-sm">
        <span className="font-medium text-foreground">Do this:</span>
        <span>{alert.action}</span>
      </p>
    </li>
  );
}
