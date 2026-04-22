"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResearchIdeaActionState = {
  ok: boolean;
  message: string;
} | null;

export async function addResearchIdea(
  _prev: ResearchIdeaActionState,
  formData: FormData,
): Promise<ResearchIdeaActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const references = String(formData.get("references") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawRole = String(formData.get("submitterRole") ?? "").trim();
  const submitterRole =
    rawRole === "faculty" || rawRole === "resident" ? rawRole : "resident";

  if (!title || !description) {
    return { ok: false, message: "Please enter a title and short description." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You must be signed in to add an idea." };
  }

  const { error } = await supabase.from("research_ideas").insert({
    title,
    references,
    description,
    submitter_role: submitterRole,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  return { ok: true, message: "Research idea added." };
}

export async function updateResearchIdea(
  _prev: ResearchIdeaActionState,
  formData: FormData,
): Promise<ResearchIdeaActionState> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const references = String(formData.get("references") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawRole = String(formData.get("submitterRole") ?? "").trim();
  const submitterRole =
    rawRole === "faculty" || rawRole === "resident" ? rawRole : "resident";

  if (!id) return { ok: false, message: "Missing idea id." };
  if (!title || !description) {
    return { ok: false, message: "Please enter a title and short description." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("research_ideas")
    .update({ title, references, description, submitter_role: submitterRole })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  return { ok: true, message: "Research idea updated." };
}

export async function deleteResearchIdea(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("research_ideas").delete().eq("id", id);
  revalidatePath("/");
}
