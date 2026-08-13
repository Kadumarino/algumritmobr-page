// Configurações centrais do site.
// Sem painel administrativo, este é o arquivo mais importante para manutenção:
// atualize os valores abaixo (marcados com TODO) assim que tiver as informações reais.

export const siteConfig = {
  nome: 'Algum Ritmo',
  tagline: 'Projeto Acústico que eleva a música para outro mundo',
  descricaoCurta:
    'Projeto acústico com anos de mercado, especializado em hotéis, casas noturnas e eventos sofisticados. Repertório dos anos 60 aos dias atuais, com troca de papéis ao vivo entre os músicos.',

  whatsappNumero: '5519986021602',
  whatsappMensagemPadrao:
    'Olá! Gostaria de solicitar um orçamento para um evento.',

  // Segundo contato (exibido na página de Contato).
  whatsappNumeroSecundario: '5519988200563',
  whatsappNomeSecundario: 'Guilherme Foganhollo',
  whatsappNomePrincipal: 'Carlos Eduardo',

  instagramHandle: '@algumritmobr',
  instagramUrl: 'https://instagram.com/algumritmobr',

  youtubeUrl: 'https://youtube.com/@algumritmobr',

  emailContato: 'algumritmobr@gmail.com',

  spotifyPlaylistId: '27g2DyU29lJQZs9zfHDXpv',

  // TODO: ID do Google Calendar público usado na página /agenda/.
  // Como obter: crie uma agenda no Google Calendar (ex.: "Agenda Algum Ritmo") →
  // menu "⋮" da agenda → Configurações e compartilhamento → em "Acesso de compartilhamento"
  // marque "Disponibilizar publicamente" → role até "Integrar agenda" e copie o "ID da agenda"
  // (formato algo@group.calendar.google.com). Cole o valor abaixo.
  // Os eventos criados/editados nessa agenda (pelo Google Calendar, celular ou computador)
  // aparecem automaticamente no site — não é necessário mexer no código nem publicar de novo.
  googleCalendarId: 'algumritmobr@gmail.com',

  formspreeEndpoint: 'https://formspree.io/f/xvkpankv',
} as const;
