create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

grant select, insert, update, delete on public.notes to authenticated;

create policy "Users can view their own notes"
  on public.notes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own notes"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';