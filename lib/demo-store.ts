"use client";

/**
 * The demo's stand-in for the database. A single module-level state
 * object, mirrored into `localStorage`, read by components through
 * `useSyncExternalStore`.
 *
 * The exported mutations keep the exact signatures the old server
 * actions had (`FormData` in, `ActionResult` out, async), so the
 * dashboard views call them from `useTransition` unchanged — only their
 * import path moved from `@/app/actions` to here.
 *
 * Rules live in `lib/demo-reducers.ts`; this file is plumbing.
 */

import { useSyncExternalStore } from "react";
import { createSeed, DEMO_PERSONAS, type DemoState } from "@/lib/demo-data";
import { readStoredTheme, storeTheme, type Theme } from "@/lib/theme";
import {
  reduceBookConsultation,
  reduceRequestDelivery,
  reduceSaveCaseNotes,
  reduceUpdateConsultationStatus,
  reduceUpdateDeliveryStatus,
  reduceUpdateHourlyRate,
  reduceUpdateSpecialty,
  type Outcome,
} from "@/lib/demo-reducers";
import type {
  ActionResult,
  ConsultationStatus,
  ConsultationWithClient,
  ConsultationWithLawyer,
  Delivery,
  DeliveryTrackingStatus,
  DeliveryWithClient,
  LawyerProfile,
  LawyerWithUser,
  User,
  UserRole,
} from "@/lib/types";

const STORAGE_KEY = "nyaysetu-demo-v1";

// ── Store ────────────────────────────────────────────────────────────

/**
 * The snapshot rendered during static export and during the first client
 * render. Both must be the same object or React reports a hydration
 * mismatch, so saved state is only merged in afterwards, by
 * `hydrateDemoStore`.
 */
const serverSnapshot: DemoState = createSeed();

let state: DemoState = serverSnapshot;

/**
 * False until the store has been hydrated in the browser.
 *
 * Two things force this gate. The seed dates are relative to `Date.now()`,
 * which differs between the build machine and the viewer's browser; and
 * `localStorage` cannot be read during render. Both are solved by having
 * dashboards render a skeleton until mount, so the exported HTML and the
 * first client render agree exactly.
 */
let ready = false;

/**
 * The theme is external state too: it lives on the `<html>` class and in
 * localStorage, and the inline script in the root layout has already
 * applied it by the time React mounts. Keeping it here rather than in
 * component state means no effect has to push it back into React.
 */
let theme: Theme = "light";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): DemoState {
  return state;
}

function getServerSnapshot(): DemoState {
  return serverSnapshot;
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing, disabled storage, quota. The demo still works
    // for this session; it just will not survive a refresh.
  }
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function commit(next: DemoState): void {
  state = next;
  persist();
  notify();
}

function readStored(): DemoState | null {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<DemoState>;
    // A seed shape change between demo builds would otherwise surface as
    // a blank dashboard; fall back to the fresh scenario instead.
    if (
      !parsed ||
      !Array.isArray(parsed.users) ||
      !Array.isArray(parsed.lawyerProfiles) ||
      !Array.isArray(parsed.consultations) ||
      !Array.isArray(parsed.deliveries) ||
      !parsed.activePersona
    ) {
      return null;
    }
    return parsed as DemoState;
  } catch {
    // Corrupt payload — keep the seed.
    return null;
  }
}

/**
 * Loads any saved state and opens the gate. Called once from the
 * dashboard layout after mount — never during render.
 */
export function hydrateDemoStore(): void {
  if (ready) return;
  ready = true;

  theme = readStoredTheme();

  const stored = readStored();
  if (stored) {
    state = stored;
  } else {
    // Re-seed so the relative dates are anchored to the viewer's clock
    // rather than to whenever this bundle was built.
    state = createSeed();
  }

  notify();
}

/** Runs a reducer against live state and commits it when it succeeded. */
function dispatch(reducer: (current: DemoState) => Outcome): ActionResult {
  const { state: next, result } = reducer(state);
  if (result.ok) commit(next);
  return result;
}

// ── Demo controls ────────────────────────────────────────────────────

export function selectPersona(persona: UserRole): void {
  commit({ ...state, activePersona: persona });
}

/**
 * Moves the guided walkthrough. Callers clamp to their own step count;
 * a negative step is the dismissed state, so this must not clamp at zero.
 */
export function setTourStep(step: number): void {
  commit({ ...state, tourStep: step });
}

export function toggleTheme(): void {
  theme = theme === "light" ? "dark" : "light";
  document.documentElement.classList.toggle("dark", theme === "dark");
  storeTheme(theme);
  notify();
}

/** Restores the seeded scenario — the between-presentations reset. */
export function resetDemo(): void {
  commit(createSeed());
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

// ── Mutations (same signatures the server actions had) ───────────────

export async function requestDelivery(formData: FormData): Promise<ActionResult> {
  return dispatch((current) =>
    reduceRequestDelivery(
      current,
      formData.get("documentType") as string | null,
      formData.get("address") as string | null
    )
  );
}

export async function bookConsultation(formData: FormData): Promise<ActionResult> {
  return dispatch((current) =>
    reduceBookConsultation(
      current,
      formData.get("lawyerId") as string | null,
      formData.get("scheduledAt") as string | null
    )
  );
}

export async function updateHourlyRate(formData: FormData): Promise<ActionResult> {
  return dispatch((current) => reduceUpdateHourlyRate(current, formData.get("rate")));
}

export async function updateSpecialty(formData: FormData): Promise<ActionResult> {
  return dispatch((current) =>
    reduceUpdateSpecialty(current, formData.get("specialty") as string | null)
  );
}

export async function saveCaseNotes(
  consultationId: string,
  notes: string
): Promise<ActionResult> {
  return dispatch((current) => reduceSaveCaseNotes(current, consultationId, notes));
}

export async function updateConsultationStatus(
  consultationId: string,
  status: ConsultationStatus
): Promise<ActionResult> {
  return dispatch((current) =>
    reduceUpdateConsultationStatus(current, consultationId, status)
  );
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryTrackingStatus
): Promise<ActionResult> {
  return dispatch((current) => reduceUpdateDeliveryStatus(current, deliveryId, status));
}

// ── Hooks ────────────────────────────────────────────────────────────

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * False while rendering the exported HTML and on the first client
 * render; true once `hydrateDemoStore` has run. Dashboards show a
 * skeleton until it flips.
 */
export function useDemoReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false
  );
}

const noopSubscribe = () => () => {};

/**
 * False in the exported HTML and on the first client render, true after.
 * Lets a component that depends on the browser (stored state, timers)
 * render nothing until hydration is done, without an effect that would
 * set state during commit.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/** Matches the exported HTML on first render; the toggle updates it after. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => theme,
    () => "light" as Theme
  );
}

/**
 * The user row behind a persona. Takes the role rather than reading
 * `activePersona` so a cold load of `/dashboard/admin/` shows the admin
 * immediately, instead of the default persona for one frame while the
 * route-sync effect catches up.
 */
export function useDemoUser(role: UserRole): User {
  const demo = useDemoState();
  const uid = DEMO_PERSONAS[role].uid;
  return (
    demo.users.find((user) => user.uid === uid) ?? {
      uid,
      name: DEMO_PERSONAS[role].label,
      email: "demo@nyaysetu.in",
      role,
    }
  );
}

// ── Selectors ────────────────────────────────────────────────────────
// These rebuild the shapes PostgREST used to return from its embedded
// selects, so the views keep their existing prop types.

function userOf(demo: DemoState, uid: string): User | null {
  return demo.users.find((user) => user.uid === uid) ?? null;
}

export function selectLawyerDirectory(demo: DemoState): LawyerWithUser[] {
  return [...demo.lawyerProfiles]
    .sort((a, b) => a.hourly_rate - b.hourly_rate)
    .map((profile) => ({ ...profile, user: userOf(demo, profile.lawyer_id) }));
}

export function selectClientConsultations(
  demo: DemoState,
  clientId: string
): ConsultationWithLawyer[] {
  return demo.consultations
    .filter((consultation) => consultation.client_id === clientId)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map((consultation) => ({
      ...consultation,
      lawyer: userOf(demo, consultation.lawyer_id),
    }));
}

export function selectClientDeliveries(demo: DemoState, clientId: string): Delivery[] {
  return demo.deliveries
    .filter((delivery) => delivery.client_id === clientId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function selectLawyerConsultations(
  demo: DemoState,
  lawyerId: string
): ConsultationWithClient[] {
  return demo.consultations
    .filter((consultation) => consultation.lawyer_id === lawyerId)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map((consultation) => ({
      ...consultation,
      client: userOf(demo, consultation.client_id),
    }));
}

export function selectLawyerProfile(
  demo: DemoState,
  lawyerId: string
): LawyerProfile | null {
  return demo.lawyerProfiles.find((profile) => profile.lawyer_id === lawyerId) ?? null;
}

export function selectAllDeliveries(demo: DemoState): DeliveryWithClient[] {
  return [...demo.deliveries]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((delivery) => ({ ...delivery, client: userOf(demo, delivery.client_id) }));
}
