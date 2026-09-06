import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold tracking-tight">AgriProfit AI</span>
        </Link>
        <Link
          to="/analysis"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Analyze My Farm
        </Link>
      </div>
    </header>
  );
}
