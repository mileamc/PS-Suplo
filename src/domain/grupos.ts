import type { Role, Transferencia } from './types';
import {
  STATUS_APROVACAO, STATUS_ATIVOS, STATUS_CANCELADOS, STATUS_EM_ROTA,
  STATUS_FVM, STATUS_RESERVA, divergenciaPendente,
} from './status';

/** De que lado da transferência a obra atual está. */
export type Direcao = 'enviar' | 'receber';

/* ============================================================
   Grupos das transferências — os cards da web e os chips do
   mobile são a mesma lista, definida aqui uma vez só.

   O card é um filtro, não uma identidade: a cor da tag vem
   sempre da família do estado (STATUS_META[...].token), nunca
   do card em que a transferência aparece.
   ============================================================ */

export type Grupo =
  | 'total' | 'reservados' | 'aprovacoes' | 'transito' | 'atrasados'
  | 'fvm' | 'nf' | 'divergencia' | 'completos' | 'cancelados';

/** "Hoje" do protótipo — a data dos dados de demonstração. */
export const HOJE = new Date('2026-08-29T12:00:00');

/** Atraso só existe enquanto o material está na estrada. */
export function atrasada(t: Transferencia): boolean {
  return STATUS_EM_ROTA.includes(t.status)
    && Boolean(t.previsaoChegada)
    && new Date(t.previsaoChegada!) < HOJE;
}

export function noGrupo(t: Transferencia, g: Grupo, direcao: Direcao): boolean {
  switch (g) {
    case 'total': return STATUS_ATIVOS.includes(t.status);
    case 'reservados':
      // A divergência sem decisão é pendência de quem mandou, e o que ela
      // pede é justamente uma reserva nova: por isso volta para cá, em vez
      // de ficar num canto de "problemas" que ninguém abre.
      return STATUS_RESERVA.includes(t.status)
        || (direcao === 'enviar' && divergenciaPendente(t));
    case 'aprovacoes': return STATUS_APROVACAO.includes(t.status);
    case 'transito': return STATUS_EM_ROTA.includes(t.status);
    case 'atrasados': return atrasada(t);
    case 'fvm': return STATUS_FVM.includes(t.status);
    case 'nf': return t.status === 'aguardando_nf';
    case 'divergencia': return t.status === 'encerrado_divergencia';
    case 'completos': return t.status === 'recebido_ok';
    case 'cancelados': return STATUS_CANCELADOS.includes(t.status);
  }
}

export interface DefGrupo {
  grupo: Grupo;
  rotulo: string;
  /** Família de estado que dá a cor do card — a mesma da tag. */
  familia: string;
  /** Card exclusivo de um papel; ausente = todo mundo vê. */
  soPara?: Role;
}

/**
 * Ordem dos cards. "Aprovações pendentes" fica ao lado de "Reservados"
 * porque é um recorte dele: para o Aprovador, é a fila de trabalho.
 * Para os outros papéis o card não existe — a pendência aparece só como
 * tag na linha da transferência.
 */
export const GRUPOS: DefGrupo[] = [
  { grupo: 'total', rotulo: 'Total', familia: '' },
  { grupo: 'reservados', rotulo: 'Reservados', familia: 'reservado' },
  { grupo: 'aprovacoes', rotulo: 'Aprovações pendentes', familia: 'aprovacao', soPara: 'aprovador' },
  { grupo: 'transito', rotulo: 'Em trânsito', familia: 'transito' },
  { grupo: 'atrasados', rotulo: 'Atrasados', familia: '' },
  { grupo: 'fvm', rotulo: 'FVM pendente', familia: 'fvm' },
  { grupo: 'nf', rotulo: 'Aguardando NF', familia: 'nf' },
  { grupo: 'divergencia', rotulo: 'Finalizadas c/ divergência', familia: 'diverg' },
  { grupo: 'completos', rotulo: 'Completos', familia: 'ok' },
  { grupo: 'cancelados', rotulo: 'Cancelados', familia: 'cancelado' },
];

export function gruposDoPapel(papel: Role): DefGrupo[] {
  return GRUPOS.filter((g) => !g.soPara || g.soPara === papel);
}

export function rotuloGrupo(g: Grupo): string {
  return GRUPOS.find((x) => x.grupo === g)?.rotulo ?? '';
}
