"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WebinarActionState = {
  ok: boolean;
  message: string;
} | null;

export async function upsertWebinar(
  _prev: WebinarActionState,
  formData: FormData,
): Promise<WebinarActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim() || null;

  if (!title) return { ok: false, message: "Title is required." };
  if (!date) return { ok: false, message: "Date is required." };
  if (!url) return { ok: false, message: "URL is required." };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase
      .from("webinars")
      .update({ title, date, url, source })
      .eq("id", id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase
      .from("webinars")
      .insert({ title, date, url, source });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/");
  return { ok: true, message: "Webinar saved." };
}

export async function deleteWebinar(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("webinars").delete().eq("id", id);
  revalidatePath("/");
}
