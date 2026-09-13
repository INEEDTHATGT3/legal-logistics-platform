/**
 * Placeholder shown in the exported HTML and on the first client render,
 * until `hydrateDemoStore` has read the browser's demo state. Keeping the
 * pre-hydration markup identical on both sides is what lets the seeded
 * dates stay relative to the viewer's clock.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the demo scenario…</span>

      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="h-44 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
