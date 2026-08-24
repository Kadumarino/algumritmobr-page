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
| Posts do Instagram exibidos na página Book | [src/data/instagram-posts.json](src/data/instagram-posts.json) |
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
- Criar o projeto Supabase e preencher o `.env` (ver seção "Depoimentos e comentários públicos" abaixo) para a página /depoimentos/ funcionar

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

## Domínio próprio (opcional, futuro)

Caso comprem um domínio próprio, adicione um arquivo `public/CNAME` com o domínio (ex:
`algumritmo.com.br`), configure o DNS apontando para o GitHub Pages e ajuste `site`/`base` em
`astro.config.mjs`.
