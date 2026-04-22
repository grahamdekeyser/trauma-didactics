import { config } from "dotenv";
import { readFileSync } from "node:fs";
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

const BUCKET = "resources";
const SOURCE_PATH = process.argv[2];
const STORAGE_PATH = process.argv[3] ?? "trauma-rotation-expectations.pdf";
const LABEL = process.argv[4] ?? "Trauma Rotation Expectations";

if (!SOURCE_PATH) {
  console.error(
    "Usage: tsx scripts/upload-resource-pdf.ts <source-pdf> [storage-filename] [label]",
  );
  process.exit(1);
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`listBuckets: ${error.message}`);
  if (buckets?.some((b) => b.name === BUCKET)) {
    console.log(`  bucket "${BUCKET}" already exists`);
    return;
  }
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  if (createErr) throw new Error(`createBucket: ${createErr.message}`);
  console.log(`  created public bucket "${BUCKET}"`);
}

async function uploadPdf() {
  const file = readFileSync(SOURCE_PATH);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(STORAGE_PATH, file, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) throw new Error(`upload: ${error.message}`);
  console.log(`  uploaded ${file.byteLength} bytes → ${BUCKET}/${STORAGE_PATH}`);
}

async function insertResource(publicUrl: string) {
  const { data: existing } = await supabase
    .from("resources")
    .select("id, sort_order")
    .eq("url", publicUrl)
    .maybeSingle();

  if (existing) {
    console.log(`  resource row already exists (id=${existing.id}); skipping`);
    return;
  }

  const { data: maxRow } = await supabase
    .from("resources")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase
    .from("resources")
    .insert({ label: LABEL, url: publicUrl, sort_order: nextOrder });
  if (error) throw new Error(`insert resource: ${error.message}`);
  console.log(`  inserted resource row "${LABEL}" (sort_order=${nextOrder})`);
}

async function main() {
  console.log("Uploading overview PDF as a resource link…\n");
  await ensureBucket();
  await uploadPdf();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(STORAGE_PATH);
  const publicUrl = data.publicUrl;
  console.log(`  public URL: ${publicUrl}`);
  await insertResource(publicUrl);
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
