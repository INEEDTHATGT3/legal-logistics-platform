/**
 * Self-check for the demo state rules. Run with `pnpm check:demo`.
 *
 * Node executes this TypeScript directly (type stripping, Node 22.6+),
 * which is why the reducers import via relative `.ts` paths and only ever
 * use `import type` for anything behind the `@/` alias.
 */

import assert from "node:assert/strict";
import { createSeed } from "../lib/demo-data.ts";
import {
  reduceBookConsultation,
  reduceRequestDelivery,
  reduceSaveCaseNotes,
  reduceUpdateDeliveryStatus,
} from "../lib/demo-reducers.ts";

const HOUR = 60 * 60 * 1000;
const future = new Date(Date.now() + 48 * HOUR).toISOString();
const past = new Date(Date.now() - 48 * HOUR).toISOString();

// ── Booking ──────────────────────────────────────────────────────────

{
  const seed = createSeed(); // activePersona: "client"
  const { state, result } = reduceBookConsultation(seed, "lawyer-1", future);
  assert.equal(result.ok, true, "a client can book a future slot");
  assert.equal(
    state.consultations.length,
    seed.consultations.length + 1,
    "booking appends exactly one consultation"
  );
  assert.equal(
    seed.consultations.length,
    createSeed().consultations.length,
    "booking does not mutate the state it was handed"
  );
}

{
  const seed = createSeed();
  const { state, result } = reduceBookConsultation(seed, "lawyer-1", past);
  assert.equal(result.ok, false, "a slot in the past is rejected");
  assert.equal(state, seed, "a rejected booking leaves state untouched");
}

{
  const seed = createSeed();
  const { result } = reduceBookConsultation(seed, "lawyer-does-not-exist", future);
  assert.equal(result.ok, false, "booking an unlisted advocate is rejected");
}

// ── Delivery timeline ────────────────────────────────────────────────
// dlv-2001 is seeded at "ordered"; dlv-2003 at "delivered".

{
  const seed = { ...createSeed(), activePersona: "admin" as const };
  const { state, result } = reduceUpdateDeliveryStatus(seed, "dlv-2001", "picked_up");
  assert.equal(result.ok, true, "an admin can advance a delivery one stage");
  assert.equal(
    state.deliveries.find((d) => d.delivery_id === "dlv-2001")?.tracking_status,
    "picked_up"
  );
}

{
  const seed = { ...createSeed(), activePersona: "admin" as const };
  const { result } = reduceUpdateDeliveryStatus(seed, "dlv-2002", "ordered");
  assert.equal(result.ok, false, "a delivery cannot move backwards");
}

{
  const seed = { ...createSeed(), activePersona: "admin" as const };
  const { result } = reduceUpdateDeliveryStatus(seed, "dlv-2003", "delivered");
  assert.equal(result.ok, false, "a delivered parcel cannot advance again");
}

{
  const seed = createSeed(); // still the client persona
  const { result } = reduceUpdateDeliveryStatus(seed, "dlv-2001", "picked_up");
  assert.equal(result.ok, false, "a client cannot move a delivery");
}

// ── Delivery request ─────────────────────────────────────────────────

{
  const seed = createSeed();
  const form = (type: string | null, address: string | null) =>
    reduceRequestDelivery(seed, type, address).result.ok;

  assert.equal(form("Affidavit", "12 Demo Street"), true);
  assert.equal(form(null, "12 Demo Street"), false, "document type is required");
  assert.equal(form("Affidavit", "   "), false, "a blank address is rejected");
}

// ── Case notes ───────────────────────────────────────────────────────
// The lawyer persona is Adv. Meera Iyer (lawyer-3). cons-1002 belongs to
// lawyer-1, so it must stay out of reach.

{
  const seed = { ...createSeed(), activePersona: "lawyer" as const };

  const mine = reduceSaveCaseNotes(seed, "cons-1001", "Filed the reply.");
  assert.equal(mine.result.ok, true, "a lawyer can annotate their own consultation");
  assert.equal(
    mine.state.consultations.find((c) => c.consultation_id === "cons-1001")?.case_notes,
    "Filed the reply."
  );

  const theirs = reduceSaveCaseNotes(seed, "cons-1002", "Should not land.");
  assert.equal(
    theirs.result.ok,
    false,
    "a lawyer cannot annotate someone else's consultation"
  );
}

console.log("demo store checks passed");
