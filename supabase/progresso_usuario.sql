create table if not exists public.progresso_usuario (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  sinais_vistos      jsonb       not null default '[]'::jsonb,
  termos_favoritos   jsonb       not null default '[]'::jsonb,
  quizzes_concluidos jsonb       not null default '[]'::jsonb,
  pontuacoes         jsonb       not null default '{}'::jsonb,
  atualizado_em      timestamptz not null default now()
);
alter table public.progresso_usuario enable row level security;

drop policy if exists "progresso_select_proprio" on public.progresso_usuario;
create policy "progresso_select_proprio"
  on public.progresso_usuario
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "progresso_insert_proprio" on public.progresso_usuario;
create policy "progresso_insert_proprio"
  on public.progresso_usuario
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "progresso_update_proprio" on public.progresso_usuario;
create policy "progresso_update_proprio"
  on public.progresso_usuario
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "progresso_delete_proprio" on public.progresso_usuario;
create policy "progresso_delete_proprio"
  on public.progresso_usuario
  for delete
  to authenticated
  using (auth.uid() = user_id);
create or replace function public.atualizar_timestamp_progresso()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_progresso_atualizado_em on public.progresso_usuario;
create trigger trg_progresso_atualizado_em
  before update on public.progresso_usuario
  for each row
  execute function public.atualizar_timestamp_progresso();
create index if not exists idx_progresso_atualizado_em
  on public.progresso_usuario (atualizado_em desc);
