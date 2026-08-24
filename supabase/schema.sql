-- Algum Ritmo — schema do Supabase para depoimentos e comentários públicos
-- Como usar: crie um projeto grátis em https://supabase.com, abra o "SQL Editor"
-- e cole/rode este arquivo inteiro uma única vez. Depois copie em Project Settings
-- > API: "Project URL" e "anon public key" para o arquivo .env (ver .env.example).

-- ============================================================================
-- Depoimentos enviados pelo público via /depoimentos/enviar/
-- ============================================================================
create table if not exists public.depoimentos_publicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 80),
  instagram text not null check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  texto text not null check (char_length(texto) between 1 and 300),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Comentários exibidos abaixo dos cards de depoimentos
-- ============================================================================
create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  instagram text not null check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  texto text not null check (char_length(texto) between 1 and 500),
  likes_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

create index if not exists depoimentos_publicos_status_idx on public.depoimentos_publicos (status, created_at desc);
create index if not exists comentarios_status_idx on public.comentarios (status, created_at desc);

-- ============================================================================
-- Row Level Security — o site usa a "anon key" (pública, sem segredo) direto
-- do navegador. As políticas abaixo garantem que qualquer visitante só
-- consegue: (1) ler o que já foi aprovado, e (2) inserir um novo registro
-- SEMPRE como 'pending'. Aprovar/rejeitar só é feito manualmente pelo painel
-- do Supabase (Table Editor), com a service_role key, que nunca fica no site.
-- ============================================================================
alter table public.depoimentos_publicos enable row level security;
alter table public.comentarios enable row level security;

create policy "select_depoimentos_aprovados" on public.depoimentos_publicos
  for select using (status = 'approved');

create policy "insert_depoimentos_pendentes" on public.depoimentos_publicos
  for insert with check (status = 'pending');

create policy "select_comentarios_aprovados" on public.comentarios
  for select using (status = 'approved');

create policy "insert_comentarios_pendentes" on public.comentarios
  for insert with check (status = 'pending' and likes_count = 0);

grant usage on schema public to anon;
grant select, insert on public.depoimentos_publicos to anon;
grant select, insert on public.comentarios to anon;

-- ============================================================================
-- Curtidas ("amei") — incremento/decremento atômico via função, em vez de
-- "ler o valor, somar e escrever de volta" no cliente (evita duas pessoas
-- curtindo ao mesmo tempo e uma curtida se perder). Only affects approved rows.
-- ============================================================================
create or replace function public.incrementar_like(p_comentario_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.comentarios
  set likes_count = likes_count + 1
  where id = p_comentario_id and status = 'approved'
  returning likes_count;
$$;

create or replace function public.decrementar_like(p_comentario_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.comentarios
  set likes_count = greatest(likes_count - 1, 0)
  where id = p_comentario_id and status = 'approved'
  returning likes_count;
$$;

grant execute on function public.incrementar_like(uuid) to anon;
grant execute on function public.decrementar_like(uuid) to anon;

-- ============================================================================
-- Moderação manual (rode no SQL Editor sempre que quiser aprovar algo):
--   select id, nome, instagram, texto, created_at from public.depoimentos_publicos where status = 'pending' order by created_at desc;
--   update public.depoimentos_publicos set status = 'approved' where id = 'COLE-O-ID-AQUI';
--
--   select id, instagram, texto, created_at from public.comentarios where status = 'pending' order by created_at desc;
--   update public.comentarios set status = 'approved' where id = 'COLE-O-ID-AQUI';
-- Para rejeitar/apagar, use "delete from ... where id = '...'" no lugar do update.
-- ============================================================================
