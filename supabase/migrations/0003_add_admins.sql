-- Grant admin access to Brodke, Friess, and Working.
insert into public.admins (email) values
  ('brodke@ohsu.edu'),
  ('friessd@ohsu.edu'),
  ('workingz@ohsu.edu')
  on conflict do nothing;
