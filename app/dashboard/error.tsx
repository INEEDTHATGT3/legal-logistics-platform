"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <h1 className="font-heading text-2xl font-semibold">
          This dashboard could not load
        </h1>

        <p className="text-sm text-muted-foreground">
          This is a self-contained demo — all of its data lives in this
          browser. Resetting the demo from the topbar, or clearing site data,
          clears a corrupted scenario.
        </p>

        <p className="text-sm text-destructive">{error.message}</p>

        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
