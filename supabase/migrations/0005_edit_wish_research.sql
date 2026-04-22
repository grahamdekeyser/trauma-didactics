-- Allow admins to edit wish list items and research ideas (mirrors the
-- admin-only delete behavior already in place).

drop policy if exists wish_list_update_admin on public.wish_list;
create policy wish_list_update_admin
  on public.wish_list for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists research_ideas_update_admin on public.research_ideas;
create policy research_ideas_update_admin
  on public.research_ideas for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
