import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

config({ path: ".env.local" });

// Pick the first non-flag CLI argument as the source root. The `:apply` npm
// script passes `--apply` ahead of the user-supplied path, so positionally
// reading argv[2] would grab the flag instead of the folder.
const positionalRoot = process.argv.slice(2).find((a) => !a.startsWith("--"));
const resolvedRoot = process.env.BREAKFAST_CLUB_ROOT ?? positionalRoot;

if (!resolvedRoot) {
  console.error(
    "Set BREAKFAST_CLUB_ROOT env var or pass the archive root as the first argument.\n" +
      "Usage: tsx scripts/import-breakfast-clubs.ts <archive-root> [--apply] [--verbose]",
  );
  process.exit(1);
}

const SOURCE_ROOT: string = resolvedRoot;

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

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// The rolling calendar only renders a breakfast-club slot on the Wednesday of
// each week (see SESSION_WEEKDAYS in src/lib/dates.ts). A session dated to any
// other weekday is created in the DB but never matches a grid cell, so it
// silently vanishes from the calendar. Surface that before it bites.
function nonWednesdayWarning(date: string): string | null {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()];
  if (weekday === "Wednesday") return null;
  return `  [warn] ${date} is a ${weekday}, not Wednesday — breakfast-club slots only render on Wednesdays, so this will NOT appear on the rolling calendar.`;
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
  status: "created" | "skipped-exists" | "skipped-empty" | "dry-run";
  papers: number;
  offCalendar: boolean;
}> {
  const pdfs = await listPdfs(p.absPath);

  // Placeholder folders (date reserved, no topic typed yet, no PDFs added)
  // carry nothing worth a session row — skip them so they don't litter the
  // calendar with blank entries. They'll import naturally once filled in.
  if (p.topic.length === 0 && pdfs.length === 0) {
    console.log(`  [skip] ${p.date} empty placeholder (no topic, no PDFs)`);
    return { status: "skipped-empty", papers: 0, offCalendar: false };
  }

  const warning = nonWednesdayWarning(p.date);
  if (warning) console.warn(warning);
  const offCalendar = warning !== null;

  if (!apply) {
    console.log(
      `  [dry] ${p.date}  "${p.topic}"  (${pdfs.length} PDF${pdfs.length === 1 ? "" : "s"})`,
    );
    if (verbose) for (const f of pdfs) console.log(`        - ${basename(f)}`);
    return { status: "dry-run", papers: pdfs.length, offCalendar };
  }

  const existing = await findExistingSession(p.date);
  if (existing) {
    console.log(`  [skip] ${p.date} "${p.topic}" already exists (id=${existing.id.slice(0, 8)}…)`);
    return { status: "skipped-exists", papers: 0, offCalendar };
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
  return { status: "created", papers: uploaded, offCalendar };
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
  let skippedEmpty = 0;
  const offCalendarDates: string[] = [];

  for (const { year, path } of years) {
    console.log(`== ${year} ==`);
    const parsed = await listSessionDirs(path, year);
    for (const p of parsed) {
      const res = await importOne(p);
      totalSessions += 1;
      totalPdfs += res.papers;
      if (res.status === "created") created += 1;
      if (res.status === "skipped-exists") skipped += 1;
      if (res.status === "skipped-empty") skippedEmpty += 1;
      if (res.offCalendar) offCalendarDates.push(`${p.date} "${p.topic}"`);
    }
    console.log("");
  }

  console.log("---");
  console.log(`Sessions processed: ${totalSessions}`);
  if (offCalendarDates.length > 0) {
    console.log("");
    console.log(
      `⚠ ${offCalendarDates.length} session(s) are NOT on a Wednesday and will not show on the rolling calendar:`,
    );
    for (const d of offCalendarDates) console.log(`    ${d}`);
    console.log("  Fix the folder date (or move the club to its Wednesday) and re-run.");
  }
  if (apply) {
    console.log(`  created:          ${created}`);
    console.log(`  skipped (exists): ${skipped}`);
    console.log(`  skipped (empty):  ${skippedEmpty}`);
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
