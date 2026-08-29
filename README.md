# Algum Ritmo — Site institucional

Site institucional do projeto acústico **Algum Ritmo**, construído em [Astro](https://astro.build) e publicado gratuitamente no **GitHub Pages**.

## Como rodar localmente

```sh
npm install
npm run dev
```

Acesse `http://localhost:4321/web-page-algumritmo/`.

## Como publicar (deploy)

O deploy é automático: todo push na branch `main` dispara o workflow em
[.github/workflows/deploy.yml](.github/workflows/deploy.yml), que builda o site e publica no GitHub Pages.

Antes do primeiro deploy, no repositório do GitHub: **Settings → Pages → Source → GitHub Actions**.

## Sem painel administrativo — como atualizar o conteúdo

Este site é 100% estático (GitHub Pages não roda backend/banco de dados), então não existe um
painel visual como o do WordPress. Todo o conteúdo é editado diretamente nos arquivos do
repositório e publicado com `git push`. Os pontos principais de edição são:

| O que editar | Onde |
| --- | --- |
| WhatsApp, Instagram, e-mail, playlist do Spotify, endpoint do Formspree | [src/data/site.ts](src/data/site.ts) |
| Vídeos do YouTube exibidos na Home | [src/data/videos.json](src/data/videos.json) |
| Repertório por década | [src/content/repertorio/](src/content/repertorio/) (`parte-1.json`, `parte-2.json`) |
| Depoimentos | [src/content/depoimentos/](src/content/depoimentos/) (um arquivo `.json` por depoimento) |
| Agenda de shows (Google Calendar) | [src/data/site.ts](src/data/site.ts) (`googleCalendarId`) |
| Textos das páginas (Início, Sobre, etc.) | arquivos `.astro` em [src/pages/](src/pages/) |
| Logotipos (2 versões) | [public/images/logo/](public/images/logo/) |

## Pendências antes do lançamento (buscar com o cliente)

Procure no código por comentários `TODO` — todos marcam um placeholder a substituir. Os principais:

- Vídeos reais do YouTube do projeto (`src/data/videos.json`) — verificar se os 2 links do bloco "Vídeos" na Home estão corretos (o cliente enviou o mesmo link duas vezes)
- Textos finais (história do projeto, repertório completo)
- Criar a agenda no Google Calendar e preencher `googleCalendarId` em `src/data/site.ts` (ver instruções no comentário acima do campo) para a página /agenda/ funcionar
- Usuário/organização do GitHub em `astro.config.mjs` (`SITE_URL`) e em `public/robots.txt`, para as tags de SEO e o sitemap ficarem corretos
- Criar o projeto Supabase e preencher o `.env` (ver seção "Depoimentos e comentários públicos" abaixo) para a página /depoimentos/ e a galeria /book/ funcionarem
- Gerar o token do Instagram e cadastrar os Secrets no GitHub (ver seção "Book — fotos e vídeos do Instagram" abaixo) para a sincronização automática da galeria /book/ funcionar

## Depoimentos e comentários públicos (Supabase)

A página `/depoimentos/` recebe depoimentos e comentários enviados pelo público (com foto/avatar
gerado a partir do @ do Instagram, já que não é possível puxar a foto de perfil real do
Instagram automaticamente e de graça sem violar os termos de uso deles). Como o site é 100%
estático, isso usa o [Supabase](https://supabase.com) (banco Postgres com plano gratuito),
chamado direto do navegador — sem servidor próprio para manter.

Para ativar:

1. Crie uma conta e um projeto grátis em [supabase.com](https://supabase.com).
2. Abra o **SQL Editor** do projeto e rode o conteúdo de [supabase/schema.sql](supabase/schema.sql) uma única vez (cria as tabelas, as políticas de segurança e as funções de curtida).
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.
4. Copie [.env.example](.env.example) para `.env` (não versionado) e cole os dois valores.
5. Rode `npm run dev` ou publique normalmente — sem o `.env` preenchido, os formulários simplesmente ficam desativados (o resto do site continua funcionando normalmente).

**Moderação:** todo depoimento/comentário novo entra como `pending` e só aparece no site depois
de aprovado manualmente. As instruções de aprovação (comandos SQL prontos para copiar/colar)
estão no final do arquivo [supabase/schema.sql](supabase/schema.sql).

## Book — fotos e vídeos do Instagram (Supabase + sincronização automática)

A página `/book/` também usa o mesmo projeto Supabase (tabela `book_posts`, criada pelo mesmo
[supabase/schema.sql](supabase/schema.sql)) para carregar rápido — em vez dos widgets pesados
de embed do Instagram, ela mostra miniaturas leves que linkam para a publicação original.

Os posts são sincronizados **automaticamente** a cada 6 horas por um job no GitHub Actions
([.github/workflows/sync-instagram.yml](.github/workflows/sync-instagram.yml), que roda
[scripts/sync-instagram.mjs](scripts/sync-instagram.mjs)) usando a API oficial da Meta
(Instagram Graph API) — nada de scraping. Esse job só existe porque o site é 100% estático:
ele roda no GitHub, nunca no navegador do visitante, porque os tokens usados são segredos.

**Configuração inicial (feita uma única vez, direto no painel da Meta):**

1. A conta do Instagram precisa ser **profissional** (Business ou Creator) — não precisa de
   Página do Facebook vinculada. Isso se faz pelo próprio app do Instagram, em Configurações da
   conta → Tipo de conta.
2. Crie um app em [developers.facebook.com/apps](https://developers.facebook.com/apps), adicione
   o produto **Instagram** e escolha a opção **"API setup with Instagram login"** (não a versão
   "with Facebook login" — essa é a que exige Página). Lá o painel mostra o **Instagram app ID**
   e o **Instagram app secret** do app.
3. Ainda nesse painel, adicione a conta do Instagram como "tester"/usuário autorizado e gere a
   **URL de autorização** (o próprio painel da Meta monta essa URL pra você, com o `client_id`
   já preenchido). Abra essa URL, faça login com a conta do Instagram da Algum Ritmo e autorize
   — o Instagram redireciona de volta com um parâmetro `?code=...` na URL.
4. Troque esse `code` por um token (isso é feito uma única vez, na sua máquina — não fica
   gravado em lugar nenhum do projeto):
   ```powershell
   curl.exe -X POST https://api.instagram.com/oauth/access_token `
     -F "client_id=SEU_INSTAGRAM_APP_ID" `
     -F "client_secret=SEU_INSTAGRAM_APP_SECRET" `
     -F "grant_type=authorization_code" `
     -F "redirect_uri=SUA_REDIRECT_URI" `
     -F "code=O_CODE_QUE_VOCE_RECEBEU"
   ```
   Isso devolve um token **de curta duração** (dura só 1 hora) + o `user_id`. Em seguida, troque
   por um token **de longa duração** (~60 dias), já usando o token curto acima:
   ```powershell
   curl.exe "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=SEU_INSTAGRAM_APP_SECRET&access_token=TOKEN_DE_CURTA_DURACAO"
   ```
   É esse token de longa duração (campo `access_token` da resposta) que vira o segredo
   `IG_ACCESS_TOKEN`.
5. Em **Project Settings → API** do Supabase, copie a **service_role key** (⚠️ diferente da
   anon key — nunca coloque essa chave no `.env` do site nem em código do front-end).
6. No repositório do GitHub, vá em **Settings → Secrets and variables → Actions** e cadastre:
   `IG_ACCESS_TOKEN` e `SUPABASE_SERVICE_ROLE_KEY` (o `PUBLIC_SUPABASE_URL` já existe, criado no
   passo do deploy).

Depois disso o job já roda sozinho a cada 6 horas; para forçar uma sincronização na hora, vá na
aba **Actions** do GitHub → "Sincronizar Instagram (Book)" → **Run workflow**.

### Renovação automática do token

O token de longa duração da Meta expira a cada ~60 dias. Para não precisar repetir o passo 4
manualmente, existe um segundo job
([.github/workflows/refresh-instagram-token.yml](.github/workflows/refresh-instagram-token.yml),
que roda [scripts/refresh-instagram-token.mjs](scripts/refresh-instagram-token.mjs)) que renova
o token toda semana e já atualiza o Secret `IG_ACCESS_TOKEN` sozinho, usando a API do GitHub —
sem precisar do app secret de novo (o endpoint de renovação só pede o próprio token atual).

Configuração extra (feita uma única vez):

1. Crie um **fine-grained personal access token** do GitHub em
   [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens/new):
   em **Repository access**, escolha "Only select repositories" e selecione **só este
   repositório**; em **Permissions → Repository permissions**, dê "Read and write" para
   **Secrets** (nenhuma outra permissão é necessária). Isso vira o segredo `GH_PAT`.
   ⚠️ Esse token é sensível (consegue reescrever os outros Secrets deste repositório) — por
   isso o acesso fica restrito a só este repositório e só à permissão de Secrets.
2. Cadastre `GH_PAT` em **Settings → Secrets and variables → Actions**, junto dos outros.

A partir daí, o job roda sozinho toda segunda-feira e o token nunca mais precisa ser trocado à
mão — só se o `GH_PAT` (que dura no máximo 1 ano, prazo escolhido na hora de criar) ou a conta
do Instagram perderem a autorização do app, aí sim é preciso refazer o passo 3–4 do item
anterior e/ou gerar um novo `GH_PAT`.

**Post fixado ("Destaques"):** o job automático nunca mexe em linhas com `pinned = true` — para
fixar um post no topo (ex.: um vídeo especial), edite a linha manualmente pelo **Table Editor**
do Supabase (tabela `book_posts`) e marque `pinned = true`.

A página sempre mostra: todos os `pinned = true`, os 6 vídeos mais recentes (`pinned = false`) e
as 3 fotos mais recentes (`pinned = false`). Um gatilho no banco já apaga sozinho o mais antigo
quando um novo post ultrapassa esse limite — não precisa apagar na mão.

## Domínio próprio (opcional, futuro)

Caso comprem um domínio próprio, adicione um arquivo `public/CNAME` com o domínio (ex:
`algumritmo.com.br`), configure o DNS apontando para o GitHub Pages e ajuste `site`/`base` em
`astro.config.mjs`.
