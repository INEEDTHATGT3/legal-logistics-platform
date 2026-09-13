/**
 * Pure state transitions for the demo. Ported from the old Supabase
 * server actions in `app/actions.ts` — same validation, same
 * `ActionResult` contract, same role guards. Only the persistence layer
 * changed, so the dashboard views did not have to.
 *
 * Everything here is a pure function of `(state, args) -> Outcome`, which
 * is what lets `scripts/check-demo-store.ts` exercise the rules without a
 * browser or a React tree.
 *
 * Imports use explicit relative `.ts` paths (not the `@/` alias) so this
 * module runs directly under Node's type stripping.
 */

import { DELIVERY_STEPS } from "./types.ts";
import type {
  ActionResult,
  ConsultationStatus,
  DeliveryTrackingStatus,
} from "./types.ts";
import { DEMO_PERSONAS } from "./demo-data.ts";
import type { DemoState } from "./demo-data.ts";

export interface Outcome {
  /** The state to commit. Unchanged (same reference) when `result.ok` is false. */
  state: DemoState;
  result: ActionResult;
}

/** A rejected transition leaves state untouched. */
function reject(state: DemoState, error: string): Outcome {
  return { state, result: { ok: false, error } };
}

/** The user row the active persona is driving as. */
export function actingUser(state: DemoState) {
  const uid = DEMO_PERSONAS[state.activePersona].uid;
  return state.users.find((user) => user.uid === uid) ?? null;
}

/** Short, collision-resistant enough for a single browser session. */
function demoId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ── Client transitions ───────────────────────────────────────────────

export function reduceRequestDelivery(
  state: DemoState,
  documentType: string | null,
  address: string | null
): Outcome {
  if (state.activePersona !== "client") {
    return reject(state, "Only clients can request a delivery.");
  }

  const trimmedType = documentType?.trim();
  const trimmedAddress = address?.trim();

  if (!trimmedType) return reject(state, "Select a document type.");
  if (!trimmedAddress) return reject(state, "Enter a delivery address.");

  const actor = actingUser(state);
  if (!actor) return reject(state, "No active demo persona.");

  return {
    state: {
      ...state,
      deliveries: [
        {
          delivery_id: demoId("dlv"),
          client_id: actor.uid,
          document_type: trimmedType,
          delivery_address: trimmedAddress,
          tracking_status: "ordered",
          created_at: new Date().toISOString(),
        },
        ...state.deliveries,
      ],
    },
    result: { ok: true },
  };
}

export function reduceBookConsultation(
  state: DemoState,
  lawyerId: string | null,
  scheduledAt: string | null
): Outcome {
  if (state.activePersona !== "client") {
    return reject(state, "Only clients can book a consultation.");
  }
  if (!lawyerId) return reject(state, "Pick a lawyer to book.");
  if (!scheduledAt) return reject(state, "Pick a date and time.");

  const slot = new Date(scheduledAt);
  if (Number.isNaN(slot.getTime())) {
    return reject(state, "That date and time could not be read.");
  }
  if (slot.getTime() < Date.now()) {
    return reject(state, "Pick a slot in the future.");
  }
  if (!state.lawyerProfiles.some((profile) => profile.lawyer_id === lawyerId)) {
    return reject(state, "That advocate is no longer listed.");
  }

  const actor = actingUser(state);
  if (!actor) return reject(state, "No active demo persona.");

  return {
    state: {
      ...state,
      consultations: [
        ...state.consultations,
        {
          consultation_id: demoId("cons"),
          client_id: actor.uid,
          lawyer_id: lawyerId,
          status: "scheduled",
          scheduled_at: slot.toISOString(),
          case_notes: null,
          created_at: new Date().toISOString(),
        },
      ],
    },
    result: { ok: true },
  };
}

// ── Lawyer transitions ───────────────────────────────────────────────

export function reduceUpdateHourlyRate(
  state: DemoState,
  rawRate: unknown
): Outcome {
  if (state.activePersona !== "lawyer") {
    return reject(state, "Only lawyers can set an hourly rate.");
  }

  const rate = Number(rawRate);
  if (!Number.isFinite(rate) || rate < 0) {
    return reject(state, "Enter a rate of ₹0 or more.");
  }

  const actor = actingUser(state);
  if (!actor) return reject(state, "No active demo persona.");

  let matched = false;
  const lawyerProfiles = state.lawyerProfiles.map((profile) => {
    if (profile.lawyer_id !== actor.uid) return profile;
    matched = true;
    return { ...profile, hourly_rate: rate };
  });

  if (!matched) return reject(state, "No lawyer profile found for this persona.");

  return { state: { ...state, lawyerProfiles }, result: { ok: true } };
}

export function reduceUpdateSpecialty(
  state: DemoState,
  specialty: string | null
): Outcome {
  if (state.activePersona !== "lawyer") {
    return reject(state, "Only lawyers can set a specialty.");
  }

  const trimmed = specialty?.trim();
  if (!trimmed) return reject(state, "Select a specialty.");

  const actor = actingUser(state);
  if (!actor) return reject(state, "No active demo persona.");

  let matched = false;
  const lawyerProfiles = state.lawyerProfiles.map((profile) => {
    if (profile.lawyer_id !== actor.uid) return profile;
    matched = true;
    return { ...profile, specialty: trimmed };
  });

  if (!matched) return reject(state, "No lawyer profile found for this persona.");

  return { state: { ...state, lawyerProfiles }, result: { ok: true } };
}

export function reduceSaveCaseNotes(
  state: DemoState,
  consultationId: string,
  notes: string
): Outcome {
  if (state.activePersona !== "lawyer") {
    return reject(state, "Only the assigned lawyer can edit case notes.");
  }

  const actor = actingUser(state);
  if (!actor) return reject(state, "No active demo persona.");

  // Mirrors the old RLS policy: a lawyer can only write onto their own
  // consultations, never someone else's.
  let matched = false;
  const consultations = state.consultations.map((consultation) => {
    if (
      consultation.consultation_id !== consultationId ||
      consultation.lawyer_id !== actor.uid
    ) {
      return consultation;
    }
    matched = true;
    return { ...consultation, case_notes: notes };
  });

  if (!matched) return reject(state, "That consultation is not assigned to you.");

  return { state: { ...state, consultations }, result: { ok: true } };
}

export function reduceUpdateConsultationStatus(
  state: DemoState,
  consultationId: string,
  status: ConsultationStatus
): Outcome {
  if (state.activePersona !== "lawyer") {
    return reject(state, "Only the assigned lawyer can change a status.");
  }
  if (status !== "scheduled" && status !== "completed") {
    return reject(state, "Unknown consultation status.");
  }

  const actor = actingUser(state);
  if (!actor) return reject(state, "No active demo persona.");

  let matched = false;
  const consultations = state.consultations.map((consultation) => {
    if (
      consultation.consultation_id !== consultationId ||
      consultation.lawyer_id !== actor.uid
    ) {
      return consultation;
    }
    matched = true;
    return { ...consultation, status };
  });

  if (!matched) return reject(state, "That consultation is not assigned to you.");

  return { state: { ...state, consultations }, result: { ok: true } };
}

// ── Admin transitions ────────────────────────────────────────────────

export function reduceUpdateDeliveryStatus(
  state: DemoState,
  deliveryId: string,
  status: DeliveryTrackingStatus
): Outcome {
  if (state.activePersona !== "admin") {
    return reject(state, "Only an admin can move a delivery.");
  }
  if (!DELIVERY_STEPS.includes(status)) {
    return reject(state, "Unknown tracking status.");
  }

  const current = state.deliveries.find(
    (delivery) => delivery.delivery_id === deliveryId
  );
  if (!current) return reject(state, "That delivery no longer exists.");

  // Deliveries only ever move forward. Without this a double-click on
  // Advance at the last stage would wrap the timeline back to Ordered.
  if (
    DELIVERY_STEPS.indexOf(status) <= DELIVERY_STEPS.indexOf(current.tracking_status)
  ) {
    return reject(state, "A delivery can only move forward down the timeline.");
  }

  return {
    state: {
      ...state,
      deliveries: state.deliveries.map((delivery) =>
        delivery.delivery_id === deliveryId
          ? { ...delivery, tracking_status: status }
          : delivery
      ),
    },
    result: { ok: true },
  };
}
