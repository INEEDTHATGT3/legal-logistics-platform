/**
 * Seeded scenario for the presentation build. Everything here is
 * synthetic — no real people, addresses, or case material.
 *
 * Shapes reuse the canonical table types in `lib/types.ts`, so the
 * dashboard views consume demo rows exactly as they consumed database
 * rows. `lib/demo-store.ts` holds the mutable copy of this state.
 */

import type {
  Consultation,
  Delivery,
  LawyerProfile,
  User,
  UserRole,
} from "@/lib/types";

export interface DemoState {
  /** Which persona the presenter is currently driving. */
  activePersona: UserRole;
  /** How far through the guided walkthrough the presenter is. */
  tourStep: number;
  users: User[];
  lawyerProfiles: LawyerProfile[];
  consultations: Consultation[];
  deliveries: Delivery[];
}

/**
 * Headline numbers for the pitch. Illustrative figures for a network of
 * this shape — not measured results, and labelled as such wherever they
 * are shown.
 */
export const DEMO_TRACTION = [
  { label: "Consultations booked", value: "1,284", delta: "+18% MoM" },
  { label: "Documents moved", value: "3,610", delta: "+24% MoM" },
  { label: "Cities live", value: "14", delta: "+3 this quarter" },
  { label: "Median pickup to delivery", value: "31 hrs", delta: "−6 hrs MoM" },
] as const;

/** Cities the simulated network ticker draws from. */
export const DEMO_CITIES = [
  "Bengaluru",
  "Mumbai",
  "Pune",
  "Kochi",
  "Hyderabad",
  "Gurugram",
  "Chennai",
  "Jaipur",
  "Kolkata",
  "Ahmedabad",
] as const;

/** The persona cards on the entry screen, and the topbar switcher. */
export const DEMO_PERSONAS: Record<
  UserRole,
  { label: string; summary: string; uid: string }
> = {
  client: {
    label: "Aarav Sharma",
    summary:
      "Find an advocate, book advice, and follow a document across the city.",
    uid: "client-1",
  },
  lawyer: {
    label: "Adv. Meera Iyer",
    summary:
      "Run the day of consultations, keep private case notes, set your rate.",
    uid: "lawyer-3",
  },
  admin: {
    label: "NyaySetu Operations",
    summary: "Watch every delivery in the network and move it down the line.",
    uid: "admin-1",
  },
};

// ── Time helpers ─────────────────────────────────────────────────────
// Slots are stored relative to load time so the schedule never looks
// stale during a demo, however long after the build it is presented.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function fromNow(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

// ── People ───────────────────────────────────────────────────────────

const users: User[] = [
  { uid: "client-1", name: "Aarav Sharma", email: "aarav.sharma@demo.nyaysetu.in", role: "client" },
  { uid: "client-2", name: "Priya Nair", email: "priya.nair@demo.nyaysetu.in", role: "client" },
  { uid: "client-3", name: "Rohit Bansal", email: "rohit.bansal@demo.nyaysetu.in", role: "client" },
  { uid: "lawyer-1", name: "Adv. Rhea Kapoor", email: "rhea.kapoor@demo.nyaysetu.in", role: "lawyer" },
  { uid: "lawyer-2", name: "Adv. Vikram Sethi", email: "vikram.sethi@demo.nyaysetu.in", role: "lawyer" },
  { uid: "lawyer-3", name: "Adv. Meera Iyer", email: "meera.iyer@demo.nyaysetu.in", role: "lawyer" },
  { uid: "lawyer-4", name: "Adv. Imran Qureshi", email: "imran.qureshi@demo.nyaysetu.in", role: "lawyer" },
  { uid: "lawyer-5", name: "Adv. Ananya Deshmukh", email: "ananya.deshmukh@demo.nyaysetu.in", role: "lawyer" },
  { uid: "lawyer-6", name: "Adv. Karthik Raman", email: "karthik.raman@demo.nyaysetu.in", role: "lawyer" },
  { uid: "lawyer-7", name: "Adv. Sana Fernandes", email: "sana.fernandes@demo.nyaysetu.in", role: "lawyer" },
  { uid: "admin-1", name: "NyaySetu Operations", email: "ops@demo.nyaysetu.in", role: "admin" },
];

// Specialties are drawn from LEGAL_SPECIALTIES so the directory filter
// has something to match against on nearly every option.
const lawyerProfiles: LawyerProfile[] = [
  { lawyer_id: "lawyer-1", specialty: "Corporate Law", hourly_rate: 6500 },
  { lawyer_id: "lawyer-2", specialty: "Family Law", hourly_rate: 3600 },
  { lawyer_id: "lawyer-3", specialty: "Property & Real Estate", hourly_rate: 4800 },
  { lawyer_id: "lawyer-4", specialty: "Criminal Defence", hourly_rate: 5200 },
  { lawyer_id: "lawyer-5", specialty: "Intellectual Property", hourly_rate: 7100 },
  { lawyer_id: "lawyer-6", specialty: "Taxation", hourly_rate: 4400 },
  { lawyer_id: "lawyer-7", specialty: "Labour & Employment", hourly_rate: 3200 },
];

// ── Consultations ────────────────────────────────────────────────────
// Mixed statuses so both dashboards open onto a populated schedule.

const consultations: Consultation[] = [
  {
    consultation_id: "cons-1001",
    client_id: "client-1",
    lawyer_id: "lawyer-3",
    status: "scheduled",
    scheduled_at: fromNow(6 * HOUR),
    case_notes: null,
    created_at: fromNow(-2 * DAY),
  },
  {
    consultation_id: "cons-1002",
    client_id: "client-1",
    lawyer_id: "lawyer-1",
    status: "scheduled",
    scheduled_at: fromNow(2 * DAY + 3 * HOUR),
    case_notes: null,
    created_at: fromNow(-1 * DAY),
  },
  {
    consultation_id: "cons-1003",
    client_id: "client-1",
    lawyer_id: "lawyer-6",
    status: "completed",
    scheduled_at: fromNow(-5 * DAY),
    case_notes:
      "Reviewed the assessment notice. Advised filing a rectification request before the 30-day window closes. Client to send the Form 26AS extract.",
    created_at: fromNow(-9 * DAY),
  },
  {
    consultation_id: "cons-1004",
    client_id: "client-2",
    lawyer_id: "lawyer-3",
    status: "scheduled",
    scheduled_at: fromNow(28 * HOUR),
    case_notes: null,
    created_at: fromNow(-3 * DAY),
  },
  {
    consultation_id: "cons-1005",
    client_id: "client-3",
    lawyer_id: "lawyer-3",
    status: "completed",
    scheduled_at: fromNow(-2 * DAY),
    case_notes:
      "Title chain traced back to 1998. One gap at the 2011 transfer — asked the client to obtain a certified copy of the sale deed from the sub-registrar.",
    created_at: fromNow(-6 * DAY),
  },
  {
    consultation_id: "cons-1006",
    client_id: "client-2",
    lawyer_id: "lawyer-5",
    status: "scheduled",
    scheduled_at: fromNow(4 * DAY),
    case_notes: null,
    created_at: fromNow(-1 * DAY),
  },
];

// ── Deliveries ───────────────────────────────────────────────────────
// One sitting at each tracking stage, so the admin board and the client
// timeline both demo without anyone having to create a row first.

const deliveries: Delivery[] = [
  {
    delivery_id: "dlv-2001",
    client_id: "client-1",
    document_type: "Vakalatnama",
    delivery_address:
      "Flat 402, Sunrise Residency, Koramangala 6th Block, Bengaluru 560095",
    tracking_status: "ordered",
    created_at: fromNow(-4 * HOUR),
  },
  {
    delivery_id: "dlv-2002",
    client_id: "client-1",
    document_type: "Property Deed",
    delivery_address: "18 Chambers Lane, Fort, Mumbai 400001",
    tracking_status: "in_transit",
    created_at: fromNow(-2 * DAY),
  },
  {
    delivery_id: "dlv-2003",
    client_id: "client-1",
    document_type: "Affidavit",
    delivery_address: "C-7 Greenwood Enclave, Sector 45, Gurugram 122003",
    tracking_status: "delivered",
    created_at: fromNow(-8 * DAY),
  },
  {
    delivery_id: "dlv-2004",
    client_id: "client-2",
    document_type: "Court Notice",
    delivery_address: "221 Marine Drive, Ernakulam, Kochi 682031",
    tracking_status: "picked_up",
    created_at: fromNow(-1 * DAY),
  },
  {
    delivery_id: "dlv-2005",
    client_id: "client-3",
    document_type: "Bail Application",
    delivery_address: "9 Rajpur Road, Civil Lines, Dehradun 248001",
    tracking_status: "in_transit",
    created_at: fromNow(-3 * DAY),
  },
  {
    delivery_id: "dlv-2006",
    client_id: "client-2",
    document_type: "Power of Attorney",
    delivery_address: "77 Park Street, Kolkata 700016",
    tracking_status: "delivered",
    created_at: fromNow(-11 * DAY),
  },
];

/**
 * A fresh copy of the scenario. Returns new arrays every call so a
 * mutation on the live store can never write back into the seed — that
 * is what makes `Reset Demo` reliable between presentations.
 */
export function createSeed(): DemoState {
  return {
    activePersona: "client",
    tourStep: 0,
    users: users.map((user) => ({ ...user })),
    lawyerProfiles: lawyerProfiles.map((profile) => ({ ...profile })),
    consultations: consultations.map((consultation) => ({ ...consultation })),
    deliveries: deliveries.map((delivery) => ({ ...delivery })),
  };
}
