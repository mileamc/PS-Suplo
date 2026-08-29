/* ============================================================
   Conteúdo do site do case.
   Textos do briefing_site_case_claude_code.md e dos SVGs anexos.
   Nada aqui é inventado — cada bloco tem origem no material.
   ============================================================ */

export const AUTOR = {
  nome: 'Milena Caldas',
  papel: 'Product Designer',
  email: 'milena.am.caldas@gmail.com',
};

export interface Secao {
  id: string;
  numero: string;
  titulo: string;
  curto: string;
}

/**
 * O protótipo vem logo depois do overview, e não no fim: quem abre o case
 * quer ver a coisa funcionando antes de ler como ela foi decidida. As
 * seções seguintes explicam o percurso que levou até ele.
 */
export const SECOES: Secao[] = [
  { id: 'overview', numero: '01', titulo: 'Overview do projeto', curto: 'Overview' },
  { id: 'prototipo', numero: '02', titulo: 'Protótipo interativo', curto: 'Protótipo' },
  { id: 'processo', numero: '03', titulo: 'Etapas do processo', curto: 'Processo' },
  { id: 'fluxogramas', numero: '04', titulo: 'Fluxogramas originais, comentados', curto: 'Fluxogramas' },
  { id: 'fluxo-v1', numero: '05', titulo: 'Fluxo de estados (V1)', curto: 'Fluxo V1' },
  { id: 'fluxo-enriquecido', numero: '06', titulo: 'Fluxo enriquecido, atores e notificações', curto: 'Atores' },
  { id: 'fluxo-telas', numero: '07', titulo: 'Fluxo de telas do protótipo', curto: 'Telas' },
  { id: 'priorizacao', numero: '08', titulo: 'MVP, V.1, V.2 e V.3', curto: 'Priorização' },
  { id: 'encerramento', numero: '09', titulo: 'Encerramento', curto: 'Encerramento' },
];

/* ---------------- 03 · Etapas do processo ------------------- */
export const ETAPAS = [
  {
    titulo: 'Entender a marca e o produto',
    texto: 'A Suplos como plataforma de gestão de suprimentos para construção civil, e onde a transferência se encaixa nesse ecossistema.',
  },
  {
    titulo: 'Analisar as telas existentes',
    texto: 'O que já funciona, o que quebra, e o que pode ser reaproveitado como padrão (a comparação "pedido x recebido" do modal de pedidos de compra, por exemplo, já existia — só não tinha sido aplicada aqui).',
  },
  {
    titulo: 'Destrinchar dores e objetivos',
    texto: 'Separar o que os usuários reais pediram (via time de CS) do que é só sintoma superficial.',
  },
  {
    titulo: 'Analisar os três fluxogramas originais',
    texto: 'E questionar, como pedido, os pontos que não faziam sentido.',
  },
  {
    titulo: 'Mapear pontos de fricção',
    texto: 'Cruzando os prints das telas atuais com as dores relatadas.',
  },
  {
    titulo: 'Modelar os estados',
    texto: 'Transformar a transferência de uma ação única em um processo com etapas, decisões e responsáveis.',
  },
  {
    titulo: 'Produzir',
    texto: 'Desenhar o recorte de alta-fidelidade em cima do modelo de estados já validado.',
  },
];

/* ---------------- 04 · Fluxogramas comentados --------------- */
export const FLUXOGRAMAS = [
  {
    fluxo: 'Fluxo de Criação',
    tom: 'premissa' as const,
    texto: 'Confirmei a leitura de que "Requisição de Material" é um pedido interno da própria obra de origem, não algo vindo do destino — a transferência é sempre iniciada por quem tem sobra. Mas fiquei com uma dúvida real: por que toda transferência aparece na aba /requisitions, mesmo quando nasce direto de uma Saída de Estoque, sem ter passado por uma requisição? Minha proposta é que isso só deveria acontecer quando a transferência de fato se originou de uma requisição.',
  },
  {
    fluxo: 'Fluxo de Aprovação',
    tom: 'discordancia' as const,
    texto: 'O original duplica toda a árvore de decisão para o parâmetro ON e OFF — e, mesmo no ramo OFF, continua oferecendo Aprovar e Reprovar. Questionei tanto a repetição quanto essa inconsistência. No meu fluxo, baseado no protótipo atual, a aprovação é obrigatória e aparece uma única vez: a transferência já nasce reservada na fila do Aprovador, que decide entre aprovar e reprovar.',
  },
  {
    fluxo: 'Fluxo de Recebimento — a contradição real',
    tom: 'discordancia' as const,
    texto: 'O modal de confirmação de entrega mostra a avaliação de entrega (FVM) como opcional. Mas se ela pode ser pulada, a divergência entre o que saiu e o que chegou — o problema central citado no case — nunca é capturada. Isso contradiz a própria necessidade de auditoria que vocês descreveram. Minha proposta: a conferência de quantidade deveria ser obrigatória; só os critérios de qualidade da avaliação é que fazem sentido como configuráveis por cliente.',
  },
];

/* ---------------- 05 · Prints anotados ---------------------- */
export interface Achado {
  n: string;
  titulo: string;
  texto?: string;
  resolucao?: string;
}

export interface PrintAnotado {
  arquivo: string;
  titulo: string;
  /** Só existe quando o próprio SVG traz um subtítulo. */
  legenda?: string;
  achados: Achado[];
}

export const PRINTS: PrintAnotado[] = [
  {
    arquivo: 'print1_estoque_materiais.svg',
    titulo: 'Estoque de Materiais',
    achados: [
      {
        n: '1',
        titulo: 'Card "Materiais Reservados" só cobre requisição interna',
        texto: 'Não existe equivalente de reserva para transferência entre obras.',
        resolucao: 'Resolvido pelo estado "Reservado" do fluxo novo.',
      },
      {
        n: '2',
        titulo: 'Coluna "Quantidade" mostra saldo único',
        texto: 'Não distingue disponível de reservado ou em trânsito — decisão de compra pode se basear em número que não reflete a realidade física.',
        resolucao: 'Requer novo indicador de saldo "em trânsito" na tela de estoque.',
      },
    ],
  },
  {
    arquivo: 'print2_registrar_saida.svg',
    titulo: 'Registrar Saída de Estoque',
    legenda: 'O modal onde a transferência nasce hoje.',
    achados: [
      {
        n: '1',
        titulo: '"Tipo de Saída = Transferência" não muda o comportamento do modal',
        texto: 'É apenas uma categorização visual; não existe aprovação, reserva ou estado associado a essa escolha.',
        resolucao: 'Resolvido pelos estados Reservado / Aguardando aprovação do fluxo novo.',
      },
      {
        n: '2',
        titulo: 'Não existe campo de quantidade a confirmar depois',
        texto: 'O que sai daqui nunca é comparado com o que chega — não há onde registrar a diferença.',
        resolucao: 'Resolvido pelo estado Avaliação de entrega (FVM), com enviado x recebido.',
      },
      {
        n: '3',
        titulo: '"Salvar Saída" é um clique único, sem etapa intermediária',
        texto: 'É exatamente o problema central do case (slide 4).',
        resolucao: 'Resolvido pelo fluxo de estados completo.',
      },
    ],
  },
  {
    arquivo: 'print3_movimentacoes.svg',
    titulo: 'Movimentações',
    legenda: 'A aba do estoque com o histórico.',
    achados: [
      {
        n: '1',
        titulo: '"Transferência" só aparece como histórico já concluído',
        texto: 'Não existe visão do que está pendente ou em andamento agora — só o que já aconteceu.',
        resolucao: 'Resolvido por uma view dedicada de transferências, filtrável por estado.',
      },
      {
        n: '2',
        titulo: 'Saída e entrada aparecem como dois eventos desconectados',
        resolucao: 'Resolvido ao tratar a transferência como uma única entidade com estados, não dois registros soltos.',
      },
    ],
  },
  {
    arquivo: 'print4_entregas_calendario.svg',
    titulo: 'Entregas: Calendário',
    legenda: 'Hoje exclusiva de pedidos de compra.',
    achados: [
      {
        n: '1',
        titulo: 'Cards de status já são um bom padrão',
        texto: 'Total, atrasados, parciais e completos resolvem exatamente o pedido de "visibilidade por obra" do CS (slide 5) — só que hoje aplicado a pedidos de compra, não a transferências.',
        resolucao: 'Reaproveitar esse padrão para "A Enviar" / "A Receber" por obra.',
      },
      {
        n: '2',
        titulo: 'Painel "Entregas Atrasadas" também é referência direta',
        resolucao: 'Mesma lógica se aplica a transferências paradas em "Em trânsito" além do previsto.',
      },
    ],
  },
  {
    arquivo: 'print5_detalhes_pedido.svg',
    titulo: 'Detalhes do Pedido',
    legenda: 'Confirmação de entrega de pedidos de compra.',
    achados: [
      {
        n: '1',
        titulo: 'Comparação "Qtd. Pedido" x "Qtd. Recebida" já existe no produto — só não para transferências',
        texto: 'Esse padrão é a prova de que a solução do case (comparar enviado x recebido) não é uma invenção — é um comportamento que a Suplos já tem em outro fluxo.',
        resolucao: 'Reaproveitar esse mesmo padrão de UI no estado Avaliação de entrega (FVM) da transferência.',
      },
      {
        n: '2',
        titulo: 'A divergência não gera nenhum estado próprio',
        texto: '"Confirmar Entrega" é binário, não captura o "faltou 2".',
      },
    ],
  },
];

/* ---------------- 07 · Tabela de atores --------------------- */
export type Ator = 'origem' | 'destino' | 'sistema' | 'nenhum';

export const ATORES: { estado: string; ator: Ator; atorNota?: string; acao: string }[] = [
  { estado: 'Reservado · aprovação pendente', ator: 'destino', atorNota: 'Aprovador da obra que recebe', acao: 'Aprova ou reprova; a origem ainda pode cancelar' },
  { estado: 'Aprovado · envio pendente', ator: 'origem', acao: 'Registra o despacho ou cancela antes da saída' },
  { estado: 'Reprovado', ator: 'sistema', acao: 'Devolve a quantidade ao disponível da origem' },
  { estado: 'Em trânsito', ator: 'destino', acao: 'Alega a chegada do material à obra' },
  { estado: 'FVM pendente', ator: 'destino', atorNota: 'papel definido pelo cliente', acao: 'Confere enviado × recebido e registra divergências' },
  { estado: 'Aguardando NF', ator: 'destino', acao: 'Confirma o número e anexa a nota fiscal' },
  { estado: 'Divergência pendente', ator: 'origem', acao: 'Envia o saldo faltante ou encerra assumindo a falta' },
  { estado: 'Recebido ok', ator: 'nenhum', acao: 'Transferência encerrada sem pendências' },
  { estado: 'Finalizada com divergência', ator: 'nenhum', acao: 'Registro encerrado e mantido para auditoria' },
  { estado: 'Cancelado', ator: 'sistema', acao: 'Devolve ao disponível da origem' },
];

export const ATOR_LEGENDA: Record<Ator, string> = {
  origem: 'Origem',
  destino: 'Destino',
  sistema: 'Sistema',
  nenhum: '—',
};

/* ---------------- 07 · Tabela de notificações --------------- */
export const NOTIFICACOES: {
  transicao: string;
  origem: boolean;
  aprovador: boolean;
  destino: boolean;
  nota: string;
  tripla?: boolean;
}[] = [
  {
    transicao: 'Criação · reserva e aprovação pendente',
    origem: false, aprovador: true, destino: false,
    nota: 'O Aprovador precisa agir; o saldo já está travado na origem.',
  },
  {
    transicao: 'Aprovado',
    origem: true, aprovador: false, destino: true,
    nota: 'Origem pode despachar; destino já vê "a receber" no painel de visibilidade.',
  },
  {
    transicao: 'Reprovado',
    origem: true, aprovador: false, destino: false,
    nota: 'Só a origem precisa saber que voltou ao estoque.',
  },
  {
    transicao: 'Em trânsito',
    origem: false, aprovador: false, destino: true,
    nota: 'Destino recebe previsão de chegada; origem já sabe (foi ela quem despachou).',
  },
  {
    transicao: 'Confirmação de recebimento (ok ou divergente)',
    origem: true, aprovador: true, destino: true, tripla: true,
    nota: 'A FVM avisa as três partes; com divergência, o aviso para a origem ganha tratamento crítico.',
  },
  {
    transicao: 'NF confirmada',
    origem: true, aprovador: false, destino: true,
    nota: 'Sem divergência, encerra. Com divergência, apenas resolve a pendência da nota.',
  },
  {
    transicao: 'Recebido com divergência → precisa reenviar',
    origem: true, aprovador: false, destino: false,
    nota: 'Só a origem precisa agir; ao reenviar, o ciclo de notificação recomeça do início.',
  },
  {
    transicao: 'Divergência encerrada pela origem',
    origem: true, aprovador: true, destino: true, tripla: true,
    nota: 'As três partes recebem o fechamento; a falta continua auditável.',
  },
  {
    transicao: 'Cancelado antes do despacho',
    origem: true, aprovador: false, destino: false,
    nota: 'Ação e ciência ficam com quem criou; o saldo volta ao disponível.',
  },
];

export const FONTE_NOTIFICACOES =
  'Base: transcrição do vídeo de apresentação da Suplos (min 3:13–3:30) para a notificação tripla do recebimento. No protótipo, o encerramento da divergência repete os três destinatários para fechar o ciclo com todas as partes cientes.';

/* ---------------- 08 · Priorização -------------------------- */
export interface Versao {
  chave: string;
  rotulo: string;
  chamada: string;
  inclui: { titulo: string; detalhe?: string }[];
  notaTitulo?: string;
  nota?: string;
  destaque?: boolean;
}

export const VERSOES: Versao[] = [
  {
    chave: 'mvp',
    rotulo: 'MVP',
    chamada: 'O fluxo completo que já está implementado e demonstrável no protótipo.',
    destaque: true,
    inclui: [
      { titulo: 'Separação por obra e direção', detalhe: 'painéis “Saindo” na origem e “Chegando” no destino' },
      { titulo: 'Reserva real de estoque', detalhe: 'quantidade travada sem sair do saldo antes do despacho' },
      { titulo: 'Aprovação explícita', detalhe: 'aprovar ou reprovar, com simulação da outra empresa' },
      { titulo: 'Despacho e trânsito rastreáveis', detalhe: 'data efetiva de saída e previsão de chegada' },
      { titulo: 'Chegada separada da conferência', detalhe: 'alegar recebimento não dá entrada; a FVM confere enviado × recebido' },
      { titulo: 'Divergência com resolução', detalhe: 'a origem reenvia o saldo ou encerra assumindo a falta; o reenvio volta à aprovação' },
      { titulo: 'NF como pendência própria', detalhe: 'a nota pode ser confirmada sem esconder uma divergência aberta' },
      { titulo: 'Cancelamento antes do despacho', detalhe: 'devolve a quantidade reservada ao saldo disponível' },
      { titulo: 'Auditoria web e mobile', detalhe: 'timeline, notificações, atrasos, saldos e histórico compartilhados' },
    ],
    notaTitulo: 'Entrega demonstrável',
    nota: 'O ciclo pode ser percorrido de ponta a ponta: criar, aprovar, despachar, receber, conferir, anexar a NF e resolver uma divergência.',
  },
  {
    chave: 'v1',
    rotulo: 'V.1',
    chamada: 'Transforma o histórico concluído em um documento que pode ser compartilhado.',
    inclui: [
      {
        titulo: 'Exportar relatório da transferência finalizada',
        detalhe: 'Depois da conclusão, um botão permite exportar o relatório daquele pedido específico, com dados, etapas e resultado do recebimento.',
      },
    ],
    notaTitulo: 'Recorte da primeira evolução',
    nota: 'A exportação só aparece depois que o fluxo termina, garantindo que o relatório represente o histórico completo e imutável daquele pedido.',
  },
  {
    chave: 'v2',
    rotulo: 'V.2',
    chamada: 'Ajuda a direcionar a sobra para uma obra que realmente precisa do material.',
    inclui: [
      {
        titulo: 'Sugestão automática de destino',
        detalhe: 'Cruza o item com obras marcadas com “Estoque Baixo” e sugere um destino; a pessoa continua responsável pela decisão.',
      },
    ],
    notaTitulo: 'Evolução proposta',
    nota: 'A sugestão reaproveita um sinal que já existe no produto; ela orienta a operação, mas não decide nem aprova automaticamente.',
  },
  {
    chave: 'v3',
    rotulo: 'V.3',
    chamada: 'Adiciona inteligência operacional e robustez para o uso em campo.',
    inclui: [
      { titulo: 'Transportador confirma carregamento', detalhe: 'cria um segundo ponto de conferência antes do material entrar em trânsito' },
      { titulo: 'SLA de trânsito com alerta de atraso', detalhe: 'reaproveita o padrão já existente na tela de Entregas' },
      { titulo: 'Indicador de confiabilidade por obra/rota', detalhe: 'usa o histórico para revelar recorrência de atrasos e divergências' },
      { titulo: 'Modo offline no mobile', detalhe: 'permite confirmar no canteiro e sincronizar quando a conexão voltar' },
    ],
    notaTitulo: 'Por que vem depois',
    nota: 'Depende de histórico, métricas e sincronização confiável; entrega mais valor quando o fluxo-base já estiver rodando em produção.',
  },
];

export const FORA_DE_ESCOPO =
  'Fora de escopo em qualquer versão, por decisão consciente: cancelamento ou devolução depois que o material já foi confirmado como recebido (isso quebraria a premissa de que o fluxo tem um fim, e nada no material indica que essa seja uma dor real), e qualquer forma de aprovação totalmente automática (é uma decisão de controle financeiro da construtora, fora do escopo que me cabe decidir neste case).';
