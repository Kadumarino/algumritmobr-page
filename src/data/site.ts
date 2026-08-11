// Configurações centrais do site.
// Sem painel administrativo, este é o arquivo mais importante para manutenção:
// atualize os valores abaixo (marcados com TODO) assim que tiver as informações reais.

export const siteConfig = {
  nome: 'Algum Ritmo',
  tagline: 'Duo Acústico para Eventos Sofisticados',
  descricaoCurta:
    'Duo acústico com anos de mercado, especializado em hotéis, casas noturnas e eventos sofisticados. Repertório dos anos 60 aos dias atuais, com troca de papéis ao vivo entre os músicos.',

  // TODO: substituir pelo número real de WhatsApp (com DDI+DDD, somente números).
  whatsappNumero: '5511999999999',
  whatsappMensagemPadrao:
    'Olá! Gostaria de solicitar um orçamento para um evento.',

  // TODO: confirmar/atualizar o @ real do Instagram do duo.
  instagramHandle: '@algumritmo',
  instagramUrl: 'https://instagram.com/algumritmo',

  // TODO: substituir pelo e-mail real de contato.
  emailContato: 'contato@algumritmo.com.br',

  // TODO: substituir pelo ID da playlist real do duo no Spotify.
  // Placeholder atual: playlist pública "Top 50 Global" do Spotify, apenas para demonstração do embed.
  spotifyPlaylistId: '37i9dQZEVXbMDoHDwVN2tF',

  // TODO: criar um formulário em https://formspree.io e substituir pelo endpoint real.
  formspreeEndpoint: 'https://formspree.io/f/SUBSTITUIR',
} as const;
