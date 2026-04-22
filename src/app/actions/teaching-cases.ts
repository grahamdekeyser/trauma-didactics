"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FRACTURE_TYPES, type FractureType } from "@/lib/types";

export type TeachingCaseActionState = {
  ok: boolean;
  message: string;
} | null;

const FRACTURE_TYPE_SET = new Set<string>(FRACTURE_TYPES);

export async function addTeachingCase(
  _prev: TeachingCaseActionState,
  formData: FormData,
): Promise<TeachingCaseActionState> {
  const fractureType = String(formData.get("fractureType") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fractureType || !FRACTURE_TYPE_SET.has(fractureType)) {
    return { ok: false, message: "Pick a fracture type from the list." };
  }
  if (!notes) {
    return { ok: false, message: "Add a short note describing the case." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You must be signed in to add a case." };
  }

  const submitterEmail = user.email ?? null;
  const submitterName =
    (user.user_metadata?.full_name as string | undefined) ?? submitterEmail;
  const submittedAt = new Date().toISOString();

  const { error } = await supabase.from("teaching_cases").insert({
    fracture_type: fractureType as FractureType,
    notes,
    submitter_user_id: user.id,
    submitter_name: submitterName ?? null,
    submitter_email: submitterEmail,
    submitted_at: submittedAt,
  });
  if (error) return { ok: false, message: error.message };

  const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fractureType,
          notes,
          submitterName,
          submitterEmail,
          submittedAt,
        }),
      });
      if (!res.ok) {
        return {
          ok: true,
          message:
            "Case saved to the site, but OneDrive sync failed. Check the Excel file.",
        };
      }
    } catch {
      return {
        ok: true,
        message:
          "Case saved to the site, but OneDrive sync failed. Check the Excel file.",
      };
    }
  }

  revalidatePath("/");
  return { ok: true, message: "Case added to the repository." };
}

export async function deleteTeachingCase(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("teaching_cases").delete().eq("id", id);
  revalidatePath("/");
}
