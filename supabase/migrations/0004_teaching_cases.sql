-- Teaching Case Repository mirror table.
-- The source-of-truth for cases (with PHI) lives in OneDrive/SharePoint:
-- Teaching_Case_Repository.xlsx. This table mirrors only the non-PHI
-- metadata (fracture type, free-text notes, submitter) so the website
-- has a submission log even if the Power Automate flow fails.

create table public.teaching_cases (
  id uuid primary key default gen_random_uuid(),
  fracture_type text not null,
  notes text,
  submitter_user_id uuid references auth.users (id) on delete set null,
  submitter_name text,
  submitter_email text,
  submitted_at timestamptz not null default now()
);
create index teaching_cases_submitted_at_idx
  on public.teaching_cases (submitted_at desc);

alter table public.teaching_cases enable row level security;

-- Any authenticated user can read + insert; admins can delete.
create policy teaching_cases_select_auth
  on public.teaching_cases for select
  to authenticated
  using (true);

create policy teaching_cases_insert_self
  on public.teaching_cases for insert
  to authenticated
  with check (
    submitter_user_id is null or submitter_user_id = auth.uid()
  );

create policy teaching_cases_delete_admin
  on public.teaching_cases for delete
  to authenticated
  using (public.is_admin());
