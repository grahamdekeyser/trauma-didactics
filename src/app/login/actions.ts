"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_DOMAINS = ["ohsu.edu", "uoregon.edu"];

export type LoginState = {
  ok: false;
  message: string;
} | null;

function validateEmail(email: string): string | null {
  if (!email) return "Please enter your email.";
  const domain = email.split("@")[1];
  if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
    return "Access is limited to @ohsu.edu and @uoregon.edu email addresses.";
  }
  return null;
}

async function findUserByEmail(email: string) {
  const admin = createAdminClient();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  const emailErr = validateEmail(email);
  if (emailErr) {
    return { ok: false, message: emailErr };
  }

  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    return {
      ok: false,
      message: "Server is missing SITE_PASSWORD. Contact the site admin.",
    };
  }

  if (password !== sitePassword) {
    return { ok: false, message: "Incorrect password." };
  }

  const supabase = await createClient();

  // Fast path: user already has the shared password set.
  const first = await supabase.auth.signInWithPassword({ email, password });
  if (!first.error) {
    redirect(next);
  }

  // Slow path: either the user doesn't exist, or they're a legacy magic-link
  // user whose account has no password yet. Provision them via admin API.
  const admin = createAdminClient();
  let existing;
  try {
    existing = await findUserByEmail(email);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lookup failed.";
    return { ok: false, message: msg };
  }

  if (!existing) {
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) {
      return { ok: false, message: createErr.message };
    }
  } else {
    const { error: updErr } = await admin.auth.admin.updateUserById(
      existing.id,
      { password },
    );
    if (updErr) {
      return { ok: false, message: updErr.message };
    }
  }

  const retry = await supabase.auth.signInWithPassword({ email, password });
  if (retry.error) {
    return { ok: false, message: retry.error.message };
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
