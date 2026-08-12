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
| Depoimentos (página desativada no momento, sem link no menu) | [src/content/depoimentos/](src/content/depoimentos/) (um arquivo `.json` por depoimento) |
| Textos das páginas (Início, Sobre, etc.) | arquivos `.astro` em [src/pages/](src/pages/) |
| Logotipos (2 versões) | [public/images/logo/](public/images/logo/) |

## Pendências antes do lançamento (buscar com o cliente)

Procure no código por comentários `TODO` — todos marcam um placeholder a substituir. Os principais:

- Vídeos reais do YouTube do projeto (`src/data/videos.json`) — verificar se os 2 links do bloco "Vídeos" na Home estão corretos (o cliente enviou o mesmo link duas vezes)
- Textos finais (história do projeto, repertório completo)
- Reativar a página de Depoimentos quando houver depoimentos reais (adicionar de volta o link em `src/components/Header.astro` e `src/components/Footer.astro`)
- Usuário/organização do GitHub em `astro.config.mjs` (`SITE_URL`) e em `public/robots.txt`, para as tags de SEO e o sitemap ficarem corretos

## Domínio próprio (opcional, futuro)

Caso comprem um domínio próprio, adicione um arquivo `public/CNAME` com o domínio (ex:
`algumritmo.com.br`), configure o DNS apontando para o GitHub Pages e ajuste `site`/`base` em
`astro.config.mjs`.
