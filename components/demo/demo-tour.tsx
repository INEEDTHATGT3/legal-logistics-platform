"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types";
import {
  hydrateDemoStore,
  setTourStep,
  useDemoState,
  useMounted,
} from "@/lib/demo-store";

/**
 * The walkthrough panel. It is the presenter's script, on screen, so a
 * pitch does not depend on remembering the order of the story — and so
 * the audience can see the loop close from one persona to the next.
 */

interface TourStep {
  /** Where this beat happens. Clicking the step navigates there. */
  persona: UserRole | "entry";
  title: string;
  /** What to do on screen. */
  action: string;
  /** The point to make while doing it. */
  say: string;
}

const STEPS: TourStep[] = [
  {
    persona: "entry",
    title: "The two halves",
    action: "Open the entry screen and name the three roles.",
    say: "Legal advice is digital. Legal paperwork is physical. Today those are two different companies — and the client is the one carrying documents between them.",
  },
  {
    persona: "client",
    title: "Finding counsel",
    action: "Search the directory, then filter by a specialty.",
    say: "Discovery is the easy half, and it is where every competitor stops. Rate, specialty and availability are visible before a client ever picks up the phone.",
  },
  {
    persona: "client",
    title: "Booking",
    action: "Open a lawyer card, pick a slot, confirm the booking.",
    say: "Booked in one step, no calls, no back-and-forth. Note the consultation appears immediately below.",
  },
  {
    persona: "client",
    title: "The part nobody else does",
    action: "Request a document delivery — pick a type and an address.",
    say: "This is the wedge. The same account that booked the advice moves the affidavit. One relationship, not two vendors.",
  },
  {
    persona: "admin",
    title: "Operations",
    action: "Find that delivery and press Advance twice.",
    say: "Operations is a first-class surface, not a spreadsheet. Every movement on the network is one screen and one click.",
  },
  {
    persona: "client",
    title: "The loop closes",
    action: "Return to the client tracker.",
    say: "The client sees the change without asking anyone. That is the trust the physical half has always been missing.",
  },
  {
    persona: "lawyer",
    title: "The supply side",
    action: "Add case notes, then mark the consultation complete.",
    say: "Advocates get a practice tool, not just lead generation. That is why supply stays on the platform.",
  },
  {
    persona: "lawyer",
    title: "What the advocate earns",
    action: "Point at the practice metrics updating.",
    say: "Every completed consultation is a take-rate event, and every document moved is a second one. Two revenue lines from one booking.",
  },
];

const PERSONA_HREF: Record<TourStep["persona"], string> = {
  entry: "/",
  client: "/dashboard/client",
  lawyer: "/dashboard/lawyer",
  admin: "/dashboard/admin",
};

export function DemoTour() {
  const mounted = useMounted();
  const router = useRouter();
  const { tourStep } = useDemoState();

  // Safe to call from anywhere: it is idempotent, and the landing page
  // mounts this panel without a RoleProvider above it.
  useEffect(() => {
    hydrateDemoStore();
  }, []);

  // Rendering nothing until mount keeps the exported HTML free of any
  // stored tour position.
  if (!mounted) return null;

  // -1 is the closed state, so a presenter can dismiss the script and
  // still get it back from the entry screen.
  if (tourStep < 0) return null;

  const index = Math.min(tourStep, STEPS.length - 1);
  const step = STEPS[index];

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), STEPS.length - 1);
    setTourStep(clamped);
    router.push(PERSONA_HREF[STEPS[clamped].persona]);
  };

  return (
    <aside
      aria-label="Guided walkthrough"
      className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Compass className="h-3.5 w-3.5" />
          Step {index + 1} of {STEPS.length}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTourStep(-1)}
          aria-label="Hide the walkthrough"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <h2 className="font-heading text-base font-semibold">{step.title}</h2>
      <p className="mt-1 text-sm font-medium">{step.action}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.say}</p>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          size="sm"
          onClick={() => go(index + 1)}
          disabled={index === STEPS.length - 1}
          className="flex-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress rail — doubles as a jump control mid-pitch. */}
      <div className="mt-3 flex gap-1">
        {STEPS.map((_, dot) => (
          <button
            key={dot}
            onClick={() => go(dot)}
            aria-label={`Go to step ${dot + 1}`}
            aria-current={dot === index ? "step" : undefined}
            className={`h-1 flex-1 rounded-full transition-colors ${
              dot <= index ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </aside>
  );
}

/** Re-opens the walkthrough once it has been dismissed. */
export function DemoTourReopen() {
  const mounted = useMounted();
  const { tourStep } = useDemoState();

  if (!mounted || tourStep >= 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTourStep(0)}
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      <Compass className="h-4 w-4" />
      Walkthrough
    </Button>
  );
}
