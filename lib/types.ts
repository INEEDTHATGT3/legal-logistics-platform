// ── Role Enum ────────────────────────────────────────────────────────
export type UserRole = "client" | "lawyer" | "admin";

// ── Users Table ──────────────────────────────────────────────────────
export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

// ── Lawyer_Profiles Table ────────────────────────────────────────────
export interface LawyerProfile {
  lawyer_id: string; // FK -> users.uid
  specialty: string;
  hourly_rate: number; // INR ₹
}

// ── Consultations Table ──────────────────────────────────────────────
export type ConsultationStatus = "scheduled" | "completed";

export interface Consultation {
  consultation_id: string;
  client_id: string;
  lawyer_id: string;
  status: ConsultationStatus;
  scheduled_at: string; // ISO timestamp
  case_notes: string | null;
  created_at: string;
}

// ── Deliveries Table ─────────────────────────────────────────────────
export type DeliveryTrackingStatus =
  | "ordered"
  | "picked_up"
  | "in_transit"
  | "delivered";

export interface Delivery {
  delivery_id: string;
  client_id: string;
  document_type: string;
  delivery_address: string;
  tracking_status: DeliveryTrackingStatus;
  created_at: string;
}

// ── Joined shapes ────────────────────────────────────────────────────
// PostgREST embeds the related row under the alias used in `.select()`.
// These name the results so the views never need `any`.

/** A lawyer_profiles row with its users row embedded (lawyer directory). */
export type LawyerWithUser = LawyerProfile & { user: User | null };

/** A consultation with the lawyer's user row (client dashboard). */
export type ConsultationWithLawyer = Consultation & { lawyer: User | null };

/** A consultation with the client's user row (lawyer dashboard). */
export type ConsultationWithClient = Consultation & { client: User | null };

/** A delivery with the requesting client's user row (admin panel). */
export type DeliveryWithClient = Delivery & { client: User | null };

// ── Server action results ────────────────────────────────────────────
// Actions return this instead of throwing, so a failed mutation renders
// an inline message rather than Next's error overlay.
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

// ── Display helpers ──────────────────────────────────────────────────
export const DELIVERY_STEPS: DeliveryTrackingStatus[] = [
  "ordered",
  "picked_up",
  "in_transit",
  "delivered",
];

export const DELIVERY_STATUS_LABELS: Record<DeliveryTrackingStatus, string> = {
  ordered: "Ordered",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
};

export const DOCUMENT_TYPES = [
  "Affidavit",
  "Power of Attorney",
  "Court Notice",
  "Bail Application",
  "Property Deed",
  "Vakalatnama",
] as const;

export const LEGAL_SPECIALTIES = [
  "Family Law",
  "Corporate Law",
  "Criminal Defence",
  "Property & Real Estate",
  "Taxation",
  "Labour & Employment",
  "Intellectual Property",
  "General Practice",
] as const;
