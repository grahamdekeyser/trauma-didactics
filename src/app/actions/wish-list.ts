"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WishListActionState = {
  ok: boolean;
  message: string;
} | null;

export async function addWishListItem(
  _prev: WishListActionState,
  formData: FormData,
): Promise<WishListActionState> {
  const topic = String(formData.get("topic") ?? "").trim();
  const submitterName = String(formData.get("submitterName") ?? "").trim();

  if (!topic || !submitterName) {
    return { ok: false, message: "Please fill in both your name and a topic." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "You must be signed in to add a topic." };
  }

  const { data: inserted, error } = await supabase
    .from("wish_list")
    .insert({
      topic,
      submitter_name: submitterName,
      submitter_user_id: user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  await supabase
    .from("wish_list_votes")
    .insert({ wish_list_id: inserted.id, user_id: user.id });

  revalidatePath("/");
  return { ok: true, message: "Topic added." };
}

export async function toggleWishListVote(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("wish_list_votes")
    .select("wish_list_id")
    .eq("wish_list_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("wish_list_votes")
      .delete()
      .eq("wish_list_id", id)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("wish_list_votes")
      .insert({ wish_list_id: id, user_id: user.id });
  }

  revalidatePath("/");
}

export async function updateWishListItem(
  _prev: WishListActionState,
  formData: FormData,
): Promise<WishListActionState> {
  const id = String(formData.get("id") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const submitterName = String(formData.get("submitterName") ?? "").trim();

  if (!id) return { ok: false, message: "Missing item id." };
  if (!topic || !submitterName) {
    return { ok: false, message: "Please fill in both name and topic." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("wish_list")
    .update({ topic, submitter_name: submitterName })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  return { ok: true, message: "Topic updated." };
}

export async function deleteWishListItem(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("wish_list").delete().eq("id", id);
  revalidatePath("/");
}
