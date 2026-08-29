// Renova o token de acesso do Instagram (Meta) antes que ele expire e
// atualiza sozinho o Secret IG_ACCESS_TOKEN no GitHub — assim o job de
// sincronização (scripts/sync-instagram.mjs) nunca fica sem token válido.
//
// Roda SOMENTE no GitHub Actions (ver .github/workflows/refresh-instagram-token.yml),
// nunca no navegador: usa segredos que nunca podem ir para o código do site.
//
// Variáveis de ambiente obrigatórias (definidas como "Secrets" no GitHub):
//   IG_ACCESS_TOKEN   token de acesso atual (o mesmo usado na sincronização)
//   GH_PAT            Personal Access Token (fine-grained) só deste repositório,
//                      com permissão "Secrets: Read and write"
//   GITHUB_REPOSITORY preenchida automaticamente pelo GitHub Actions ("dono/repo")
//
// Ver instruções completas no README.md, seção "Sincronização automática do
// Instagram" → "Renovação automática do token".

import sodium from 'libsodium-wrappers';

const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
const GH_PAT = process.env.GH_PAT;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;

const NOME_SECRET = 'IG_ACCESS_TOKEN';

function precisaDeVariavel(nome, valor) {
  if (!valor) {
    console.error(`Faltando a variável de ambiente ${nome}. Veja o README.md.`);
    process.exit(1);
  }
}

precisaDeVariavel('IG_ACCESS_TOKEN', IG_ACCESS_TOKEN);
precisaDeVariavel('GH_PAT', GH_PAT);
precisaDeVariavel('GITHUB_REPOSITORY', GITHUB_REPOSITORY);

/**
 * Troca o token atual por um novo de longa duração (~60 dias a partir de
 * hoje). Esse endpoint (Instagram API with Instagram Login) só aceita
 * renovar tokens com mais de 24h de vida, mas não exige o App Secret — só
 * o próprio token atual.
 */
async function renovarToken() {
  const url =
    'https://graph.instagram.com/refresh_access_token' +
    `?grant_type=ig_refresh_token&access_token=${IG_ACCESS_TOKEN}`;

  const resposta = await fetch(url);
  const corpo = await resposta.json();

  if (!resposta.ok || !corpo.access_token) {
    const mensagem = corpo?.error?.message || resposta.statusText;
    throw new Error(`Meta recusou a renovação do token: ${mensagem}`);
  }

  return corpo.access_token;
}

/** Chave pública do repositório, necessária para criptografar o valor do secret. */
async function buscarChavePublica(owner, repo) {
  const resposta = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`,
    {
      headers: {
        Authorization: `Bearer ${GH_PAT}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!resposta.ok) {
    throw new Error(`Falha ao buscar a chave pública do repositório: ${resposta.status} ${resposta.statusText}`);
  }

  return resposta.json();
}

/** Criptografa o valor com libsodium (sealed box) e grava o Secret no GitHub. */
async function atualizarSecret(owner, repo, valor, chavePublica) {
  await sodium.ready;

  const chaveBin = sodium.from_base64(chavePublica.key, sodium.base64_variants.ORIGINAL);
  const valorBin = sodium.from_string(valor);
  const criptografado = sodium.crypto_box_seal(valorBin, chaveBin);
  const encryptedValue = sodium.to_base64(criptografado, sodium.base64_variants.ORIGINAL);

  const resposta = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${NOME_SECRET}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GH_PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encrypted_value: encryptedValue, key_id: chavePublica.key_id }),
    }
  );

  if (!resposta.ok) {
    const texto = await resposta.text();
    throw new Error(`Falha ao atualizar o secret ${NOME_SECRET}: ${resposta.status} ${texto}`);
  }
}

async function main() {
  const [owner, repo] = GITHUB_REPOSITORY.split('/');

  console.log('Renovando token de acesso do Instagram junto à Meta...');
  const novoToken = await renovarToken();

  console.log('Token renovado. Atualizando o Secret no GitHub...');
  const chavePublica = await buscarChavePublica(owner, repo);
  await atualizarSecret(owner, repo, novoToken, chavePublica);

  console.log(`Secret ${NOME_SECRET} atualizado com sucesso.`);
}

main().catch((erro) => {
  console.error('Falha ao renovar o token do Instagram:', erro.message);
  process.exit(1);
});
