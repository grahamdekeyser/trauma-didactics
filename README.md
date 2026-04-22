# Orthopaedic Trauma Didactics

An open-source web platform for organizing a residency program's weekly journal
club, fracture conference, and anatomy sessions. Built by and for the
Department of Orthopaedics and Rehabilitation at Oregon Health & Science
University, and released for any program that would like to run something
similar.

This repository accompanies our JBJS Innovation article describing the
platform's design and rationale. If you use or adapt this code for your own
residency, we would love to hear about it.

## What it does

- **Six-week rolling calendar** for three weekly session types (journal club,
  fracture conference, anatomy session), laid out as a whiteboard-style
  Wed/Thu/Fri grid.
- **Searchable archive** of past journal clubs — every paper ever discussed,
  with PDFs, citations, and PubMed/DOI links.
- **Resident-submitted topic wish list** with upvoting.
- **Research-ideas log** tagged by submitter and role (resident vs. faculty).
- **Teaching-case repository** that captures on-call fractures by AO/OTA
  type, routed through a HIPAA-compatible OneDrive workbook when configured.
- **Curated resource links** and **webinars** sections, admin-maintained.
- **Domain-locked authentication** — only users with institutional email
  addresses you allowlist can sign in.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Supabase](https://supabase.com) — PostgreSQL, auth, file storage
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- Deployed to [Vercel](https://vercel.com)

All three vendors have free tiers sufficient for a residency-scale program.

## Replicating the platform at your institution

This is the path a single faculty member (no developer required) can follow
end-to-end in an afternoon.

### 1. Fork this repository

Click **Fork** on GitHub. Clone your fork locally:

```bash
git clone https://github.com/<your-org>/<your-fork>.git
cd <your-fork>
npm install
```

### 2. Create a Supabase project

- Create a free project at [supabase.com](https://supabase.com).
- Under **Project Settings → API**, copy the project URL, `anon` public key,
  and `service_role` secret key.
- Under **SQL Editor**, run each migration in [`supabase/migrations/`](supabase/migrations)
  in order (`0001_init.sql` first, then `0002_…`, and so on).

### 3. Configure environment variables

Copy the example file and fill in the values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` public key (safe for the browser).
- `SUPABASE_SERVICE_ROLE_KEY` — the `service_role` secret key (server only;
  **never** expose to the browser or commit).
- `SITE_PASSWORD` — a shared password that institutional users enter alongside
  their email. Rotate whenever you need to revoke access in bulk.
- `POWER_AUTOMATE_WEBHOOK_URL` — optional; leave blank unless you are wiring
  up the OneDrive teaching-case bridge (see below).
- `NEXT_PUBLIC_WEBEX_URL` — optional; the persistent Webex meeting URL you
  want to use as the default join link for journal club and fracture
  conference. Leave blank to hide the join link (admins can still set a
  per-session URL in the UI).
- `NEXT_PUBLIC_TEACHING_CASE_REPO_URL` — optional; direct link to the
  OneDrive workbook that stores the PHI-containing teaching-case spreadsheet.
  Leave blank to hide the "Open workbook" button on the Teaching Case
  Repository card.

### 4. Set allowlists

Two things control who can sign in and who can edit:

- **Allowed email domains.** Edit the `ALLOWED_DOMAINS` constant in
  [`src/app/login/actions.ts`](src/app/login/actions.ts) to match your
  institution(s). In our deployment this is `["ohsu.edu", "uoregon.edu"]`.
  The same domains appear in the sign-in form placeholder
  ([`src/app/login/login-form.tsx`](src/app/login/login-form.tsx)) and the
  homepage footer ([`src/app/page.tsx`](src/app/page.tsx)) — update those
  strings too so the user-facing text matches.
- **Admin allowlist.** Add admin emails by inserting rows into the `admins`
  table in Supabase — see
  [`supabase/migrations/0003_add_admins.sql`](supabase/migrations/0003_add_admins.sql)
  for the schema. Non-admin institutional users can still read the archive
  and submit wish-list topics, research ideas, and teaching cases.

### 5. (Optional) Import your existing journal-club archive

If you already have years of past sessions in folders of PDFs, the included
script will ingest them. It expects a folder layout like
`YYYY/YYYY_ M:D- Topic Name/paper.pdf` — adjust the parser in
[`scripts/import-breakfast-clubs.ts`](scripts/import-breakfast-clubs.ts) if
your filenames differ. Dry run first:

```bash
npm run import:breakfast-clubs
```

Then apply:

```bash
npm run import:breakfast-clubs:apply
```

Title, authors, and year are auto-extracted from the PDFs' embedded metadata;
anything the parser flags for review can be edited in the admin UI after
import.

### 6. Deploy to Vercel

- Push your fork to GitHub.
- In Vercel, **Add New Project** → import the repository.
- Add the same environment variables from `.env.local` under
  **Project Settings → Environment Variables**.
- Click **Deploy**. Vercel will build and give you a `*.vercel.app` URL.

That's it — share the URL with your residents and faculty.

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional: HIPAA-compatible teaching-case capture

The teaching-case repository can write case metadata to an Excel workbook in
institutional OneDrive (covered under your institution's Business Associate
Agreement) via Microsoft Power Automate, so that any identifying details stay
inside your covered environment rather than in the cloud database.

To enable it:

1. In Power Automate, create a flow with an **HTTP trigger** (set
   "Who can trigger the flow?" to **Anyone**) that **adds a row** to a table
   in your Teaching-Case workbook on OneDrive.
2. Copy the HTTP POST URL — it must include the `&sig=…` signature segment;
   a URL ending at `api-version=1` alone will return HTTP 401.
3. Set `POWER_AUTOMATE_WEBHOOK_URL` in `.env.local` (and in Vercel) to that
   URL.

When the variable is blank, the Supabase mirror still records each submission
with non-PHI metadata (fracture type, timestamp, submitter role); only the
OneDrive sync is skipped.

## Contributing

Pull requests are welcome, especially from other residency programs running
forks of this codebase.

## Citation

If you adopt or adapt this platform and publish about it, we would appreciate
a citation to our JBJS Innovation article (citation to be added upon
publication).

## License

MIT — see [`LICENSE`](LICENSE).
