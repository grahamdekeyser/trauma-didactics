"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_DOMAINS = ["ohsu.edu", "uoregon.edu"];

export type RequestOtpState =
  | { ok: true; email: string }
  | { ok: false; message: string }
  | null;

export type VerifyOtpState =
  | { ok: false; message: string }
  | null;

function validateEmail(email: string): string | null {
  if (!email) return "Please enter your email.";
  const domain = email.split("@")[1];
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return "Access is limited to @ohsu.edu and @uoregon.edu email addresses.";
  }
  return null;
}

export async function requestOtp(
  _prev: RequestOtpState,
  formData: FormData,
): Promise<RequestOtpState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const emailErr = validateEmail(email);
  if (emailErr) {
    return { ok: false, message: emailErr };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, email };
}

export async function verifyOtp(
  _prev: VerifyOtpState,
  formData: FormData,
): Promise<VerifyOtpState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim();
  const next = String(formData.get("next") ?? "/") || "/";

  const emailErr = validateEmail(email);
  if (emailErr) {
    return { ok: false, message: emailErr };
  }
  if (!/^\d{6}$/.test(token)) {
    return { ok: false, message: "Enter the 6-digit code from your email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
