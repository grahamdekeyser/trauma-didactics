-- Trauma Didactics — initial schema
-- Paste this whole file into Supabase SQL Editor → Run.

------------------------------------------------------------------
-- Enums
------------------------------------------------------------------
create type public.session_type as enum (
  'breakfast_club',
  'fracture_conference',
  'virtuohsu'
);

create type public.submitter_role as enum ('resident', 'faculty');

------------------------------------------------------------------
-- Tables
------------------------------------------------------------------
create table public.admins (
  email text primary key,
  added_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  type public.session_type not null,
  date date not null,
  topic text,
  webex_url text,
  created_at timestamptz not null default now(),
  unique (type, date)
);
create index sessions_date_idx on public.sessions (date desc);

create table public.papers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  title text not null,
  citation text,
  pubmed_url text,
  pdf_path text,
  needs_cleanup boolean not null default false,
  created_at timestamptz not null default now()
);
create index papers_session_id_idx on public.papers (session_id);

create table public.wish_list (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  submitter_name text not null,
  submitter_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.wish_list_votes (
  wish_list_id uuid not null references public.wish_list (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wish_list_id, user_id)
);

create table public.research_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  "references" text not null default '',
  description text not null,
  submitter_role public.submitter_role not null,
  submitter_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.webinars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  url text not null,
  source text,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

------------------------------------------------------------------
-- Helpers
------------------------------------------------------------------
-- Returns true if the caller's email is in the admins table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.email = (auth.jwt() ->> 'email')
  );
$$;

------------------------------------------------------------------
-- Row-level security
------------------------------------------------------------------
alter table public.admins          enable row level security;
alter table public.sessions        enable row level security;
alter table public.papers          enable row level security;
alter table public.wish_list       enable row level security;
alter table public.wish_list_votes enable row level security;
alter table public.research_ideas  enable row level security;
alter table public.webinars        enable row level security;
alter table public.resources       enable row level security;

-- admins: only admins can see the admin list
create policy admins_select_admin
  on public.admins for select
  to authenticated
  using (public.is_admin());

-- sessions: anyone logged in can read; only admins can write
create policy sessions_select_auth
  on public.sessions for select
  to authenticated
  using (true);

create policy sessions_write_admin
  on public.sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- papers: anyone logged in can read; only admins can write
create policy papers_select_auth
  on public.papers for select
  to authenticated
  using (true);

create policy papers_write_admin
  on public.papers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- wish_list: anyone logged in can read + insert; admins can delete
create policy wish_list_select_auth
  on public.wish_list for select
  to authenticated
  using (true);

create policy wish_list_insert_self
  on public.wish_list for insert
  to authenticated
  with check (submitter_user_id = auth.uid());

create policy wish_list_delete_admin
  on public.wish_list for delete
  to authenticated
  using (public.is_admin());

-- wish_list_votes: anyone logged in can read; can only add/remove own vote
create policy wish_list_votes_select_auth
  on public.wish_list_votes for select
  to authenticated
  using (true);

create policy wish_list_votes_insert_self
  on public.wish_list_votes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy wish_list_votes_delete_self
  on public.wish_list_votes for delete
  to authenticated
  using (user_id = auth.uid());

-- research_ideas: anyone logged in can read + insert; admins can delete
create policy research_ideas_select_auth
  on public.research_ideas for select
  to authenticated
  using (true);

create policy research_ideas_insert_self
  on public.research_ideas for insert
  to authenticated
  with check (
    submitter_user_id is null or submitter_user_id = auth.uid()
  );

create policy research_ideas_delete_admin
  on public.research_ideas for delete
  to authenticated
  using (public.is_admin());

-- webinars: anyone logged in can read; admins write
create policy webinars_select_auth
  on public.webinars for select
  to authenticated
  using (true);

create policy webinars_write_admin
  on public.webinars for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- resources: anyone logged in can read; admins write
create policy resources_select_auth
  on public.resources for select
  to authenticated
  using (true);

create policy resources_write_admin
  on public.resources for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

------------------------------------------------------------------
-- Storage bucket for PDFs (private — signed URLs only)
------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('papers', 'papers', false)
on conflict (id) do nothing;

create policy papers_storage_read_auth
  on storage.objects for select
  to authenticated
  using (bucket_id = 'papers');

create policy papers_storage_write_admin
  on storage.objects for all
  to authenticated
  using (bucket_id = 'papers' and public.is_admin())
  with check (bucket_id = 'papers' and public.is_admin());

------------------------------------------------------------------
-- Seed data
------------------------------------------------------------------
-- Admins (add the other three once you have their emails)
insert into public.admins (email) values ('dekeyser@ohsu.edu')
  on conflict do nothing;

-- Default resource links
insert into public.resources (label, url, sort_order) values
  ('AO Surgery Reference', 'https://surgeryreference.aofoundation.org/', 1),
  ('OTA (Orthopaedic Trauma Association)', 'https://ota.org/', 2),
  ('OrthoBullets', 'https://www.orthobullets.com/', 3)
  on conflict do nothing;
