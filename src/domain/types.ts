/* ============================================================
   Modelo de domínio — Transferência de Material entre Obras
   Fonte de verdade: especificacao_transferencia_entre_obras.md
   (seções 2, 3, 4 e 8)
   ============================================================ */

export type TransferStatus =
  | 'reservado'
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'em_transito'
  | 'avaliacao_entrega'
  | 'aguardando_nf'
  | 'recebido_ok'
  | 'recebido_divergencia'
  | 'encerrado_divergencia'
  | 'reprovado'
  | 'cancelado';

/** Papéis da seção 3 — "Quem decide em cada estado". */
export type Role = 'origem' | 'aprovador' | 'destino';

export type TipoInsumo = 'avulso' | 'pedido';

export interface Obra {
  id: string;
  nome: string;
}

export interface Insumo {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  tipo: TipoInsumo;
  unidade: string;
  /** Saldo físico total na obra (disponível + reservado + em trânsito de saída). */
  saldo: number;
  estoqueMin: number;
  custoUnitario: number;
  ultimoMovimento: string;
  obraId: string;
}

/** Uma linha de insumo dentro da transferência. Seção 8: itens, quantidades e custo. */
export interface TransferItem {
  insumoId: string;
  codigo: string;
  nome: string;
  unidade: string;
  tipo: TipoInsumo;
  custoUnitario: number;
  /**
   * Linha de orçamento à qual o custo é apropriado. Obrigatória para item
   * de pedido; item avulso não exige apropriação.
   */
  linhaOrcamento?: string;
  /** Quantidade travada na reserva. Premissa da seção 2: não muda depois. */
  qtdEnviada: number;
  /** Preenchido só na Avaliação de entrega (FVM). */
  qtdRecebida: number | null;
  /** Justificativa por item quando há divergência. */
  motivoDivergencia?: string;
}

export type EventoTipo =
  | 'criada'
  | 'aprovada'
  | 'reprovada'
  | 'despachada'
  | 'chegada_registrada'
  | 'recebida_ok'
  | 'recebida_divergencia'
  | 'nf_confirmada'
  | 'divergencia_encerrada'
  | 'cancelada'
  | 'reenviada';

/** Histórico auditável — seção 8: quem aprovou, quando saiu, quando chegou. */
export interface TransferEvento {
  id: string;
  tipo: EventoTipo;
  em: string;          // ISO
  porNome: string;
  porPapel: Role | 'sistema';
  obra: string;
  detalhe?: string;
}

export interface Transferencia {
  id: string;
  codigo: string;              // ex.: TR-000142
  status: TransferStatus;
  obraOrigemId: string;
  obraDestinoId: string;
  criadaPor: string;
  criadaEm: string;
  /** Como a transferência entrou no fluxo (as duas setas de entrada do fluxograma). */
  entrada: 'saida_direta' | 'requisicao';
  /** Preenchido quando `entrada === 'requisicao'`. */
  requisicaoCodigo?: string;
  observacao: string;
  assinatura: string;          // dataURL do canvas
  itens: TransferItem[];
  /** Só existe se o parâmetro de aprovação do cliente estiver ligado. */
  aprovadaPor?: string;
  aprovadaEm?: string;
  motivoReprovacao?: string;
  /** Data em que o material efetivamente saiu da obra de origem. */
  dataSaida?: string;
  despachadaEm?: string;
  previsaoChegada?: string;
  chegadaEm?: string;
  recebidaPor?: string;
  recebidaEm?: string;
  /** Avaliação de entrega — critérios de qualidade, configuráveis por cliente. */
  avaliacao?: AvaliacaoEntrega;
  /** Nota fiscal da transferência, confirmada pela obra de destino. */
  nf?: NotaFiscal;
  /**
   * Encerramento da divergência pela obra de origem. É ele, e não a NF,
   * que fecha uma transferência que chegou com falta: o destino pode
   * anexar a nota, mas quem decide se ainda vem material é quem mandou.
   */
  encerramento?: EncerramentoDivergencia;
  /** Ciclo de reenvio (V1) — nº de vezes que voltou para Reservado. */
  ciclo: number;
  eventos: TransferEvento[];
}

export interface Notificacao {
  id: string;
  transferenciaId: string;
  transferenciaCodigo: string;
  titulo: string;
  descricao: string;
  em: string;
  /** Papéis notificados nesta transição (seção 4). */
  destinatarios: Role[];
  /** A confirmação de recebimento é o único evento com notificação tripla. */
  tripla: boolean;
  /**
   * Aviso que não pode passar batido — hoje, só a divergência na
   * conferência. A obra de origem precisa ver e decidir o que fazer.
   */
  critica?: boolean;
  lida: boolean;
}

/* ============================================================
   Avaliação de entrega (FVM) e nota fiscal
   ============================================================ */

export type RespostaCriterio = number | boolean;

export interface AvaliacaoEntrega {
  /** Fichas escolhidas — cada uma acrescenta critérios à avaliação. */
  fichas: string[];
  respostas: Record<string, RespostaCriterio>;
  observacao: string;
  anexos: string[];
  avaliadaPor: string;
  avaliadaEm: string;
}

export interface NotaFiscal {
  numero: string;
  anexo: string;
  confirmadaPor: string;
  confirmadaEm: string;
}

export interface EncerramentoDivergencia {
  por: string;
  em: string;
  observacao: string;
}
