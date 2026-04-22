import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

config({ path: ".env.local" });

const SOURCE_ROOT = process.env.BREAKFAST_CLUB_ROOT ?? process.argv[2];

if (!SOURCE_ROOT) {
  console.error(
    "Set BREAKFAST_CLUB_ROOT env var or pass the archive root as the first argument.\n" +
      "Usage: tsx scripts/import-breakfast-clubs.ts <archive-root> [--apply] [--verbose]",
  );
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const verbose = process.argv.includes("--verbose");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type ParsedFolder = {
  year: number;
  month: number;
  day: number;
  date: string;
  topic: string;
  absPath: string;
  folderName: string;
};

const FOLDER_RE = /^(\d{4})_\s+(\d{1,2})[:\-.](\d{1,2})[-_]\s*(.+?)\s*$/;

function parseFolderName(
  yearFromParent: number,
  folderName: string,
  absPath: string,
): ParsedFolder | null {
  const m = folderName.match(FOLDER_RE);
  if (!m) return null;
  const [, y, mm, dd, rawTopic] = m;
  const year = Number(y);
  if (year !== yearFromParent) return null;
  const month = Number(mm);
  const day = Number(dd);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const topic = rawTopic.trim();
  return { year, month, day, date, topic, absPath, folderName };
}

async function listYearDirs(): Promise<Array<{ year: number; path: string }>> {
  const entries = await readdir(SOURCE_ROOT, { withFileTypes: true });
  const years: Array<{ year: number; path: string }> = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const n = Number(e.name);
    if (!Number.isFinite(n) || n < 2000 || n > 2100) continue;
    years.push({ year: n, path: join(SOURCE_ROOT, e.name) });
  }
  years.sort((a, b) => a.year - b.year);
  return years;
}

async function listSessionDirs(
  yearDirPath: string,
  year: number,
): Promise<ParsedFolder[]> {
  const entries = await readdir(yearDirPath, { withFileTypes: true });
  const parsed: ParsedFolder[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const p = parseFolderName(year, e.name, join(yearDirPath, e.name));
    if (p) parsed.push(p);
    else console.warn(`  [skip] unparseable folder: ${e.name}`);
  }
  parsed.sort((a, b) => a.date.localeCompare(b.date));
  return parsed;
}

async function listPdfs(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const pdfs: string[] = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (extname(e.name).toLowerCase() !== ".pdf") continue;
    pdfs.push(join(dirPath, e.name));
  }
  pdfs.sort();
  return pdfs;
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function titleFromPdfFilename(absPath: string): string {
  const base = basename(absPath, extname(absPath));
  return base.replace(/\s+/g, " ").trim();
}

async function findExistingSession(
  date: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id")
    .eq("type", "breakfast_club")
    .eq("date", date)
    .maybeSingle();
  if (error) throw new Error(`lookup failed for ${date}: ${error.message}`);
  return data;
}

async function importOne(p: ParsedFolder): Promise<{
  status: "created" | "skipped-exists" | "dry-run";
  papers: number;
}> {
  const pdfs = await listPdfs(p.absPath);

  if (!apply) {
    console.log(
      `  [dry] ${p.date}  "${p.topic}"  (${pdfs.length} PDF${pdfs.length === 1 ? "" : "s"})`,
    );
    if (verbose) for (const f of pdfs) console.log(`        - ${basename(f)}`);
    return { status: "dry-run", papers: pdfs.length };
  }

  const existing = await findExistingSession(p.date);
  if (existing) {
    console.log(`  [skip] ${p.date} "${p.topic}" already exists (id=${existing.id.slice(0, 8)}…)`);
    return { status: "skipped-exists", papers: 0 };
  }

  const { data: inserted, error: insErr } = await supabase
    .from("sessions")
    .insert({
      type: "breakfast_club",
      date: p.date,
      topic: p.topic,
      webex_url: null,
    })
    .select("id")
    .single();
  if (insErr || !inserted) {
    throw new Error(`session insert failed for ${p.date}: ${insErr?.message}`);
  }
  const sessionId = inserted.id;

  let uploaded = 0;
  for (const pdfPath of pdfs) {
    const buf = await readFile(pdfPath);
    const { size } = await stat(pdfPath);
    const storagePath = `${sessionId}/${Date.now()}_${safeFilename(basename(pdfPath))}`;
    const { error: upErr } = await supabase.storage
      .from("papers")
      .upload(storagePath, buf, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (upErr) {
      console.error(`    [pdf-fail] ${basename(pdfPath)}: ${upErr.message}`);
      continue;
    }
    const { error: paperErr } = await supabase.from("papers").insert({
      session_id: sessionId,
      title: titleFromPdfFilename(pdfPath),
      citation: null,
      pubmed_url: null,
      pdf_path: storagePath,
      needs_cleanup: true,
    });
    if (paperErr) {
      console.error(`    [paper-insert-fail] ${basename(pdfPath)}: ${paperErr.message}`);
      await supabase.storage.from("papers").remove([storagePath]);
      continue;
    }
    uploaded += 1;
    if (verbose) console.log(`    + ${basename(pdfPath)} (${size} bytes)`);
  }

  console.log(
    `  [ok]  ${p.date} "${p.topic}" → session ${sessionId.slice(0, 8)}… + ${uploaded}/${pdfs.length} PDFs`,
  );
  return { status: "created", papers: uploaded };
}

async function main() {
  console.log(`Source: ${SOURCE_ROOT}`);
  console.log(`Mode:   ${apply ? "APPLY (writes to Supabase)" : "DRY RUN (no writes)"}`);
  console.log("");

  const years = await listYearDirs();
  if (years.length === 0) {
    console.error("No year folders found under source root.");
    process.exit(1);
  }

  let totalSessions = 0;
  let totalPdfs = 0;
  let created = 0;
  let skipped = 0;

  for (const { year, path } of years) {
    console.log(`== ${year} ==`);
    const parsed = await listSessionDirs(path, year);
    for (const p of parsed) {
      const res = await importOne(p);
      totalSessions += 1;
      totalPdfs += res.papers;
      if (res.status === "created") created += 1;
      if (res.status === "skipped-exists") skipped += 1;
    }
    console.log("");
  }

  console.log("---");
  console.log(`Sessions processed: ${totalSessions}`);
  if (apply) {
    console.log(`  created:          ${created}`);
    console.log(`  skipped (exists): ${skipped}`);
    console.log(`PDFs uploaded:      ${totalPdfs}`);
  } else {
    console.log(`PDFs would upload:  ${totalPdfs}`);
    console.log("");
    console.log("Run again with --apply to perform the import.");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
