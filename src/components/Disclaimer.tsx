export function Disclaimer() {
  return (
    <div className="rounded-2xl border border-border bg-muted/60 p-5 text-sm leading-relaxed text-muted-foreground">
      <p>
        AgriProfit AI provides estimates for decision support only. Actual yield, costs, market
        prices and profitability may vary depending on weather, local market conditions, soil
        conditions and farming practices.
      </p>
      <p className="mt-2 font-medium text-foreground">Demo data is used for this MVP.</p>
    </div>
  );
}
