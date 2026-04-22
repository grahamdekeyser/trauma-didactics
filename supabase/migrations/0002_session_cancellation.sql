-- Allow admins to mark a specific session date as cancelled (e.g. resident
-- graduation, holiday) and optionally attach a short reason that surfaces in
-- the calendar.
alter table public.sessions
  add column if not exists is_cancelled boolean not null default false,
  add column if not exists cancellation_note text;
