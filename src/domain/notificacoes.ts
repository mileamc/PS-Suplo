import type { EventoTipo, Role, Transferencia } from './types';

/* ============================================================
   Seção 4 — "quem fica sabendo" (diferente de "quem decide").
   A confirmação de recebimento é o ÚNICO evento com notificação
   tripla em todo o fluxo, e por isso ganha destaque na interface.
   ============================================================ */

interface RegraNotificacao {
  destinatarios: Role[];
  tripla?: boolean;
  titulo: (t: Transferencia) => string;
  descricao: (t: Transferencia, ctx: Ctx) => string;
}

interface Ctx {
  obraOrigem: string;
  obraDestino: string;
  autor: string;
  detalhe?: string;
}

export const REGRAS: Partial<Record<EventoTipo, RegraNotificacao>> = {
  criada: {
    destinatarios: ['aprovador'],
    titulo: (t) => `${t.codigo} aguarda sua aprovação`,
    descricao: (t, c) =>
      `${c.obraOrigem} reservou ${t.itens.length} insumo(s) para ${c.obraDestino}. A quantidade já está travada; nada se moveu fisicamente.`,
  },
  aprovada: {
    destinatarios: ['origem', 'destino'],
    titulo: (t) => `${t.codigo} foi aprovada`,
    descricao: (_t, c) =>
      `${c.autor} aprovou a transferência. ${c.obraOrigem} já pode despachar; ${c.obraDestino} passa a ver o material em "A Receber".`,
  },
  reprovada: {
    destinatarios: ['origem'],
    titulo: (t) => `${t.codigo} foi reprovada`,
    descricao: (_t, c) =>
      `${c.autor} reprovou a transferência. A quantidade voltou ao disponível de ${c.obraOrigem}.${c.detalhe ? ` Motivo: ${c.detalhe}` : ''}`,
  },
  despachada: {
    destinatarios: ['destino'],
    titulo: (t) => `${t.codigo} saiu para a obra de destino`,
    descricao: (t, c) =>
      `Material despachado de ${c.obraOrigem}. Previsão de chegada: ${t.previsaoChegada ? fmtData(t.previsaoChegada) : 'a definir'}.`,
  },
  recebida_ok: {
    destinatarios: ['origem', 'aprovador', 'destino'],
    tripla: true,
    titulo: (t) => `${t.codigo} recebida sem divergência`,
    descricao: (_t, c) =>
      `${c.autor} conferiu a entrega em ${c.obraDestino}. Tudo que saiu de ${c.obraOrigem} chegou.`,
  },
  recebida_divergencia: {
    destinatarios: ['origem', 'aprovador', 'destino'],
    tripla: true,
    titulo: (t) => `${t.codigo} recebida COM divergência`,
    descricao: (_t, c) =>
      `${c.autor} registrou divergência na conferência em ${c.obraDestino}.${c.detalhe ? ` ${c.detalhe}` : ''}`,
  },
  nf_confirmada: {
    destinatarios: ['origem', 'destino'],
    titulo: (t) => `${t.codigo} encerrada`,
    descricao: (_t, c) =>
      `${c.autor} confirmou a nota fiscal da transferência em ${c.obraDestino}.${c.detalhe ? ` ${c.detalhe}` : ''}`,
  },
  cancelada: {
    destinatarios: ['origem'],
    titulo: (t) => `${t.codigo} foi cancelada`,
    descricao: (_t, c) =>
      `Cancelada antes do despacho. A quantidade voltou ao disponível de ${c.obraOrigem}.`,
  },
  reenviada: {
    destinatarios: ['origem'],
    titulo: (t) => `${t.codigo} voltou para Reservado`,
    descricao: (t, c) =>
      `Reenvio ${t.ciclo}º ciclo. O material precisa ser re-separado em ${c.obraOrigem} e passa pela aprovação de novo.`,
  },
};

export function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtDataHora(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export const ROLE_LABEL: Record<Role, string> = {
  origem: 'Obra de origem',
  aprovador: 'Aprovador',
  destino: 'Obra de destino',
};
