"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SessionType } from "@/lib/types";

export type SessionActionState = {
  ok: boolean;
  message: string;
} | null;

const SIGNED_URL_TTL_SECONDS = 60 * 60;

function isSessionType(v: string): v is SessionType {
  return (
    v === "breakfast_club" || v === "fracture_conference" || v === "virtuohsu"
  );
}

export async function upsertSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const rawType = String(formData.get("type") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim() || null;
  const webexUrl = String(formData.get("webexUrl") ?? "").trim() || null;
  const isCancelled = formData.get("isCancelled") === "1";
  const cancellationNote =
    String(formData.get("cancellationNote") ?? "").trim() || null;

  if (!isSessionType(rawType)) {
    return { ok: false, message: "Invalid session type." };
  }
  if (!date) {
    return { ok: false, message: "Date is required." };
  }

  const supabase = await createClient();

  const payload = {
    type: rawType,
    date,
    topic,
    webex_url: webexUrl,
    is_cancelled: isCancelled,
    cancellation_note: isCancelled ? cancellationNote : null,
  };

  if (id) {
    const { error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("id", id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("sessions").insert(payload);
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/archive");
  return { ok: true, message: "Session saved." };
}

export async function deleteSession(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  const { data: papers } = await supabase
    .from("papers")
    .select("pdf_path")
    .eq("session_id", id);

  const paths = (papers ?? [])
    .map((p) => p.pdf_path)
    .filter((p): p is string => !!p);
  if (paths.length > 0) {
    await supabase.storage.from("papers").remove(paths);
  }

  await supabase.from("sessions").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/archive");
}

export async function addPaper(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const citation = String(formData.get("citation") ?? "").trim() || null;
  const pubmedUrl = String(formData.get("pubmedUrl") ?? "").trim() || null;
  const file = formData.get("pdf");

  if (!sessionId) return { ok: false, message: "Missing session." };
  if (!title) return { ok: false, message: "Paper title is required." };

  const supabase = await createClient();

  let pdfPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.type && file.type !== "application/pdf") {
      return { ok: false, message: "PDF files only." };
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const path = `${sessionId}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("papers")
      .upload(path, file, { contentType: "application/pdf", upsert: false });
    if (uploadError) return { ok: false, message: uploadError.message };
    pdfPath = path;
  }

  const { error } = await supabase.from("papers").insert({
    session_id: sessionId,
    title,
    citation,
    pubmed_url: pubmedUrl,
    pdf_path: pdfPath,
    needs_cleanup: false,
  });
  if (error) {
    if (pdfPath) await supabase.storage.from("papers").remove([pdfPath]);
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/archive");
  return { ok: true, message: "Paper added." };
}

export async function updatePaper(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const citation = String(formData.get("citation") ?? "").trim() || null;
  const pubmedUrl = String(formData.get("pubmedUrl") ?? "").trim() || null;
  const removePdf = formData.get("removePdf") === "1";
  const file = formData.get("pdf");

  if (!id) return { ok: false, message: "Missing paper id." };
  if (!title) return { ok: false, message: "Paper title is required." };

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("papers")
    .select("session_id, pdf_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) return { ok: false, message: fetchError.message };
  if (!existing) return { ok: false, message: "Paper not found." };

  let newPdfPath: string | null | undefined;

  if (file instanceof File && file.size > 0) {
    if (file.type && file.type !== "application/pdf") {
      return { ok: false, message: "PDF files only." };
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const path = `${existing.session_id}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("papers")
      .upload(path, file, { contentType: "application/pdf", upsert: false });
    if (uploadError) return { ok: false, message: uploadError.message };
    newPdfPath = path;
  } else if (removePdf) {
    newPdfPath = null;
  }

  const updatePayload: {
    title: string;
    citation: string | null;
    pubmed_url: string | null;
    needs_cleanup: boolean;
    pdf_path?: string | null;
  } = {
    title,
    citation,
    pubmed_url: pubmedUrl,
    needs_cleanup: false,
  };
  if (newPdfPath !== undefined) {
    updatePayload.pdf_path = newPdfPath;
  }

  const { error } = await supabase
    .from("papers")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    if (newPdfPath) await supabase.storage.from("papers").remove([newPdfPath]);
    return { ok: false, message: error.message };
  }

  if (
    newPdfPath !== undefined &&
    existing.pdf_path &&
    existing.pdf_path !== newPdfPath
  ) {
    await supabase.storage.from("papers").remove([existing.pdf_path]);
  }

  revalidatePath("/");
  revalidatePath("/archive");
  return { ok: true, message: "Paper updated." };
}

export async function deletePaper(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: paper } = await supabase
    .from("papers")
    .select("pdf_path")
    .eq("id", id)
    .maybeSingle();

  if (paper?.pdf_path) {
    await supabase.storage.from("papers").remove([paper.pdf_path]);
  }

  await supabase.from("papers").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/archive");
}

export async function getPaperSignedUrl(
  pdfPath: string,
): Promise<{ url: string | null; message?: string }> {
  if (!pdfPath) return { url: null, message: "No PDF on file." };
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("papers")
    .createSignedUrl(pdfPath, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    return { url: null, message: error?.message ?? "Unable to open PDF." };
  }
  return { url: data.signedUrl };
}

export type PubmedLookupResult =
  | { ok: true; title: string; citation: string; pubmedUrl: string }
  | { ok: false; message: string };

type PubmedAuthor = { name?: string; authtype?: string };
type PubmedRecord = {
  error?: string;
  title?: string;
  authors?: PubmedAuthor[];
  source?: string;
  fulljournalname?: string;
  pubdate?: string;
  volume?: string;
  issue?: string;
  pages?: string;
};

function formatAmaAuthors(authors: PubmedAuthor[]): string {
  const names = authors
    .filter((a) => (a.authtype ?? "Author") === "Author")
    .map((a) => (a.name ?? "").trim())
    .filter(Boolean);
  if (names.length === 0) return "";
  if (names.length <= 6) return names.join(", ");
  return `${names.slice(0, 3).join(", ")}, et al`;
}

function formatAmaCitation(record: PubmedRecord): string {
  const title = (record.title ?? "").replace(/\.\s*$/, "").trim();
  const authors = formatAmaAuthors(record.authors ?? []);
  const journal = (record.source ?? record.fulljournalname ?? "").trim();
  const year = (record.pubdate ?? "").slice(0, 4);
  const volume = (record.volume ?? "").trim();
  const issue = (record.issue ?? "").trim();
  const pages = (record.pages ?? "").trim();

  const parts: string[] = [];
  if (authors) parts.push(`${authors}.`);
  if (title) parts.push(`${title}.`);
  if (journal) parts.push(`${journal}.`);

  if (year) {
    let tail = year;
    if (volume) {
      tail += `;${volume}`;
      if (issue) tail += `(${issue})`;
    }
    if (pages) tail += `:${pages}`;
    parts.push(`${tail}.`);
  }

  return parts.join(" ").trim();
}

export async function fetchPubmedMetadata(
  rawPmid: string,
): Promise<PubmedLookupResult> {
  const pmid = rawPmid.trim().replace(/^pmid[:\s]*/i, "");
  if (!/^\d+$/.test(pmid)) {
    return { ok: false, message: "Enter a numeric PMID." };
  }

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, message: `PubMed returned ${res.status}.` };
    }
    const json: { result?: Record<string, PubmedRecord> } = await res.json();
    const record = json?.result?.[pmid];
    if (!record || record.error) {
      return { ok: false, message: "PMID not found." };
    }
    const title = (record.title ?? "").replace(/\.\s*$/, "").trim();
    return {
      ok: true,
      title,
      citation: formatAmaCitation(record),
      pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "PubMed lookup failed.",
    };
  }
}
