import React, { createContext, useContext, useMemo, useReducer, useCallback } from 'react';
import type {
  Notificacao, Role, TransferItem, Transferencia, TransferStatus, EventoTipo,
} from '../domain/types';
import { STATUS_RESERVA, STATUS_TRANSITO } from '../domain/status';
import { REGRAS } from '../domain/notificacoes';
import { TRANSFERENCIAS_SEED } from '../data/transferencias';
import { INSUMOS } from '../data/insumos';
import { OBRA_ATUAL, nomeObra } from '../data/obras';

/* ============================================================
   Estado da aplicação
   ============================================================ */

export type EstadoTela = 'normal' | 'carregando' | 'vazio' | 'erro';

export interface Toast {
  id: string;
  tom: 'sucesso' | 'erro' | 'info';
  titulo: string;
  descricao?: string;
}

export interface AppState {
  transferencias: Transferencia[];
  notificacoes: Notificacao[];
  toasts: Toast[];
  /** Parâmetro por cliente (seção 2). Desligado = pula "Aguardando aprovação". */
  aprovacaoAtiva: boolean;
  /** Persona ativa na demo — muda quais ações ficam habilitadas (seção 3). */
  papel: Role;
  estadoTela: EstadoTela;
  saldoDelta: Record<string, number>;
  seq: number;
}

export const USUARIO_POR_PAPEL: Record<Role, string> = {
  origem: 'Rafael Menezes',
  aprovador: 'Kaio Ambrosio',
  destino: 'Josué Barbosa',
};

const initialState: AppState = {
  transferencias: TRANSFERENCIAS_SEED,
  notificacoes: [],
  toasts: [],
  aprovacaoAtiva: true,
  papel: 'origem',
  estadoTela: 'normal',
  saldoDelta: {},
  seq: 144,
};

/* ============================================================
   Ações
   ============================================================ */

export type Action =
  | { type: 'criar'; itens: TransferItem[]; obraDestinoId: string; observacao: string; assinatura: string; entrada: 'saida_direta' | 'requisicao'; requisicaoCodigo?: string }
  | { type: 'enviar_aprovacao'; id: string }
  | { type: 'aprovar'; id: string }
  | { type: 'reprovar'; id: string; motivo: string }
  | { type: 'despachar'; id: string; previsaoChegada: string }
  | { type: 'registrar_chegada'; id: string }
  | { type: 'confirmar_recebimento'; id: string; recebidos: Record<string, number>; motivos: Record<string, string> }
  | { type: 'cancelar'; id: string; motivo: string }
  | { type: 'reenviar'; id: string }
  | { type: 'encerrar_divergencia'; id: string }
  | { type: 'set_aprovacao'; valor: boolean }
  | { type: 'set_papel'; valor: Role }
  | { type: 'set_estado_tela'; valor: EstadoTela }
  | { type: 'ler_notificacoes' }
  | { type: 'toast'; toast: Omit<Toast, 'id'> }
  | { type: 'fechar_toast'; id: string };

let uid = 0;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${++uid}`;

function agora() {
  return new Date().toISOString();
}

function notificar(
  state: AppState, t: Transferencia, tipo: EventoTipo, autor: string, detalhe?: string,
): Notificacao[] {
  const regra = REGRAS[tipo];
  if (!regra) return state.notificacoes;
  const ctx = {
    obraOrigem: nomeObra(t.obraOrigemId),
    obraDestino: nomeObra(t.obraDestinoId),
    autor,
    detalhe,
  };
  const n: Notificacao = {
    id: nid('ntf'),
    transferenciaId: t.id,
    transferenciaCodigo: t.codigo,
    titulo: regra.titulo(t),
    descricao: regra.descricao(t, ctx),
    em: agora(),
    destinatarios: regra.destinatarios,
    tripla: Boolean(regra.tripla),
    lida: false,
  };
  return [n, ...state.notificacoes];
}

function comEvento(
  t: Transferencia, tipo: EventoTipo, papel: Role | 'sistema', autor: string,
  obra: string, detalhe?: string,
): Transferencia {
  return {
    ...t,
    eventos: [...t.eventos, { id: nid('evt'), tipo, em: agora(), porNome: autor, porPapel: papel, obra, detalhe }],
  };
}

function mapear(state: AppState, id: string, fn: (t: Transferencia) => Transferencia): Transferencia[] {
  return state.transferencias.map((t) => (t.id === id ? fn(t) : t));
}

function achar(state: AppState, id: string): Transferencia {
  return state.transferencias.find((t) => t.id === id)!;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'criar': {
      const seq = state.seq + 1;
      const codigo = `TR-${String(seq).padStart(6, '0')}`;
      const autor = USUARIO_POR_PAPEL.origem;
      const nova: Transferencia = {
        id: nid('tr'),
        codigo,
        // Nasce Reservado: a quantidade trava, nada se move fisicamente.
        status: 'reservado',
        obraOrigemId: OBRA_ATUAL,
        obraDestinoId: action.obraDestinoId,
        criadaPor: autor,
        criadaEm: agora(),
        entrada: action.entrada,
        requisicaoCodigo: action.requisicaoCodigo,
        observacao: action.observacao,
        assinatura: action.assinatura,
        itens: action.itens,
        ciclo: 0,
        eventos: [{
          id: nid('evt'), tipo: 'criada', em: agora(), porNome: autor,
          porPapel: 'origem', obra: nomeObra(OBRA_ATUAL),
        }],
      };
      return {
        ...state,
        seq,
        transferencias: [nova, ...state.transferencias],
        toasts: [...state.toasts, {
          id: nid('tst'), tom: 'sucesso',
          titulo: `${codigo} criada como Reservada`,
          descricao: state.aprovacaoAtiva
            ? 'A quantidade foi travada no estoque. Envie para aprovação quando o material estiver separado.'
            : 'A quantidade foi travada no estoque. Aprovação está desligada: registre o despacho para seguir.',
        }],
      };
    }

    case 'enviar_aprovacao': {
      const autor = USUARIO_POR_PAPEL.origem;
      const t0 = achar(state, action.id);
      const t1 = comEvento({ ...t0, status: 'aguardando_aprovacao' }, 'enviada_aprovacao', 'origem', autor, nomeObra(t0.obraOrigemId));
      return {
        ...state,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, 'enviada_aprovacao', autor),
        toasts: [...state.toasts, { id: nid('tst'), tom: 'info', titulo: `${t0.codigo} enviada para aprovação`, descricao: 'O Aprovador da obra de destino foi notificado.' }],
      };
    }

    case 'aprovar': {
      const autor = USUARIO_POR_PAPEL.aprovador;
      const t0 = achar(state, action.id);
      const t1 = comEvento(
        { ...t0, status: 'aprovado', aprovadaPor: autor, aprovadaEm: agora() },
        'aprovada', 'aprovador', autor, nomeObra(t0.obraDestinoId),
      );
      return {
        ...state,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, 'aprovada', autor),
        toasts: [...state.toasts, { id: nid('tst'), tom: 'sucesso', titulo: `${t0.codigo} aprovada`, descricao: 'Origem e destino foram notificados.' }],
      };
    }

    case 'reprovar': {
      const autor = USUARIO_POR_PAPEL.aprovador;
      const t0 = achar(state, action.id);
      const t1 = comEvento(
        { ...t0, status: 'reprovado', motivoReprovacao: action.motivo },
        'reprovada', 'aprovador', autor, nomeObra(t0.obraDestinoId), action.motivo,
      );
      return {
        ...state,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, 'reprovada', autor, action.motivo),
        toasts: [...state.toasts, { id: nid('tst'), tom: 'info', titulo: `${t0.codigo} reprovada`, descricao: 'A quantidade voltou ao disponível da origem.' }],
      };
    }

    case 'despachar': {
      const autor = USUARIO_POR_PAPEL.origem;
      const t0 = achar(state, action.id);
      const t1 = comEvento(
        { ...t0, status: 'em_transito', despachadaEm: agora(), previsaoChegada: action.previsaoChegada },
        'despachada', 'origem', autor, nomeObra(t0.obraOrigemId),
        `Previsão de chegada: ${new Date(action.previsaoChegada).toLocaleDateString('pt-BR')}`,
      );
      // O material sai fisicamente da obra de origem neste momento.
      const delta = { ...state.saldoDelta };
      if (t0.obraOrigemId === OBRA_ATUAL) {
        for (const it of t0.itens) delta[it.insumoId] = (delta[it.insumoId] ?? 0) - it.qtdEnviada;
      }
      return {
        ...state,
        saldoDelta: delta,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, 'despachada', autor),
        toasts: [...state.toasts, { id: nid('tst'), tom: 'sucesso', titulo: `${t0.codigo} em trânsito`, descricao: 'A obra de destino foi notificada com a previsão de chegada.' }],
      };
    }

    case 'registrar_chegada': {
      const autor = USUARIO_POR_PAPEL.destino;
      const t0 = achar(state, action.id);
      const t1 = comEvento(
        { ...t0, status: 'avaliacao_entrega', chegadaEm: agora() },
        'chegada_registrada', 'destino', autor, nomeObra(t0.obraDestinoId),
      );
      return {
        ...state,
        transferencias: mapear(state, action.id, () => t1),
        toasts: [...state.toasts, { id: nid('tst'), tom: 'info', titulo: `${t0.codigo} chegou`, descricao: 'Faça a Avaliação de entrega (FVM) para fechar a movimentação.' }],
      };
    }

    case 'confirmar_recebimento': {
      const autor = USUARIO_POR_PAPEL.destino;
      const t0 = achar(state, action.id);
      const itens = t0.itens.map((it) => ({
        ...it,
        qtdRecebida: action.recebidos[it.insumoId] ?? it.qtdEnviada,
        motivoDivergencia: action.motivos[it.insumoId] || undefined,
      }));
      const temDivergencia = itens.some((it) => it.qtdRecebida !== it.qtdEnviada);
      const status: TransferStatus = temDivergencia ? 'recebido_divergencia' : 'recebido_ok';
      const tipo: EventoTipo = temDivergencia ? 'recebida_divergencia' : 'recebida_ok';
      const resumo = temDivergencia
        ? itens.filter((i) => i.qtdRecebida !== i.qtdEnviada)
          .map((i) => `${i.nome}: enviado ${i.qtdEnviada}${i.unidade}, recebido ${i.qtdRecebida}${i.unidade}`)
          .join(' · ')
        : undefined;
      const t1 = comEvento(
        { ...t0, itens, status, recebidaPor: autor, recebidaEm: agora() },
        tipo, 'destino', autor, nomeObra(t0.obraDestinoId), resumo,
      );
      const delta = { ...state.saldoDelta };
      if (t0.obraDestinoId === OBRA_ATUAL) {
        for (const it of itens) delta[it.insumoId] = (delta[it.insumoId] ?? 0) + (it.qtdRecebida ?? 0);
      }
      return {
        ...state,
        saldoDelta: delta,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, tipo, autor, resumo),
        toasts: [...state.toasts, {
          id: nid('tst'),
          tom: temDivergencia ? 'erro' : 'sucesso',
          titulo: temDivergencia ? `${t0.codigo} recebida com divergência` : `${t0.codigo} recebida sem divergência`,
          descricao: 'Origem, Aprovador e destino foram notificados — este é o único evento com notificação tripla.',
        }],
      };
    }

    case 'cancelar': {
      const autor = USUARIO_POR_PAPEL.origem;
      const t0 = achar(state, action.id);
      const t1 = comEvento(
        { ...t0, status: 'cancelado' }, 'cancelada', 'origem', autor,
        nomeObra(t0.obraOrigemId), action.motivo,
      );
      return {
        ...state,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, 'cancelada', autor, action.motivo),
        toasts: [...state.toasts, { id: nid('tst'), tom: 'info', titulo: `${t0.codigo} cancelada`, descricao: 'A quantidade voltou ao disponível da obra de origem.' }],
      };
    }

    case 'reenviar': {
      const autor = USUARIO_POR_PAPEL.origem;
      const t0 = achar(state, action.id);
      const itens = t0.itens.map((it) => ({
        ...it,
        // Reenvia só o que faltou.
        qtdEnviada: Math.max(0, it.qtdEnviada - (it.qtdRecebida ?? it.qtdEnviada)),
        qtdRecebida: null,
        motivoDivergencia: undefined,
      })).filter((it) => it.qtdEnviada > 0);
      const t1 = comEvento(
        {
          ...t0, status: 'reservado', itens, ciclo: t0.ciclo + 1,
          aprovadaPor: undefined, aprovadaEm: undefined,
          despachadaEm: undefined, previsaoChegada: undefined,
          chegadaEm: undefined, recebidaPor: undefined, recebidaEm: undefined,
        },
        'reenviada', 'origem', autor, nomeObra(t0.obraOrigemId),
        `Reenvio do saldo faltante (${t0.ciclo + 1}º ciclo)`,
      );
      return {
        ...state,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, 'reenviada', autor),
        toasts: [...state.toasts, {
          id: nid('tst'), tom: 'info', titulo: `${t0.codigo} voltou para Reservado`,
          descricao: 'O reenvio passa pela aprovação de novo, sem exceção.',
        }],
      };
    }

    case 'encerrar_divergencia': {
      const t0 = achar(state, action.id);
      return {
        ...state,
        toasts: [...state.toasts, {
          id: nid('tst'), tom: 'info', titulo: `${t0.codigo} encerrada com divergência`,
          descricao: 'O registro fica disponível para auditoria.',
        }],
      };
    }

    case 'set_aprovacao': return { ...state, aprovacaoAtiva: action.valor };
    case 'set_papel': return { ...state, papel: action.valor };
    case 'set_estado_tela': return { ...state, estadoTela: action.valor };
    case 'ler_notificacoes':
      return { ...state, notificacoes: state.notificacoes.map((n) => ({ ...n, lida: true })) };
    case 'toast':
      return { ...state, toasts: [...state.toasts, { ...action.toast, id: nid('tst') }] };
    case 'fechar_toast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

/* ============================================================
   Selectors de saldo — seção 6: a coluna de quantidade precisa
   distinguir disponível / reservado / em trânsito.
   ============================================================ */

export interface SaldoInsumo {
  fisico: number;
  disponivel: number;
  reservado: number;
  emTransito: number;
  aReceber: number;
}

export function saldosDoInsumo(
  insumoId: string, transferencias: Transferencia[], saldoDelta: Record<string, number>,
): SaldoInsumo {
  const base = INSUMOS.find((i) => i.id === insumoId)?.saldo ?? 0;
  const fisico = base + (saldoDelta[insumoId] ?? 0);
  let reservado = 0, emTransito = 0, aReceber = 0;
  for (const t of transferencias) {
    for (const it of t.itens) {
      if (it.insumoId !== insumoId) continue;
      if (t.obraOrigemId === OBRA_ATUAL) {
        if (STATUS_RESERVA.includes(t.status)) reservado += it.qtdEnviada;
        if (STATUS_TRANSITO.includes(t.status)) emTransito += it.qtdEnviada;
      }
      if (t.obraDestinoId === OBRA_ATUAL && STATUS_TRANSITO.includes(t.status)) {
        aReceber += it.qtdEnviada;
      }
    }
  }
  return { fisico, disponivel: Math.max(0, fisico - reservado), reservado, emTransito, aReceber };
}

/* ============================================================
   Contexto
   ============================================================ */

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  aEnviar: Transferencia[];
  aReceber: Transferencia[];
  notificacoesDoPapel: Notificacao[];
  saldo: (insumoId: string) => SaldoInsumo;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const aEnviar = useMemo(
    () => state.transferencias.filter((t) => t.obraOrigemId === OBRA_ATUAL),
    [state.transferencias],
  );
  const aReceber = useMemo(
    () => state.transferencias.filter((t) => t.obraDestinoId === OBRA_ATUAL),
    [state.transferencias],
  );
  const notificacoesDoPapel = useMemo(
    () => state.notificacoes.filter((n) => n.destinatarios.includes(state.papel)),
    [state.notificacoes, state.papel],
  );
  const saldo = useCallback(
    (insumoId: string) => saldosDoInsumo(insumoId, state.transferencias, state.saldoDelta),
    [state.transferencias, state.saldoDelta],
  );

  const value = useMemo(
    () => ({ state, dispatch, aEnviar, aReceber, notificacoesDoPapel, saldo }),
    [state, aEnviar, aReceber, notificacoesDoPapel, saldo],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore fora do StoreProvider');
  return c;
}
