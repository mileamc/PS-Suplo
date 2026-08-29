import type { TransferStatus } from './types';

export interface StatusMeta {
  label: string;
  curto: string;
  descricao: string;
  /** Sufixo dos tokens --st-*  */
  token: string;
  terminal: boolean;
}

export const STATUS_META: Record<TransferStatus, StatusMeta> = {
  reservado: {
    label: 'Reservado',
    curto: 'Reservado',
    descricao: 'Quantidade travada no estoque da obra de origem. Ainda não saiu fisicamente.',
    token: 'reservado',
    terminal: false,
  },
  aguardando_aprovacao: {
    label: 'Aguardando aprovação',
    curto: 'Aguard. aprovação',
    descricao: 'Aguardando decisão do Aprovador da obra de destino. Nada se moveu ainda.',
    token: 'aprovacao',
    terminal: false,
  },
  aprovado: {
    label: 'Aprovado',
    curto: 'Aprovado',
    descricao: 'Liberado para despacho. A origem precisa registrar a saída e a previsão de chegada.',
    token: 'aprovado',
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
    label: 'Avaliação de entrega',
    curto: 'Avaliação de entrega',
    descricao: 'Material chegou. Aguardando conferência de quantidade pela obra de destino.',
    token: 'fvm',
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

/** Estados em que o material ainda está fisicamente na obra de origem, travado. */
export const STATUS_RESERVA: TransferStatus[] = ['reservado', 'aguardando_aprovacao', 'aprovado'];

/** Estados em que o material já saiu e ainda não foi conferido. */
export const STATUS_TRANSITO: TransferStatus[] = ['em_transito', 'avaliacao_entrega'];

/** Estados em que a movimentação já foi concluída (entrou no destino). */
export const STATUS_CONCLUIDO: TransferStatus[] = ['recebido_ok', 'recebido_divergencia'];

export const STATUS_ABERTOS: TransferStatus[] = [...STATUS_RESERVA, ...STATUS_TRANSITO];
