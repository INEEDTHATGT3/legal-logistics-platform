"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEMO_CITIES } from "@/lib/demo-data";
import { DOCUMENT_TYPES, LEGAL_SPECIALTIES } from "@/lib/types";

/**
 * A simulated feed of network events, so the operations screen reads as
 * a live network rather than a static table. Nothing here touches the
 * demo store — it is presentation only, and is labelled as simulated.
 */

interface Event {
  id: number;
  text: string;
  at: string;
}

const CAPACITY = 6;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function makeEvent(id: number): Event {
  const city = pick(DEMO_CITIES);

  const templates = [
    () => `Consultation booked — ${pick(LEGAL_SPECIALTIES)}, ${city}`,
    () => `${pick(DOCUMENT_TYPES)} picked up in ${city}`,
    () => `${pick(DOCUMENT_TYPES)} delivered in ${city}`,
    () => `Courier assigned — ${city} route`,
    () => `New advocate onboarded — ${pick(LEGAL_SPECIALTIES)}, ${city}`,
    () => `Consultation completed — ${pick(LEGAL_SPECIALTIES)}, ${city}`,
  ];

  return {
    id,
    text: pick(templates)(),
    at: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

// The feed lives outside React so it keeps running while the presenter
// moves between personas, and so no effect has to push it into state.
let events: Event[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const EMPTY: Event[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function push() {
  events = [makeEvent(nextId++), ...events].slice(0, CAPACITY);
  emit();
}

export function ActivityTicker() {
  const started = useRef(false);

  const feed = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => events,
    () => EMPTY
  );

  useEffect(() => {
    // Seed a full panel on the first mount so it never opens empty, then
    // trickle. Intervals are staggered so the feed does not look metronomic.
    if (!started.current) {
      started.current = true;
      if (events.length === 0) {
        for (let i = 0; i < CAPACITY; i += 1) push();
      }
    }

    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        push();
        schedule();
      }, 2600 + Math.random() * 2600);
    };
    schedule();

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Network Activity
        </h2>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          Simulated
        </Badge>
      </div>

      <ul className="space-y-2" aria-live="polite">
        {feed.map((event) => (
          <li
            key={event.id}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 leading-snug">{event.text}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums">{event.at}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
