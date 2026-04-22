"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResourceActionState = {
  ok: boolean;
  message: string;
} | null;

export async function upsertResource(
  _prev: ResourceActionState,
  formData: FormData,
): Promise<ResourceActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  const sortOrder = sortOrderRaw === "" ? 0 : Number(sortOrderRaw);

  if (!label) return { ok: false, message: "Label is required." };
  if (!url) return { ok: false, message: "URL is required." };
  if (!Number.isFinite(sortOrder)) {
    return { ok: false, message: "Sort order must be a number." };
  }

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("resources")
      .update({ label, url, sort_order: sortOrder })
      .eq("id", id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase
      .from("resources")
      .insert({ label, url, sort_order: sortOrder });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/");
  return { ok: true, message: "Resource saved." };
}

export async function deleteResource(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("resources").delete().eq("id", id);
  revalidatePath("/");
}
