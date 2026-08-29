// Busca os posts recentes do Instagram (via Graph API oficial da Meta) e
// sincroniza com a tabela public.book_posts no Supabase.
//
// Roda SOMENTE no GitHub Actions (ver .github/workflows/sync-instagram.yml),
// nunca no navegador: usa a service_role key do Supabase e o token de acesso
// do Instagram, que são segredos e nunca podem ir para o código do site.
//
// Variáveis de ambiente obrigatórias (definidas como "Secrets" no GitHub):
//   IG_ACCESS_TOKEN         token de acesso de longa duração (Instagram API with Instagram Login)
//   SUPABASE_URL            Project URL do Supabase (mesma do PUBLIC_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY  service_role key do Supabase (Project Settings → API)
//
// Ver instruções completas no README.md, seção "Sincronização automática do
// Instagram".

import { createClient } from '@supabase/supabase-js';

const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const GRAPH_API_VERSION = 'v21.0';
// Só precisamos dos posts recentes: a tabela mantém no máximo 6 vídeos + 3
// fotos "não fixados" (o resto é apagado sozinho por um gatilho no banco).
const LIMIT = 25;

function precisaDeVariavel(nome, valor) {
  if (!valor) {
    console.error(`Faltando a variável de ambiente ${nome}. Veja o README.md.`);
    process.exit(1);
  }
}

precisaDeVariavel('IG_ACCESS_TOKEN', IG_ACCESS_TOKEN);
precisaDeVariavel('SUPABASE_URL', SUPABASE_URL);
precisaDeVariavel('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** Converte o media_type da Graph API no "tipo" usado no site. */
function mapearTipo(mediaType) {
  if (mediaType === 'VIDEO' || mediaType === 'REELS') return 'video';
  return 'foto';
}

async function buscarPostsDoInstagram() {
  // "me" funciona porque o token já é da própria conta do Instagram — não
  // precisa de um ID de conta separado nem de Página do Facebook vinculada.
  const campos = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const url =
    `https://graph.instagram.com/${GRAPH_API_VERSION}/me/media` +
    `?fields=${campos}&limit=${LIMIT}&access_token=${IG_ACCESS_TOKEN}`;

  const resposta = await fetch(url);
  const corpo = await resposta.json();

  if (!resposta.ok) {
    const mensagem = corpo?.error?.message || resposta.statusText;
    throw new Error(`Instagram API retornou erro: ${mensagem}`);
  }

  return corpo.data ?? [];
}

async function buscarIdsFixados() {
  const { data, error } = await supabase
    .from('book_posts')
    .select('ig_media_id')
    .eq('pinned', true)
    .not('ig_media_id', 'is', null);

  if (error) throw error;
  return new Set(data.map((linha) => linha.ig_media_id));
}

async function main() {
  console.log('Buscando posts recentes do Instagram...');
  const posts = await buscarPostsDoInstagram();
  console.log(`${posts.length} posts encontrados.`);

  // Nunca sobrescrevemos um post que o dono do site fixou manualmente
  // (pinned = true) no Table Editor — só tocamos nos "não fixados".
  const idsFixados = await buscarIdsFixados();

  const linhas = posts
    .filter((post) => !idsFixados.has(post.id))
    .map((post) => ({
      ig_media_id: post.id,
      tipo: mapearTipo(post.media_type),
      pinned: false,
      instagram_url: post.permalink,
      thumbnail_url: post.thumbnail_url || post.media_url,
      video_url: mapearTipo(post.media_type) === 'video' ? post.media_url : null,
      titulo: post.caption ? post.caption.slice(0, 120) : null,
      created_at: post.timestamp,
    }));

  if (linhas.length === 0) {
    console.log('Nada novo para sincronizar.');
    return;
  }

  const { error } = await supabase
    .from('book_posts')
    .upsert(linhas, { onConflict: 'ig_media_id' });

  if (error) throw error;

  console.log(`${linhas.length} posts sincronizados com sucesso.`);
}

main().catch((erro) => {
  console.error('Falha ao sincronizar Instagram → Supabase:', erro.message);
  process.exit(1);
});
