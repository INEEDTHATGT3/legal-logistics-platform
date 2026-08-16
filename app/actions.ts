"use server";

import { revalidatePath } from "next/cache";
import { getActionContext } from "@/lib/auth";
import type {
  ActionResult,
  ConsultationStatus,
  DeliveryTrackingStatus,
} from "@/lib/types";
import { DELIVERY_STEPS } from "@/lib/types";

/**
 * Every action below returns an ActionResult instead of throwing, so a
 * rejected mutation (RLS denial, network blip) shows up as an inline
 * message in the form rather than Next's full-screen error overlay.
 */
function failure(error: unknown): ActionResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong.",
  };
}

// ── Client Actions ───────────────────────────────────────────────────

export async function requestDelivery(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await getActionContext();

    if (user.role !== "client") {
      return { ok: false, error: "Only clients can request a delivery." };
    }

    const documentType = (formData.get("documentType") as string | null)?.trim();
    const address = (formData.get("address") as string | null)?.trim();

    if (!documentType) return { ok: false, error: "Select a document type." };
    if (!address) return { ok: false, error: "Enter a delivery address." };

    const { error } = await supabase.from("deliveries").insert({
      client_id: user.uid,
      document_type: documentType,
      delivery_address: address,
      tracking_status: "ordered",
    });

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/client");
    revalidatePath("/dashboard/admin");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function bookConsultation(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await getActionContext();

    if (user.role !== "client") {
      return { ok: false, error: "Only clients can book a consultation." };
    }

    const lawyerId = formData.get("lawyerId") as string | null;
    const scheduledAt = formData.get("scheduledAt") as string | null;

    if (!lawyerId) return { ok: false, error: "Pick a lawyer to book." };
    if (!scheduledAt) return { ok: false, error: "Pick a date and time." };

    const slot = new Date(scheduledAt);
    if (Number.isNaN(slot.getTime())) {
      return { ok: false, error: "That date and time could not be read." };
    }
    if (slot.getTime() < Date.now()) {
      return { ok: false, error: "Pick a slot in the future." };
    }

    const { error } = await supabase.from("consultations").insert({
      client_id: user.uid,
      lawyer_id: lawyerId,
      status: "scheduled",
      scheduled_at: slot.toISOString(),
    });

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/client");
    revalidatePath("/dashboard/lawyer");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

// ── Lawyer Actions ───────────────────────────────────────────────────

export async function updateHourlyRate(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await getActionContext();

    if (user.role !== "lawyer") {
      return { ok: false, error: "Only lawyers can set an hourly rate." };
    }

    const rate = Number(formData.get("rate"));

    if (!Number.isFinite(rate) || rate < 0) {
      return { ok: false, error: "Enter a rate of ₹0 or more." };
    }

    // `.select()` so a silent zero-row update (missing profile) is caught
    // instead of reporting success.
    const { data, error } = await supabase
      .from("lawyer_profiles")
      .update({ hourly_rate: rate })
      .eq("lawyer_id", user.uid)
      .select("lawyer_id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return {
        ok: false,
        error: "No lawyer profile found for your account. Run supabase/schema.sql to create one.",
      };
    }

    revalidatePath("/dashboard/lawyer");
    revalidatePath("/dashboard/client");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function updateSpecialty(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, user } = await getActionContext();

    if (user.role !== "lawyer") {
      return { ok: false, error: "Only lawyers can set a specialty." };
    }

    const specialty = (formData.get("specialty") as string | null)?.trim();
    if (!specialty) return { ok: false, error: "Select a specialty." };

    const { data, error } = await supabase
      .from("lawyer_profiles")
      .update({ specialty })
      .eq("lawyer_id", user.uid)
      .select("lawyer_id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return { ok: false, error: "No lawyer profile found for your account." };
    }

    revalidatePath("/dashboard/lawyer");
    revalidatePath("/dashboard/client");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function saveCaseNotes(
  consultationId: string,
  notes: string
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getActionContext();

    if (user.role !== "lawyer") {
      return { ok: false, error: "Only the assigned lawyer can edit case notes." };
    }

    // The `lawyer_id` filter matches the RLS policy, so a lawyer cannot
    // write notes onto someone else's consultation.
    const { data, error } = await supabase
      .from("consultations")
      .update({ case_notes: notes })
      .eq("consultation_id", consultationId)
      .eq("lawyer_id", user.uid)
      .select("consultation_id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return { ok: false, error: "That consultation is not assigned to you." };
    }

    revalidatePath("/dashboard/lawyer");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function updateConsultationStatus(
  consultationId: string,
  status: ConsultationStatus
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getActionContext();

    if (user.role !== "lawyer") {
      return { ok: false, error: "Only the assigned lawyer can change a status." };
    }
    if (status !== "scheduled" && status !== "completed") {
      return { ok: false, error: "Unknown consultation status." };
    }

    const { data, error } = await supabase
      .from("consultations")
      .update({ status })
      .eq("consultation_id", consultationId)
      .eq("lawyer_id", user.uid)
      .select("consultation_id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return { ok: false, error: "That consultation is not assigned to you." };
    }

    revalidatePath("/dashboard/lawyer");
    revalidatePath("/dashboard/client");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

// ── Admin Actions ────────────────────────────────────────────────────

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryTrackingStatus
): Promise<ActionResult> {
  try {
    const { supabase, user } = await getActionContext();

    if (user.role !== "admin") {
      return { ok: false, error: "Only an admin can move a delivery." };
    }
    if (!DELIVERY_STEPS.includes(status)) {
      return { ok: false, error: "Unknown tracking status." };
    }

    const { data, error } = await supabase
      .from("deliveries")
      .update({ tracking_status: status })
      .eq("delivery_id", deliveryId)
      .select("delivery_id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      return { ok: false, error: "That delivery no longer exists." };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/client");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
