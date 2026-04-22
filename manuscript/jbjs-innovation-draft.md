# An Open-Source Web Platform for Organizing Orthopaedic Trauma Didactics: A Replicable Model for Residency Programs

**Article type:** Innovation (JBJS)

**Authors**
Graham DeKeyser, MD¹; Darin Friess, MD¹; Zach Working, MD¹; Kenneth Gundle, MD¹; Dane Brodke, MD, MPH¹

¹ Department of Orthopaedics and Rehabilitation, Oregon Health & Science University, Portland, Oregon

**Corresponding author:**
Graham DeKeyser, MD
Department of Orthopaedics and Rehabilitation
Oregon Health & Science University
Portland, OR
dekeyser@ohsu.edu

---

## Introduction

Orthopaedic surgery residency programs rely on structured didactic curricula — journal clubs, fracture case conferences, and anatomy sessions — to translate a large and rapidly evolving literature into clinical competence.¹,² At our institution, these sessions were coordinated for years on a wall-mounted whiteboard: papers assigned, topics chosen, dates shuffled, with little persistence between academic years. Papers circulated through email attachments and hand-out PDFs, and the institutional memory of what had been taught — and by whom, and when — was reconstructed each year from scratch. Resident-submitted topic ideas and research questions, arguably the richest output of these sessions, were routinely lost.

Existing learning-management systems are heavy, program-agnostic, and poorly suited to the week-by-week rhythm of a small subspecialty curriculum. Commercial didactic platforms exist but are costly, generic, and rarely modifiable by the faculty running the sessions. We could find no low-cost, open-source option designed specifically around the structure of an orthopaedic residency's weekly didactic cadence.

We therefore built a lightweight, open-source web platform — the OHSU Orthopaedic Trauma Didactics app — to replace the whiteboard with persistent, searchable, resident-interactive infrastructure. The entire platform runs on free or low-cost vendor tiers, requires no institutional IT provisioning, and can be deployed by a single faculty member in under an afternoon. We describe the platform's design, the path to replicating it at another residency, and the Health Insurance Portability and Accountability Act (HIPAA)-compatible pattern we use to capture teaching cases from daily clinical work. The source code is publicly available so that any program wishing to organize its didactics in this way can fork our repository and stand up a functionally identical system at effectively zero marginal cost.

## The Innovation

The platform organizes a program's didactic curriculum around three session types: a weekly journal club ("Breakfast Club"), a weekly fracture case conference, and a weekly anatomy session. A single home page (Figure 1) presents a six-week rolling calendar displayed as a whiteboard-style Wednesday/Thursday/Friday grid; a searchable archive of past journal clubs with associated PDFs and citations; a resident-submitted topic wish list with upvoting; a research ideas log tagged by submitter role (resident vs. faculty); a curated resource-link library; an upcoming-webinars section; and a teaching case repository. Content is editable by a small admin allowlist; any authenticated institutional user can search the archive, submit wish-list topics, and contribute research ideas and teaching cases.

Papers attached to upcoming journal club sessions are available for pre-reading. Past sessions automatically roll from the calendar into the searchable archive as their dates pass, building an institutional memory of every paper discussed. Resident-submitted topics and research ideas persist year over year, converting the transient output of a didactic session into a durable program asset. The teaching-case repository allows residents to log interesting fractures encountered on call, tagged by AO/OTA fracture classification, for future use as teaching cases.

Access is restricted to institutional email domains — in our deployment, @ohsu.edu and @uoregon.edu, reflecting ongoing collaboration with biomedical engineering doctoral trainees at the University of Oregon. Administrative privileges are scoped to a small faculty allowlist identified by email address in a database configuration table, so privileges can be adjusted without a code change or redeployment.

The platform deliberately has no grading, no attendance tracking, and no learner-performance dashboards. Every feature in the current deployment earned its place by replacing a specific point of whiteboard-era friction: lost papers, lost topics, or lost threads of who had taught what.

## Architecture and Replication Path

The platform is a Next.js application backed by Supabase (PostgreSQL, authentication, and file storage) and deployed on Vercel (Figure 2). All three vendors offer generous free tiers; for a program of our size generating roughly 20 papers per year at approximately 250 KB per PDF, hosting costs are effectively zero. The codebase is written in TypeScript, styled with Tailwind CSS and shadcn/ui components, mobile-responsive by default, and released under a permissive open-source license.

A program director wishing to deploy a copy proceeds as follows: (1) fork the public GitHub repository; (2) create a new Supabase project and apply the provided database migrations; (3) edit a single configuration file to set the allowed email domains and initial admin allowlist; (4) optionally run the included import script to backfill a historical archive from local folders of PDFs, which auto-extracts title, authors, and year from embedded PDF metadata; and (5) connect the fork to Vercel and deploy. Each step takes minutes. The full end-to-end deployment, including historical import of approximately 50 prior journal-club sessions and 100 papers, was accomplished by a non-developer faculty member working from a personal laptop.

The architecture's three-tier shape is intentionally conventional: every layer can be substituted without rewriting the others. Institutions preferring single sign-on over domain-locked email authentication can swap in any SAML or OpenID Connect provider; institutions preferring on-premises infrastructure can run PostgreSQL and the application server on institutional hardware without touching application code.

For institutions wishing to capture teaching cases directly from the clinical workstream without placing protected health information in the cloud database, we implemented an optional integration in which case metadata flows through Microsoft Power Automate into an Excel workbook on institutional OneDrive covered by the institution's existing Business Associate Agreement (Figure 2, inset). The public-facing database stores only non-identifying metadata (fracture type, timestamp, submitter role). This boundary is documented in the repository.

## Governance, Privacy, and Early Experience

Domain-locked institutional email authentication keeps the platform inside a circle of clinicians and trainees already bound by institutional privacy obligations. No protected health information is stored in the primary database; identifiable teaching-case details are written only to institutional OneDrive under an existing Business Associate Agreement, via a one-way webhook. This pattern makes the platform safe to adopt at most academic centers without a new institutional review board submission or a new vendor agreement.

Since deployment, the platform has hosted weekly journal club, weekly fracture case conference, and weekly anatomy session for our 25-resident program, with a backfilled archive of approximately 50 prior journal-club sessions and 100 papers. Adoption was immediate because the platform replaces existing infrastructure — whiteboard, email attachments, institutional memory — rather than adding new expectations of residents or faculty.

## Potential Impact and Future Work

The core contribution of this innovation is not technical novelty — the architecture is intentionally ordinary — but *replicability at zero marginal cost* for a residency-scale didactic curriculum. Orthopaedic residency programs across the United States run structurally similar weekly curricula, and most coordinate them today with ad-hoc tools. A shared open-source substrate would let programs inherit each other's improvements, pool curricular artifacts (for example, the teaching-case repository, which grows more valuable with scale), and generate machine-readable records of didactic content suitable for future scholarly work.

Planned next steps include (1) a formal evaluation of resident satisfaction and archive utilization across one full academic year; (2) a multi-institutional deployment with anonymized cross-program analytics on which papers are being taught at which programs; and (3) an integrated teaching-case dashboard that links repository entries to ACGME case logs where residents opt in. The repository is hosted publicly at [GITHUB URL] under a permissive open-source license; we invite other programs to fork it, adapt it, and contribute back.

---

## Figure Legends

**Figure 1.** Annotated screenshot of the OHSU Orthopaedic Trauma Didactics platform home page. The six-week rolling calendar (left) displays upcoming journal-club, fracture-conference, and anatomy sessions with attached pre-reading PDFs; the right column shows the past-session archive, teaching-case repository, research-ideas log, resource-link library, and webinar listings. Administrative controls (not shown) are visible only to users on the faculty allowlist.

**Figure 2.** System architecture and replication flow. The Next.js web application is served from Vercel and reads from and writes to a Supabase project (PostgreSQL database, authentication, and PDF storage). Institutional email authentication restricts access to allowlisted domains. *Inset:* optional HIPAA-compatible teaching-case capture pattern: case metadata is posted via webhook to Microsoft Power Automate, which appends to an Excel workbook in institutional OneDrive covered under an existing Business Associate Agreement; only non-identifying fields are mirrored to the primary database.

**Figure 3.** Side-by-side comparison of whiteboard-era and platform-era workflows for a single journal-club session, from topic selection through paper distribution, session conduct, and long-term archival. The platform converts each stage from a transient, faculty-maintained artifact into a durable, searchable record.

---

## References

*The list below is a starting set. Items flagged [VERIFY] are placeholders I could not confirm without access to your reference manager; please replace with the specific citation you use. The remainder are well-known and can be left as-is pending a quick PubMed double-check for volume/page accuracy.*

1. Deenadayalan Y, Grimmer-Somers K, Prior M, Kumar S. How to run an effective journal club: a systematic review. J Eval Clin Pract. 2008;14(5):898-911.
2. Alguire PC. A review of journal clubs in postgraduate medical education. J Gen Intern Med. 1998;13(5):347-353.
3. Accreditation Council for Graduate Medical Education. ACGME Program Requirements for Graduate Medical Education in Orthopaedic Surgery. [VERIFY year and URL of current version]
4. [VERIFY — a recent paper on asynchronous / web-based learning in orthopaedic residency]
5. [VERIFY — a recent paper on journal-club formats in orthopaedic surgery specifically]
6. U.S. Department of Health and Human Services. Summary of the HIPAA Privacy Rule. HHS.gov. [VERIFY current URL]
7. U.S. Department of Health and Human Services. Business Associate Contracts: Sample Business Associate Agreement Provisions. HHS.gov. [VERIFY current URL]
8. Next.js documentation. Vercel Inc. https://nextjs.org/docs
9. Supabase documentation. Supabase Inc. https://supabase.com/docs
10. [VERIFY — a paper on open-source adoption in medical education infrastructure, if one exists that fits]

---

## Submission checklist (from JBJS Innovation requirements)

- [x] ≤1,500 words in body (current draft: approximately 1,330 words; leaves headroom for edits)
- [x] ≤3 tables/figures total (3 figures, 0 tables)
- [x] No abstract required
- [ ] ORCID iDs obtained for all five authors and added to Editorial Manager profiles
- [ ] ICMJE Conflict of Interest form completed by each author
- [ ] Figures produced as TIFF or EPS per JBJS Guidelines for Figures
- [ ] Title page with full author details, degrees, affiliations, and corresponding author email
- [ ] CRediT contributor roles assigned per author in Editorial Manager
- [ ] Public GitHub repository URL inserted wherever `[GITHUB URL]` appears
- [ ] Optional appendix: any quantitative outcome data (resident satisfaction, archive usage) if collected before submission
- [ ] Double-check that institution and author names do not appear in figure captions or figure images (double-blinded review; editorial office strips these from the title page and body)

---

## Notes for author review

Items that need your verification before we finalize:

1. **Deployment timeline.** I wrote "since deployment" without a concrete duration — if you want to anchor it (e.g., "since August 2025"), insert the month. The phrase "approximately six months" that I had earlier is removed pending your confirmation.
2. **Archive size.** "~50 prior journal-club sessions and 100 papers" is pulled from our earlier scoping; confirm these numbers match what actually imported successfully.
3. **Kenneth Gundle's middle initial** — add if he uses one on publications.
4. **Author order.** I used the order you gave me (DeKeyser, Friess, Working, Gundle, Brodke). Confirm this is the byline order you want; CRediT roles and senior-author placement are yours to decide.
5. **OTA vs. AO-only fracture tagging.** You've described the dropdown as "fracture type" — I wrote "AO/OTA" since that's the joint nomenclature standard in North American trauma; change to just "AO" if the dropdown is AO-only.
6. **The third figure** (workflow comparison) is a *new* asset that doesn't exist yet — we'd need to produce it. Say the word and I'll sketch it.
