import type { TransferStatus } from './types';

/**
 * Família visual do estado — é ela, e só ela, que decide a cor da tag.
 *
 * Dois estados que significam a mesma coisa para quem lê a lista
 * ("Reservado · envio pendente" e "Aprovado · envio pendente") caem na
 * mesma família e, portanto, saem sempre na mesma cor, em qualquer tela.
 * A cor NÃO vem do card que agrupa a transferência: o card só filtra.
 */
export type Familia =
  | 'reservado' | 'aprovacao' | 'transito' | 'fvm' | 'nf'
  | 'ok' | 'diverg' | 'reprovado' | 'cancelado';

export interface StatusMeta {
  label: string;
  curto: string;
  descricao: string;
  /** Família visual — sufixo dos tokens --st-* e da classe .badge-status--*. */
  token: Familia;
  /**
   * Rótulo no stepper do detalhe. A tag nomeia a pendência ("FVM pendente");
   * o stepper nomeia a etapa ("Avaliação de entrega"). Sem `passo`, vale `curto`.
   */
  passo?: string;
  terminal: boolean;
}

export const STATUS_META: Record<TransferStatus, StatusMeta> = {
  reservado: {
    label: 'Reservado · envio pendente',
    curto: 'Envio pendente',
    descricao: 'Quantidade travada no estoque da obra de origem. Aprovação está desligada para este cliente, então a transferência já pode ser despachada.',
    token: 'reservado',
    terminal: false,
  },
  aguardando_aprovacao: {
    label: 'Reservado · aprovação pendente',
    curto: 'Aprovação pendente',
    descricao: 'A quantidade já está travada no estoque da origem. Aguarda a decisão do Aprovador da obra que vai receber.',
    token: 'aprovacao',
    terminal: false,
  },
  aprovado: {
    label: 'Aprovado · envio pendente',
    curto: 'Envio pendente',
    descricao: 'Aprovado pela obra de destino. A origem precisa registrar a saída e a previsão de chegada.',
    // Mesma família de "reservado": para quem lê a lista, os dois estados
    // dizem a mesma coisa — o material continua parado na origem esperando
    // o despacho. Mesmo significado, mesma cor de tag.
    token: 'reservado',
    terminal: false,
  },
  em_transito: {
    label: 'Em trânsito',
    curto: 'Em trânsito',
    descricao: 'Material saiu da obra de origem e está no caminhão. Nenhuma ação até a chegada.',
    token: 'transito',
    terminal: false,
  },
  avaliacao_entrega: {
    label: 'FVM pendente',
    curto: 'FVM pendente',
    descricao: 'A chegada já foi alegada: o material está na obra de destino, mas ainda não entrou no estoque. Falta a Avaliação de entrega (FVM) — a conferência de quantidade que captura o "saíram 10, chegaram 8".',
    token: 'fvm',
    passo: 'Avaliação de entrega',
    terminal: false,
  },
  aguardando_nf: {
    label: 'Aguardando NF',
    curto: 'Aguardando NF',
    descricao: 'Material conferido e já no estoque do destino. Falta confirmar a nota fiscal da transferência e anexá-la.',
    token: 'nf',
    terminal: false,
  },
  recebido_ok: {
    label: 'Recebido ok',
    curto: 'Recebido ok',
    descricao: 'Conferência fechou: a quantidade recebida bate com a enviada.',
    token: 'ok',
    terminal: true,
  },
  recebido_divergencia: {
    label: 'Recebido com divergência',
    curto: 'Com divergência',
    descricao: 'A quantidade recebida não bate com a enviada. Registrado para auditoria.',
    token: 'diverg',
    terminal: false,
  },
  reprovado: {
    label: 'Reprovado',
    curto: 'Reprovado',
    descricao: 'O Aprovador recusou a transferência. A quantidade voltou ao disponível da origem.',
    token: 'reprovado',
    terminal: true,
  },
  cancelado: {
    label: 'Cancelado',
    curto: 'Cancelado',
    descricao: 'Cancelado pela origem antes do despacho. A quantidade voltou ao disponível.',
    token: 'cancelado',
    terminal: true,
  },
};

/**
 * Reservados — tudo que foi criado e ainda não se moveu.
 * A transferência nasce aqui e só sai quando é despachada, reprovada ou
 * cancelada; a aprovação pendente é uma etapa dentro da reserva, não um
 * lugar separado.
 */
export const STATUS_RESERVA: TransferStatus[] = ['reservado', 'aguardando_aprovacao', 'aprovado'];

/** Subconjunto da reserva que depende de uma decisão do Aprovador. */
export const STATUS_APROVACAO: TransferStatus[] = ['aguardando_aprovacao'];

/**
 * Estados em que o material já saiu da origem e ainda não entrou no
 * estoque do destino — é o recorte que o saldo usa.
 */
export const STATUS_TRANSITO: TransferStatus[] = ['em_transito', 'avaliacao_entrega'];

/** Ainda na estrada: chegada não alegada. */
export const STATUS_EM_ROTA: TransferStatus[] = ['em_transito'];

/** Chegou, mas a Avaliação de entrega (FVM) ainda não foi feita. */
export const STATUS_FVM: TransferStatus[] = ['avaliacao_entrega'];

/** Encerrados sem entrega. */
export const STATUS_CANCELADOS: TransferStatus[] = ['cancelado', 'reprovado'];

/** Estados em que a movimentação já foi concluída (entrou no destino). */
export const STATUS_CONCLUIDO: TransferStatus[] = ['recebido_ok', 'recebido_divergencia'];

export const STATUS_ABERTOS: TransferStatus[] = [
  ...STATUS_RESERVA, ...STATUS_TRANSITO, 'aguardando_nf',
];

/** Transferências ativas — tudo que ainda pede acompanhamento. */
export const STATUS_ATIVOS: TransferStatus[] = [
  ...STATUS_ABERTOS, 'recebido_divergencia',
];
