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

-- ============================================================================
-- Book — fotos e vídeos em destaque na página /book/. As linhas são
-- preenchidas automaticamente por um job agendado (ver scripts/sync-instagram.mjs
-- e .github/workflows/sync-instagram.yml) que busca os posts recentes do
-- Instagram pela Graph API oficial da Meta e grava aqui usando a
-- service_role key (nunca a anon key, e nunca rodando no navegador). Também
-- é possível adicionar/editar linhas manualmente pelo Table Editor do
-- Supabase (ex.: para os posts "fixados").
--
-- Regras de exibição (aplicadas no front-end, ver src/pages/book.astro):
--   - pinned = true  -> sempre aparece primeiro, na seção "Destaques".
--   - tipo = 'video' e pinned = false -> só os 6 mais recentes aparecem.
--   - tipo = 'foto'  e pinned = false -> só as 3 mais recentes aparecem lado
--     a lado (grid), igual à seção de vídeos.
-- O gatilho abaixo APAGA automaticamente o excedente mais antigo a cada
-- inserção, então a tabela nunca acumula lixo — não precisa apagar na mão.
--
-- IMPORTANTE ao adicionar uma coluna nova (ex.: rodar este arquivo de novo
-- depois de atualizado): o Supabase às vezes não percebe a coluna nova na
-- API na hora. Se aparecer erro "column ... not found in schema cache",
-- rode também: notify pgrst, 'reload schema';
-- ============================================================================
create table if not exists public.book_posts (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('video', 'foto')),
  pinned boolean not null default false,
  instagram_url text not null,
  thumbnail_url text not null,
  -- URL direta do arquivo de vídeo (mp4) na CDN do Instagram, usada para
  -- tocar o vídeo direto na página (sem redirecionar para o Instagram).
  -- Fica null para fotos e para linhas antigas sincronizadas antes desta
  -- coluna existir (nesse caso o card cai de volta para a miniatura).
  video_url text,
  titulo text,
  -- Curtidas e comentários do post no Instagram (só informativo, exibido na
  -- barrinha abaixo da foto/vídeo, como no Instagram). Atualizado a cada
  -- sincronização; fica 0 para linhas antigas até o próximo sync.
  like_count integer not null default 0,
  comments_count integer not null default 0,
  -- ID da publicação no Instagram (preenchido só pelo job automático; linhas
  -- adicionadas manualmente pelo Table Editor ficam com isto null). Serve
  -- para o job saber "atualizar" em vez de duplicar a cada sincronização.
  ig_media_id text unique,
  created_at timestamptz not null default now()
);

-- Caso a tabela já exista de uma versão anterior deste schema (sem a coluna):
alter table public.book_posts add column if not exists ig_media_id text unique;
alter table public.book_posts add column if not exists video_url text;
alter table public.book_posts add column if not exists like_count integer not null default 0;
alter table public.book_posts add column if not exists comments_count integer not null default 0;

create index if not exists book_posts_listagem_idx on public.book_posts (tipo, pinned, created_at desc);

alter table public.book_posts enable row level security;

-- Leitura é pública (é conteúdo de divulgação, não há dado sensível).
-- Não existe policy de insert/update/delete para "anon": só é possível
-- adicionar/editar/remover linhas logado no painel do Supabase (dashboard)
-- ou com a service_role key, nunca pelo navegador do visitante.
create policy "select_book_posts" on public.book_posts
  for select using (true);

grant select on public.book_posts to anon;

create or replace function public.limpar_book_posts_excedentes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  limite integer;
begin
  if new.pinned then
    return new;
  end if;

  limite := case when new.tipo = 'video' then 6 else 3 end;

  delete from public.book_posts
  where id in (
    select id from public.book_posts
    where tipo = new.tipo and pinned = false
    order by created_at desc
    offset limite
  );

  return new;
end;
$$;

drop trigger if exists trg_limpar_book_posts_excedentes on public.book_posts;
create trigger trg_limpar_book_posts_excedentes
after insert on public.book_posts
for each row
execute function public.limpar_book_posts_excedentes();

-- Exemplo de como adicionar uma publicação nova (rode no SQL Editor,
-- trocando os valores): os 2 vídeos fixados usam pinned = true e nunca são
-- removidos automaticamente.
--   insert into public.book_posts (tipo, pinned, instagram_url, thumbnail_url, titulo) values
--     ('video', true, 'https://www.instagram.com/reel/XXXXXXX/', 'https://SEU-BUCKET/thumb.jpg', 'Show no Hotel X');
-- ============================================================================

