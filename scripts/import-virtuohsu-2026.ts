import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

config({ path: ".env.local" });

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

// VirtuOHSU Friday schedule, sourced from https://ohsusim.vercel.app/dashboard
// (transcribed from screenshots — covers Apr 24, 2026 onward).
type ScheduleEntry = {
  date: string;
  topic: string | null;
  cancellationNote?: string;
};

const SCHEDULE: ScheduleEntry[] = [
  { date: "2026-04-24", topic: "Anatomy" },
  { date: "2026-05-01", topic: "Cervical fusion (ACDF/posterior fusion)" },
  { date: "2026-05-08", topic: "Anatomy" },
  { date: "2026-05-15", topic: "Oncology Lectures" },
  { date: "2026-05-22", topic: "Oncology Lectures" },
  { date: "2026-05-29", topic: "Oncology Lectures" },
  { date: "2026-06-05", topic: "Total knee arthroplasty" },
  { date: "2026-06-12", topic: "Foot & Ankle Didactics" },
  { date: "2026-06-19", topic: "Intern testing" },
  { date: "2026-07-03", topic: null, cancellationNote: "Holiday" },
  { date: "2026-07-10", topic: "BB Forearm ORIF" },
  { date: "2026-07-17", topic: "Pending" },
  { date: "2026-07-24", topic: "Ex Fix" },
  { date: "2026-07-31", topic: "Pending" },
  { date: "2026-08-07", topic: "Clavicle/scapula ORIF" },
  { date: "2026-08-14", topic: "OITE Review" },
  { date: "2026-08-21", topic: "OITE Review" },
  { date: "2026-08-28", topic: "OITE Review" },
  { date: "2026-09-04", topic: "Wrist fusion, carpal fusion, carpal tunnel release" },
  { date: "2026-09-11", topic: "OITE Review" },
  { date: "2026-09-18", topic: "OITE Review" },
  { date: "2026-09-25", topic: "BOOT CAMP" },
  { date: "2026-10-02", topic: "Shoulder arthroscopy" },
  { date: "2026-10-09", topic: "OITE Review" },
  { date: "2026-10-16", topic: "Olecranon, distal radius ORIF" },
  { date: "2026-10-23", topic: "OITE Review" },
  { date: "2026-10-30", topic: "OITE Review" },
  { date: "2026-11-06", topic: "OITE Review" },
  { date: "2026-11-13", topic: "OITE Basic Science" },
];

async function main() {
  console.log(`Upserting ${SCHEDULE.length} VirtuOHSU sessions…\n`);

  for (const { date, topic, cancellationNote } of SCHEDULE) {
    const isCancelled = !!cancellationNote;
    const { error } = await supabase
      .from("sessions")
      .upsert(
        {
          type: "virtuohsu",
          date,
          topic,
          is_cancelled: isCancelled,
          cancellation_note: cancellationNote ?? null,
        },
        { onConflict: "type,date" },
      );
    if (error) {
      console.error(
        `  [fail] ${date} "${topic ?? cancellationNote}": ${error.message}`,
      );
      continue;
    }
    const label = isCancelled ? `[${cancellationNote}]` : `"${topic}"`;
    console.log(`  [ok]  ${date} ${label}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
