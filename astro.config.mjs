// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: troque "SEU-USUARIO" pelo usuário/organização real do GitHub assim que o
// repositório for criado, para as tags de SEO (canonical, sitemap, OG) ficarem corretas.
const SITE_URL = 'https://SEU-USUARIO.github.io';
const BASE_PATH = '/web-page-algumritmo';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  integrations: [sitemap()],
});
