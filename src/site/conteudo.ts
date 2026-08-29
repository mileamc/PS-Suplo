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

export const SECOES: Secao[] = [
  { id: 'introducao', numero: '01', titulo: 'Introdução', curto: 'Introdução' },
  { id: 'overview', numero: '02', titulo: 'Overview do projeto', curto: 'Overview' },
  { id: 'processo', numero: '03', titulo: 'Etapas do processo', curto: 'Processo' },
  { id: 'fluxogramas', numero: '04', titulo: 'Fluxogramas originais, comentados', curto: 'Fluxogramas' },
  { id: 'prints', numero: '05', titulo: 'Prints das telas atuais, anotados', curto: 'Prints' },
  { id: 'fluxo-v1', numero: '06', titulo: 'Fluxo de estados (V1)', curto: 'Fluxo V1' },
  { id: 'fluxo-enriquecido', numero: '07', titulo: 'Fluxo enriquecido, atores e notificações', curto: 'Atores' },
  { id: 'priorizacao', numero: '08', titulo: 'MVP, V.1, V.2 e V.3', curto: 'Priorização' },
  { id: 'prototipo', numero: '09', titulo: 'Protótipo interativo', curto: 'Protótipo' },
  { id: 'encerramento', numero: '10', titulo: 'Encerramento', curto: 'Encerramento' },
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
    texto: 'O rascunho duplica toda a árvore de decisão duas vezes — uma para quando o parâmetro de aprovador está ligado, outra idêntica para quando está desligado. Isso é redundante e propenso a divergir com o tempo. Simplifiquei para que o parâmetro apenas decida se o estado "Aguardando aprovação" existe no fluxo ou é pulado, sem duplicar a lógica inteira.',
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
  { estado: 'Reservado', ator: 'origem', acao: 'Pode cancelar a transferência' },
  { estado: 'Aguardando aprovação', ator: 'destino', atorNota: 'papel definido pelo cliente', acao: 'Aprova ou reprova a transferência' },
  { estado: 'Reprovado', ator: 'sistema', acao: 'Devolve a quantidade ao disponível da origem' },
  { estado: 'Em trânsito', ator: 'nenhum', acao: 'Nenhuma ação disponível, aguarda chegada' },
  { estado: 'Avaliação de entrega (FVM)', ator: 'destino', atorNota: 'papel definido pelo cliente', acao: 'Confirma recebimento ou registra divergência' },
  { estado: 'Recebido com divergência', ator: 'origem', acao: 'Reenvia corrigido ou mantém o registro' },
  { estado: 'Cancelado', ator: 'origem', acao: 'Devolve ao disponível, antes do despacho' },
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
    transicao: 'Entra em aguardando aprovação',
    origem: false, aprovador: true, destino: false,
    nota: 'Aprovador precisa agir; destino ainda não tem nada visível.',
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
    nota: 'As três partes são avisadas — confirmado explicitamente no vídeo da Suplos. Único evento com notificação tripla no fluxo inteiro.',
  },
  {
    transicao: 'Recebido com divergência → precisa reenviar',
    origem: true, aprovador: false, destino: false,
    nota: 'Só a origem precisa agir; ao reenviar, o ciclo de notificação recomeça do início.',
  },
  {
    transicao: 'Cancelado',
    origem: true, aprovador: false, destino: false,
    nota: 'Ação e ciência ficam só com quem criou.',
  },
];

export const FONTE_NOTIFICACOES =
  'Base: transcrição do vídeo de apresentação da Suplos (min 3:13–3:30) — "tanto a obra que enviou… recebe essa confirmação, mas também o gestor… mas também essa obra aparecer que esse material foi recebido."';

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
    chamada: 'Resolve o problema central do case — sem isso, o risco real continua.',
    destaque: true,
    inclui: [
      { titulo: 'Reservado', detalhe: 'quantidade travada' },
      { titulo: 'Aguardando aprovação / Aprovado / Reprovado' },
      { titulo: 'Em trânsito' },
      { titulo: 'Avaliação de entrega', detalhe: 'confere quantidade e registra divergência' },
      { titulo: 'Aguardando NF', detalhe: 'confirmação da nota com anexo' },
      { titulo: 'Cancelado' },
      { titulo: 'Painel de visibilidade por obra', detalhe: '"A Enviar" / "A Receber"' },
    ],
    notaTitulo: 'Fica de fora, de propósito',
    nota: 'Correção automática da divergência — ela é registrada, mas resolvida manualmente por enquanto.',
  },
  {
    chave: 'v1',
    rotulo: 'V.1',
    chamada: 'Resolve a conveniência de corrigir uma divergência sem sair do sistema.',
    inclui: [
      {
        titulo: 'Loop "Vai reenviar?"',
        detalhe: 'Remetente corrige e reenvia; a transferência volta ao estado Reservado — não direto para Em trânsito.',
      },
    ],
    notaTitulo: 'Trade-off assumido',
    nota: 'O reenvio passa pela aprovação de novo, do zero. É mais fricção para quem já errou uma vez — decisão deliberada, para não reabrir a mesma brecha que o case pede para fechar: saída sem validação.',
  },
  {
    chave: 'v2',
    rotulo: 'V.2',
    chamada: 'Proposta própria — não vem de nenhum pedido do CS.',
    inclui: [
      {
        titulo: 'Sugestão automática de destino',
        detalhe: 'Ao reservar, cruza o item com obras marcadas com "Estoque Baixo" daquele mesmo material (recurso que já existe no produto) e sugere. A pessoa confirma — não decide sozinho pelo sistema.',
      },
    ],
    notaTitulo: 'Por que é iniciativa, não pedido',
    nota: 'Deixo isso explícito para o time: é design proativo, não resposta a uma dor relatada.',
  },
  {
    chave: 'v3',
    rotulo: 'V.3',
    chamada: 'O case pede melhoria além do fluxo atual, não só fechar lacunas.',
    inclui: [
      { titulo: 'Transportador confirma carregamento', detalhe: 'segundo ponto de conferência, na saída' },
      { titulo: 'SLA de trânsito com alerta de atraso', detalhe: 'reaproveita o padrão já existente na tela de Entregas' },
      { titulo: 'Indicador de confiabilidade por obra/rota' },
      { titulo: 'Modo offline no mobile', detalhe: 'quem confirma está no canteiro, no sol, de luva, com conexão ruim' },
    ],
  },
];

export const FORA_DE_ESCOPO =
  'Fora de escopo em qualquer versão, por decisão consciente: cancelamento ou devolução depois que o material já foi confirmado como recebido (isso quebraria a premissa de que o fluxo tem um fim, e nada no material indica que essa seja uma dor real), e qualquer forma de aprovação totalmente automática (é uma decisão de controle financeiro da construtora, fora do escopo que me cabe decidir neste case).';
