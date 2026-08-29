import React, { createContext, useContext, useMemo, useReducer, useCallback } from 'react';
import type {
  AvaliacaoEntrega, Notificacao, Role, TransferItem, Transferencia, TransferStatus, EventoTipo,
} from '../domain/types';
import { STATUS_RESERVA, STATUS_TRANSITO, temDivergencia } from '../domain/status';
import { pendentesDeAprovacaoExterna } from '../domain/machine';
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
  /**
   * Parâmetro por cliente (seção 2). Fixo em ligado no protótipo: é a
   * aprovação que cria a única pendência da outra empresa, e é ela que o
   * modo de simulação existe para resolver.
   */
  aprovacaoAtiva: boolean;
  /**
   * Modo de simulação: o usuário empresta, por um instante, o papel de
   * Aprovador da empresa que vai receber. Fora dele o protótipo é o
   * painel de uma empresa só.
   */
  modoAprovador: boolean;
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
  modoAprovador: false,
  estadoTela: 'normal',
  saldoDelta: {},
  seq: 144,
};

/* ============================================================
   Ações
   ============================================================ */

export type Action =
  | { type: 'criar'; itens: TransferItem[]; obraDestinoId: string; observacao: string; assinatura: string; entrada: 'saida_direta' | 'requisicao'; requisicaoCodigo?: string }
  | { type: 'aprovar'; id: string }
  | { type: 'reprovar'; id: string; motivo: string }
  | { type: 'despachar'; id: string; dataSaida: string; previsaoChegada: string }
  | { type: 'registrar_chegada'; id: string }
  | { type: 'confirmar_recebimento'; id: string; recebidos: Record<string, number>; motivos: Record<string, string>; avaliacao?: AvaliacaoEntrega }
  | { type: 'confirmar_nf'; id: string; numero: string; anexo: string }
  | { type: 'cancelar'; id: string; motivo: string }
  | { type: 'reenviar'; id: string }
  | { type: 'encerrar_divergencia'; id: string; observacao: string }
  | { type: 'set_modo_aprovador'; valor: boolean }
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
    critica: Boolean(regra.critica),
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
        // Nasce com a quantidade já travada. Com o parâmetro de aprovação
        // ligado, entra direto em "aprovação pendente" — não fica esperando
        // um segundo clique para ser enviada.
        status: state.aprovacaoAtiva ? 'aguardando_aprovacao' : 'reservado',
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
        notificacoes: state.aprovacaoAtiva ? notificar(state, nova, 'criada', autor) : state.notificacoes,
        toasts: [...state.toasts, {
          id: nid('tst'), tom: 'sucesso',
          titulo: `${codigo} reservada`,
          descricao: state.aprovacaoAtiva
            ? 'A quantidade foi travada no estoque e a obra de destino já foi avisada para aprovar.'
            : 'A quantidade foi travada no estoque. Aprovação está desligada: registre o despacho para seguir.',
        }],
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
        {
          ...t0, status: 'em_transito', despachadaEm: agora(),
          dataSaida: action.dataSaida, previsaoChegada: action.previsaoChegada,
        },
        'despachada', 'origem', autor, nomeObra(t0.obraOrigemId),
        `Saiu em ${new Date(action.dataSaida).toLocaleDateString('pt-BR')} · previsão de chegada ${new Date(action.previsaoChegada).toLocaleDateString('pt-BR')}`,
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
        toasts: [...state.toasts, {
          id: nid('tst'), tom: 'info', titulo: `${t0.codigo} chegou`,
          // Sai do trânsito, mas não entra no estoque: quem faz isso é a FVM.
          descricao: 'Saiu do trânsito e está em FVM pendente. O material só entra no estoque depois da Avaliação de entrega.',
        }],
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
      const temDiferenca = itens.some((it) => it.qtdRecebida !== it.qtdEnviada);
      // A conferência não encerra: o material entra no estoque e a
      // transferência fica Aguardando NF até a nota ser confirmada.
      const status: TransferStatus = 'aguardando_nf';
      const tipo: EventoTipo = temDiferenca ? 'recebida_divergencia' : 'recebida_ok';
      const resumo = temDiferenca
        ? itens.filter((i) => i.qtdRecebida !== i.qtdEnviada)
          .map((i) => `${i.nome}: enviado ${i.qtdEnviada}${i.unidade}, recebido ${i.qtdRecebida}${i.unidade}`)
          .join(' · ')
        : undefined;
      const t1 = comEvento(
        {
          ...t0, itens, status, recebidaPor: autor, recebidaEm: agora(),
          avaliacao: action.avaliacao,
        },
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
          tom: temDiferenca ? 'erro' : 'sucesso',
          titulo: temDiferenca ? `${t0.codigo} chegou COM divergência` : `${t0.codigo} recebida sem divergência`,
          descricao: temDiferenca
            ? `Origem, Aprovador e destino foram notificados. A transferência voltou para os Reservados de ${nomeObra(t0.obraOrigemId)}: só ela pode encerrar o caso. Anexar a NF aqui não finaliza.`
            : 'Origem, Aprovador e destino foram notificados — é o único evento com notificação tripla. Falta confirmar a NF.',
        }],
      };
    }

    case 'confirmar_nf': {
      const autor = USUARIO_POR_PAPEL.destino;
      const t0 = achar(state, action.id);
      const teveDivergencia = temDivergencia(t0);
      // Sem divergência, a NF fecha a transferência. Com divergência, não:
      // o destino cumpriu a parte dele, mas quem encerra é a origem.
      const status: TransferStatus = teveDivergencia ? 'recebido_divergencia' : 'recebido_ok';
      const t1 = comEvento(
        {
          ...t0,
          status,
          nf: { numero: action.numero, anexo: action.anexo, confirmadaPor: autor, confirmadaEm: agora() },
        },
        'nf_confirmada', 'destino', autor, nomeObra(t0.obraDestinoId),
        `NF ${action.numero}${action.anexo ? ' · anexo enviado' : ''}`,
      );
      return {
        ...state,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, 'nf_confirmada', autor, `NF ${action.numero}`),
        toasts: [...state.toasts, {
          id: nid('tst'),
          tom: teveDivergencia ? 'info' : 'sucesso',
          titulo: teveDivergencia ? `${t0.codigo} — NF confirmada` : `${t0.codigo} encerrada`,
          descricao: teveDivergencia
            ? `NF anexada, mas a transferência ainda não fecha: a divergência segue aberta até ${nomeObra(t0.obraOrigemId)} decidir se envia o saldo faltante ou encerra assumindo a falta.`
            : 'NF confirmada. A transferência está completa.',
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
          ...t0,
          // O toast sempre prometeu que "o reenvio passa pela aprovação de
          // novo": com o parâmetro ligado, ele precisa mesmo voltar para a
          // fila do Aprovador, e não para Reservado pronto para despacho.
          status: state.aprovacaoAtiva ? 'aguardando_aprovacao' : 'reservado',
          itens, ciclo: t0.ciclo + 1,
          aprovadaPor: undefined, aprovadaEm: undefined,
          despachadaEm: undefined, previsaoChegada: undefined,
          chegadaEm: undefined, recebidaPor: undefined, recebidaEm: undefined,
          dataSaida: undefined, avaliacao: undefined, nf: undefined,
          encerramento: undefined,
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
          descricao: state.aprovacaoAtiva
            ? 'Só o saldo que faltou foi reservado de novo, e o reenvio passa pela aprovação outra vez — sem exceção.'
            : 'Só o saldo que faltou foi reservado de novo. Registre o despacho para seguir.',
        }],
      };
    }

    case 'encerrar_divergencia': {
      // A decisão que fecha o caso. Sem ela a transferência fica aberta,
      // mesmo com a nota fiscal já anexada pelo destino.
      const autor = USUARIO_POR_PAPEL.origem;
      const t0 = achar(state, action.id);
      const faltante = t0.itens
        .filter((i) => i.qtdRecebida !== null && i.qtdRecebida !== i.qtdEnviada)
        .map((i) => `${i.nome}: faltaram ${(i.qtdEnviada - (i.qtdRecebida ?? 0)).toLocaleString('pt-BR')} ${i.unidade}`)
        .join(' · ');
      const t1 = comEvento(
        {
          ...t0,
          status: 'encerrado_divergencia',
          encerramento: { por: autor, em: agora(), observacao: action.observacao },
        },
        'divergencia_encerrada', 'origem', autor, nomeObra(t0.obraOrigemId),
        [faltante, action.observacao].filter(Boolean).join(' — '),
      );
      return {
        ...state,
        transferencias: mapear(state, action.id, () => t1),
        notificacoes: notificar(state, t1, 'divergencia_encerrada', autor, action.observacao),
        toasts: [...state.toasts, {
          id: nid('tst'), tom: 'info', titulo: `${t0.codigo} finalizada com divergência`,
          descricao: 'A origem assumiu a falta. O registro fica disponível para auditoria em "Finalizadas c/ divergência".',
        }],
      };
    }

    case 'set_modo_aprovador': return { ...state, modoAprovador: action.valor };
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
  /** Transferências saindo daqui paradas na aprovação da outra empresa. */
  aguardandoOutraEmpresa: Transferencia[];
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
  // No painel da própria empresa, interessa o que ela recebe como origem
  // ou destino; dentro do modo de simulação, o que a outra ponta recebe.
  const notificacoesDoPapel = useMemo(
    () => state.notificacoes.filter((n) => (state.modoAprovador
      ? n.destinatarios.includes('aprovador')
      : n.destinatarios.some((p) => p === 'origem' || p === 'destino'))),
    [state.notificacoes, state.modoAprovador],
  );
  const aguardandoOutraEmpresa = useMemo(
    () => pendentesDeAprovacaoExterna(state.transferencias, OBRA_ATUAL),
    [state.transferencias],
  );
  const saldo = useCallback(
    (insumoId: string) => saldosDoInsumo(insumoId, state.transferencias, state.saldoDelta),
    [state.transferencias, state.saldoDelta],
  );

  const value = useMemo(
    () => ({ state, dispatch, aEnviar, aReceber, notificacoesDoPapel, saldo, aguardandoOutraEmpresa }),
    [state, aEnviar, aReceber, notificacoesDoPapel, saldo, aguardandoOutraEmpresa],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore fora do StoreProvider');
  return c;
}
