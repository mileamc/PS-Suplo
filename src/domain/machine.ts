import type { Role, TransferStatus, Transferencia } from './types';
import { STATUS_META } from './status';

/* ============================================================
   Máquina de estados — seções 2 e 3 da especificação.

   Requisição de material ⟍
                           ⟩→ Reservado → Aguardando aprovação →┬→ Aprovado → Em trânsito
   Estoque (saída direta) ⟋                                     └→ Reprovado
        → Avaliação de entrega (FVM) →┬→ Recebido ok
                                      └→ Recebido com divergência
   ============================================================ */

export type AcaoId =
  | 'despachar'
  | 'cancelar'
  | 'aprovar'
  | 'reprovar'
  | 'registrar_chegada'
  | 'avaliar_entrega'
  | 'confirmar_nf'
  | 'reenviar'
  | 'encerrar_divergencia';

export interface Acao {
  id: AcaoId;
  label: string;
  /** Quem pode executar (seção 3). */
  papel: Role;
  destino: TransferStatus | null;
  tom: 'primario' | 'perigo' | 'neutro';
  /** Ação que só existe fora do MVP (V1 — loop de reenvio). */
  v1?: boolean;
}

const A = {
  despachar: {
    id: 'despachar', label: 'Registrar despacho',
    papel: 'origem', destino: 'em_transito', tom: 'primario',
  },
  cancelar: {
    id: 'cancelar', label: 'Cancelar transferência',
    papel: 'origem', destino: 'cancelado', tom: 'perigo',
  },
  aprovar: {
    id: 'aprovar', label: 'Aprovar',
    papel: 'aprovador', destino: 'aprovado', tom: 'primario',
  },
  reprovar: {
    id: 'reprovar', label: 'Reprovar',
    papel: 'aprovador', destino: 'reprovado', tom: 'perigo',
  },
  registrar_chegada: {
    id: 'registrar_chegada', label: 'Material chegou',
    papel: 'destino', destino: 'avaliacao_entrega', tom: 'primario',
  },
  avaliar_entrega: {
    id: 'avaliar_entrega', label: 'Avaliar entrega (FVM)',
    papel: 'destino', destino: null, tom: 'primario',
  },
  confirmar_nf: {
    id: 'confirmar_nf', label: 'Confirmar NF',
    papel: 'destino', destino: null, tom: 'primario',
  },
  reenviar: {
    id: 'reenviar', label: 'Reenviar corrigido',
    papel: 'origem', destino: 'reservado', tom: 'primario', v1: true,
  },
  encerrar_divergencia: {
    id: 'encerrar_divergencia', label: 'Manter registro e encerrar',
    papel: 'origem', destino: null, tom: 'neutro',
  },
} satisfies Record<AcaoId, Acao>;

/**
 * Ações disponíveis num estado.
 *
 * O parâmetro de aprovação por cliente decide em qual estado a transferência
 * NASCE (Aguardando aprovação ou Reservado pronto para despacho), e não
 * duplica a árvore de decisão daqui para a frente.
 */
export function acoesDisponiveis(status: TransferStatus): Acao[] {
  switch (status) {
    case 'reservado':
      // Só existe quando a aprovação está desligada: já nasce pronta para despacho.
      return [A.despachar, A.cancelar];
    case 'aguardando_aprovacao':
      return [A.aprovar, A.reprovar, A.cancelar];
    case 'aprovado':
      return [A.despachar, A.cancelar];
    case 'em_transito':
      return [A.registrar_chegada];
    case 'avaliacao_entrega':
      return [A.avaliar_entrega];
    case 'aguardando_nf':
      return [A.confirmar_nf];
    case 'recebido_divergencia':
      return [A.reenviar, A.encerrar_divergencia];
    default:
      return [];
  }
}

/**
 * Cancelamento — seção 2: "só é possível enquanto o material não foi
 * despachado". Vale para toda a fase de reserva (Reservado, Aguardando
 * aprovação e Aprovado), não só para o estado Reservado nominalmente:
 * em todos eles o material ainda está fisicamente na obra de origem.
 */
export function podeCancelar(status: TransferStatus): boolean {
  return status === 'reservado'
    || status === 'aguardando_aprovacao'
    || status === 'aprovado';
}

/** Ações que o papel selecionado pode executar agora. */
export function acoesDoPapel(t: Transferencia, papel: Role): Acao[] {
  return acoesDisponiveis(t.status).filter((a) => a.papel === papel);
}

/** Passos exibidos no stepper do detalhe da transferência. */
export function trilha(aprovacaoAtiva: boolean): TransferStatus[] {
  const base: TransferStatus[] = aprovacaoAtiva
    ? ['aguardando_aprovacao', 'aprovado']
    : ['reservado'];
  base.push('em_transito', 'avaliacao_entrega', 'aguardando_nf', 'recebido_ok');
  return base;
}

export function indiceNaTrilha(status: TransferStatus, aprovacaoAtiva: boolean): number {
  const t = trilha(aprovacaoAtiva);
  if (status === 'recebido_divergencia') return t.length - 1;
  const i = t.indexOf(status);
  return i;
}

export function rotuloStatus(s: TransferStatus): string {
  return STATUS_META[s].label;
}
