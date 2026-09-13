import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEMO_TRACTION } from "@/lib/demo-data";

/**
 * The numbers an investor asks for, on the operations screen where they
 * are being asked. Figures are illustrative for a network of this shape
 * and say so on screen — the demo never claims measured results.
 */
export function TractionStrip() {
  return (
    <section aria-label="Network scale">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <TrendingUp className="h-4 w-4" />
          Network Scale
        </h2>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          Illustrative
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {DEMO_TRACTION.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-2 font-heading text-2xl font-bold tabular-nums">
              {metric.value}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {metric.delta}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
