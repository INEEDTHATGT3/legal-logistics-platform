/**
 * Verifies the Supabase backend the app actually talks to.
 *
 *   pnpm verify:db              → schema + RLS checks (read-only, no writes)
 *   pnpm verify:db --mutations  → also exercises every write path
 *
 * The read-only pass answers "did supabase/schema.sql run?". The
 * --mutations pass creates two throwaway accounts and runs the real
 * booking / delivery / notes / tracking mutations end to end, including
 * the negative cases that prove RLS is doing its job.
 *
 * Admin checks need an existing admin login:
 *   VERIFY_ADMIN_EMAIL=... VERIFY_ADMIN_PASSWORD=... pnpm verify:db --mutations
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ── Setup ────────────────────────────────────────────────────────────

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) env[match[1]] = match[2].trim();
    }
  } catch {
    // Fall through to process.env.
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const runMutations = process.argv.includes("--mutations");

let passed = 0;
let failed = 0;

function report(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
  return ok;
}

function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── 1. Schema ────────────────────────────────────────────────────────
// Every column the app selects or writes, in the exact lower-case naming
// PostgREST exposes.

const EXPECTED_COLUMNS = {
  users: ["uid", "name", "email", "role"],
  lawyer_profiles: ["lawyer_id", "specialty", "hourly_rate"],
  consultations: [
    "consultation_id",
    "client_id",
    "lawyer_id",
    "status",
    "scheduled_at",
    "case_notes",
    "created_at",
  ],
  deliveries: [
    "delivery_id",
    "client_id",
    "document_type",
    "delivery_address",
    "tracking_status",
    "created_at",
  ],
};

async function checkSchema(supabase) {
  console.log("\nSchema");

  for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
    const { error } = await supabase.from(table).select(columns.join(",")).limit(1);
    report(`${table} (${columns.length} columns)`, !error, error?.message);
  }

  // The two-FK embeds the dashboards rely on. An unresolvable hint raises
  // PGRST200/PGRST201 even when the table is empty.
  const embeds = [
    ["lawyer_profiles → users", "lawyer_profiles", "*, user:lawyer_id(uid,name)"],
    ["consultations → lawyer", "consultations", "*, lawyer:lawyer_id(uid,name)"],
    ["consultations → client", "consultations", "*, client:client_id(uid,name)"],
    ["deliveries → client", "deliveries", "*, client:client_id(uid,name)"],
  ];

  for (const [name, table, select] of embeds) {
    const { error } = await supabase.from(table).select(select).limit(1);
    report(`embed ${name}`, !error, error?.message);
  }

  const { error: rpcError } = await supabase.rpc("is_admin");
  report("is_admin() helper exists", !rpcError, rpcError?.message);
}

// ── 2. RLS, unauthenticated ──────────────────────────────────────────

async function checkAnonRls(supabase) {
  console.log("\nRLS (signed out)");

  const { data: consultations } = await supabase.from("consultations").select("*");
  report("consultations hidden from anon", (consultations ?? []).length === 0);

  const { data: deliveries } = await supabase.from("deliveries").select("*");
  report("deliveries hidden from anon", (deliveries ?? []).length === 0);

  const { error: insertError } = await supabase
    .from("deliveries")
    .insert({ client_id: crypto.randomUUID(), document_type: "Affidavit", delivery_address: "x" });
  report("anon cannot insert a delivery", Boolean(insertError), insertError ? "" : "insert succeeded");
}

// ── 3. Mutations ─────────────────────────────────────────────────────

async function signUpTestUser(role, extra = {}) {
  const supabase = anonClient();
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `verify-${role}-${stamp}@example.com`;
  const password = `Verify!${stamp}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: `Verify ${role}`, role, ...extra } },
  });

  if (error) return { error: error.message };
  if (!data.session) {
    return { error: "no session returned — disable 'Confirm email' in Auth settings to run mutation checks" };
  }

  return { supabase, user: data.user, email, password };
}

async function checkMutations() {
  console.log("\nMutations");

  const client = await signUpTestUser("client");
  if (!report("sign up a client", !client.error, client.error)) return null;

  const lawyer = await signUpTestUser("lawyer", {
    specialty: "Corporate Law",
    hourly_rate: "2500",
  });
  if (!report("sign up a lawyer", !lawyer.error, lawyer.error)) return null;

  // The trigger should have mirrored both into public.users and given the
  // lawyer a directory profile.
  const { data: profile, error: profileError } = await lawyer.supabase
    .from("lawyer_profiles")
    .select("lawyer_id, specialty, hourly_rate")
    .eq("lawyer_id", lawyer.user.id)
    .maybeSingle();
  report("trigger created lawyer_profiles row", Boolean(profile), profileError?.message ?? "no row");

  const { data: roleRow } = await lawyer.supabase
    .from("users")
    .select("role")
    .eq("uid", lawyer.user.id)
    .maybeSingle();
  report("trigger set role=lawyer", roleRow?.role === "lawyer", `got ${roleRow?.role}`);

  // Nobody may make themselves an admin at sign-up.
  const impostor = await signUpTestUser("admin");
  if (!impostor.error) {
    const { data: impostorRow } = await impostor.supabase
      .from("users")
      .select("role")
      .eq("uid", impostor.user.id)
      .maybeSingle();
    report(
      "role=admin at sign-up is downgraded to client",
      impostorRow?.role === "client",
      `got ${impostorRow?.role}`
    );
  }

  // ── Client writes ──
  const slot = new Date(Date.now() + 86_400_000).toISOString();
  const { data: booking, error: bookingError } = await client.supabase
    .from("consultations")
    .insert({
      client_id: client.user.id,
      lawyer_id: lawyer.user.id,
      status: "scheduled",
      scheduled_at: slot,
    })
    .select("consultation_id")
    .single();
  report("client books a consultation", Boolean(booking), bookingError?.message);

  const { data: delivery, error: deliveryError } = await client.supabase
    .from("deliveries")
    .insert({
      client_id: client.user.id,
      document_type: "Affidavit",
      delivery_address: "12 Residency Road, Bengaluru 560025",
      tracking_status: "ordered",
    })
    .select("delivery_id, delivery_address")
    .single();
  report("client requests a delivery", Boolean(delivery), deliveryError?.message);
  if (delivery) {
    report(
      "delivery address is persisted",
      delivery.delivery_address.includes("Residency Road"),
      delivery.delivery_address
    );
  }

  // ── Lawyer writes ──
  if (booking) {
    const { data: noted, error: notesError } = await lawyer.supabase
      .from("consultations")
      .update({ case_notes: "Reviewed the FIR copy. Anticipatory bail next." })
      .eq("consultation_id", booking.consultation_id)
      .eq("lawyer_id", lawyer.user.id)
      .select("case_notes");
    report("lawyer saves case notes", noted?.length === 1, notesError?.message ?? "0 rows");

    const { data: closed, error: statusError } = await lawyer.supabase
      .from("consultations")
      .update({ status: "completed" })
      .eq("consultation_id", booking.consultation_id)
      .eq("lawyer_id", lawyer.user.id)
      .select("status");
    report("lawyer marks it completed", closed?.length === 1, statusError?.message ?? "0 rows");

    // A client must never be able to edit their own consultation record.
    const { data: tampered } = await client.supabase
      .from("consultations")
      .update({ status: "scheduled" })
      .eq("consultation_id", booking.consultation_id)
      .select("consultation_id");
    report("client cannot rewrite consultation status", (tampered ?? []).length === 0);
  }

  const { data: rated, error: rateError } = await lawyer.supabase
    .from("lawyer_profiles")
    .update({ hourly_rate: 3200 })
    .eq("lawyer_id", lawyer.user.id)
    .select("hourly_rate");
  report("lawyer updates hourly rate", rated?.[0]?.hourly_rate == 3200, rateError?.message ?? "0 rows");

  // ── Negative: cross-tenant reads and admin-only writes ──
  const otherClient = await signUpTestUser("client");
  if (!otherClient.error && delivery) {
    const { data: peeked } = await otherClient.supabase
      .from("deliveries")
      .select("delivery_id")
      .eq("delivery_id", delivery.delivery_id);
    report("another client cannot see the delivery", (peeked ?? []).length === 0);

    const { data: moved } = await otherClient.supabase
      .from("deliveries")
      .update({ tracking_status: "delivered" })
      .eq("delivery_id", delivery.delivery_id)
      .select("delivery_id");
    report("non-admin cannot move a delivery", (moved ?? []).length === 0);
  }

  return delivery;
}

async function checkAdmin(delivery) {
  const email = env.VERIFY_ADMIN_EMAIL;
  const password = env.VERIFY_ADMIN_PASSWORD;

  console.log("\nAdmin");
  if (!email || !password) {
    console.log("  SKIP  set VERIFY_ADMIN_EMAIL / VERIFY_ADMIN_PASSWORD to check the control panel");
    return;
  }

  const supabase = anonClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (!report("admin signs in", !signInError, signInError?.message)) return;

  const { data: isAdmin } = await supabase.rpc("is_admin");
  report("account has the admin role", isAdmin === true, `is_admin() = ${isAdmin}`);

  const { data: all, error: listError } = await supabase
    .from("deliveries")
    .select("delivery_id, client:client_id(name)");
  report("admin reads every delivery", !listError && Array.isArray(all), listError?.message);

  if (delivery) {
    const { data: moved, error: moveError } = await supabase
      .from("deliveries")
      .update({ tracking_status: "in_transit" })
      .eq("delivery_id", delivery.delivery_id)
      .select("tracking_status");
    report(
      "admin moves a delivery to in_transit",
      moved?.[0]?.tracking_status === "in_transit",
      moveError?.message ?? "0 rows"
    );
  }
}

// ── Run ──────────────────────────────────────────────────────────────

console.log(`Verifying ${SUPABASE_URL}`);

const supabase = anonClient();
await checkSchema(supabase);
await checkAnonRls(supabase);

if (runMutations) {
  const delivery = await checkMutations();
  await checkAdmin(delivery);
} else {
  console.log("\nMutations\n  SKIP  pass --mutations to exercise the write paths");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
