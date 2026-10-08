create table public.project_reviews (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  data jsonb not null,
  project_id uuid generated always as ((data->>'projectId')::uuid) stored,
  foreign key(project_id,user_id) references public.projects(id,user_id),
  check (data->>'id' = id::text and data->>'userId' = user_id::text)
);
alter table public.project_reviews enable row level security;
create policy owner_read on public.project_reviews for select to authenticated using (auth.uid() = user_id);
create policy owner_insert on public.project_reviews for insert to authenticated with check (auth.uid() = user_id);
revoke all on public.project_reviews from anon, authenticated;
grant select, insert on public.project_reviews to authenticated;
grant all on public.project_reviews to service_role;
create index project_reviews_owner_project_idx on public.project_reviews(user_id,project_id);
