import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Boxes, ArrowUpDown, Bell } from 'lucide-react';
import { useStore, type EstadoTela } from '../../state/store';
import { OBRA_ATUAL, nomeObra } from '../../data/obras';
import { STATUS_META } from '../../domain/status';
import { Sheet, MobAviso } from './comuns';
import { TelaTransferencias } from './TelaTransferencias';
import { TelaDetalhe } from './TelaDetalhe';
import { TelaNova } from './TelaNova';
import { TelaFvm, TelaFvmFim } from './TelaFvm';
import { TelaEstoque, TelaMovimentacoes, TelaNotificacoes } from './TelasApoio';

/* ============================================================
   App mobile — mesmo fluxo do web, navegação de aplicativo:
   abas na base para as quatro áreas e pilha para os fluxos
   que ocupam a tela inteira (detalhe, criação, conferência).
   ============================================================ */

type Tela =
  | { t: 'transferencias' }
  | { t: 'estoque' }
  | { t: 'movimentacoes' }
  | { t: 'notificacoes' }
  | { t: 'detalhe'; id: string; leitura?: boolean }
  | { t: 'nova' }
  | { t: 'fvm'; id: string }
  | { t: 'fvm-fim'; id: string; divergente: boolean };

const ABAS = [
  { t: 'transferencias' as const, rotulo: 'Transferências', Icone: ArrowLeftRight },
  { t: 'estoque' as const, rotulo: 'Estoque', Icone: Boxes },
  { t: 'movimentacoes' as const, rotulo: 'Movimentações', Icone: ArrowUpDown },
  { t: 'notificacoes' as const, rotulo: 'Alertas', Icone: Bell },
];

const RAIZES = ABAS.map((a) => a.t) as string[];

export function MobileApp({ semMoldura = false }: { semMoldura?: boolean } = {}) {
  const { state, dispatch, notificacoesDoPapel, aguardandoOutraEmpresa } = useStore();
  const [pilha, setPilha] = useState<Tela[]>([{ t: 'transferencias' }]);
  const [config, setConfig] = useState(false);

  const atual = pilha[pilha.length - 1];
  const naRaiz = RAIZES.includes(atual.t);

  const empilhar = useCallback((tela: Tela) => setPilha((p) => [...p, tela]), []);
  const voltar = useCallback(() => setPilha((p) => (p.length > 1 ? p.slice(0, -1) : p)), []);
  const irParaAba = useCallback((t: Tela['t']) => setPilha([{ t } as Tela]), []);
  /** Volta para a raiz da aba atual, descartando o fluxo empilhado. */
  const voltarARaiz = useCallback(
    () => setPilha((p) => [p.find((x) => RAIZES.includes(x.t)) ?? { t: 'transferencias' }]),
    [],
  );

  const transferencia = useMemo(() => {
    const id = 'id' in atual ? atual.id : null;
    return id ? state.transferencias.find((x) => x.id === id) ?? null : null;
  }, [atual, state.transferencias]);

  const naoLidas = notificacoesDoPapel.filter((n) => !n.lida).length;

  // A aprovação acontece na tela de detalhe, empilhada: o aviso de fim
  // precisa morar acima da pilha para aparecer onde quer que o usuário
  // esteja quando a fila da outra empresa zerar.
  const simulando = state.modoAprovador;
  const [avisoFim, setAvisoFim] = useState(false);
  useEffect(() => { if (!simulando) setAvisoFim(false); }, [simulando]);
  useEffect(() => {
    if (simulando && aguardandoOutraEmpresa.length === 0) setAvisoFim(true);
  }, [simulando, aguardandoOutraEmpresa.length]);

  function conteudo() {
    switch (atual.t) {
      case 'transferencias':
        return (
          <TelaTransferencias
            onAbrir={(id, leitura) => empilhar({ t: 'detalhe', id, leitura })}
            onNova={() => empilhar({ t: 'nova' })}
            onConfig={() => setConfig(true)}
          />
        );
      case 'estoque':
        return <TelaEstoque onSaida={() => empilhar({ t: 'nova' })} />;
      case 'movimentacoes':
        return <TelaMovimentacoes onAbrir={(id) => empilhar({ t: 'detalhe', id })} />;
      case 'notificacoes':
        return <TelaNotificacoes onAbrir={(id) => empilhar({ t: 'detalhe', id })} />;
      case 'detalhe':
        return transferencia
          ? <TelaDetalhe
              t={transferencia} onVoltar={voltar}
              somenteLeitura={atual.leitura}
              onFvm={(id) => empilhar({ t: 'fvm', id })}
            />
          : null;
      case 'nova':
        return <TelaNova onSair={voltar} />;
      case 'fvm':
        return transferencia
          ? <TelaFvm
              t={transferencia}
              onVoltar={voltar}
              onPronto={(divergente) => setPilha((p) => [...p.slice(0, -1), { t: 'fvm-fim', id: atual.id, divergente }])}
            />
          : null;
      case 'fvm-fim':
        return transferencia
          ? <TelaFvmFim
              t={transferencia}
              divergente={atual.divergente}
              onVoltar={voltarARaiz}
              onVerDetalhe={() => setPilha((p) => [...p.slice(0, -1), { t: 'detalhe', id: atual.id }])}
            />
          : null;
    }
  }

  return (
    <div className={`mob-app ${semMoldura ? 'mob-app--nua' : ''}`}>
      <span className="mob-status__ilha" aria-hidden="true" />
      <div className="mob-status"><span>9:41</span><span>Suplos</span></div>

      {conteudo()}

      {naRaiz && (
        <nav className="mob-tabs" aria-label="Navegação">
          {ABAS.map(({ t, rotulo, Icone }) => (
            <button
              key={t}
              className={`mob-tab ${atual.t === t ? 'mob-tab--ativa' : ''}`}
              onClick={() => irParaAba(t)}
              aria-current={atual.t === t}
            >
              <Icone size={21} strokeWidth={atual.t === t ? 2.4 : 1.9} />
              <span>{rotulo}</span>
              {t === 'notificacoes' && naoLidas > 0 && (
                <span className="mob-tab__badge">{naoLidas}</span>
              )}
            </button>
          ))}
        </nav>
      )}

      <span className="mob-gesto" aria-hidden="true" />
      {config && <SheetConfig onFechar={() => setConfig(false)} />}
      {avisoFim && (
        <SheetFimSimulacao onVoltar={() => {
          setAvisoFim(false);
          dispatch({ type: 'set_modo_aprovador', valor: false });
          voltarARaiz();
        }} />
      )}
    </div>
  );
}

/* ============================================================
   Controles do protótipo — o equivalente mobile da barra de
   demonstração do web.
   ============================================================ */
function SheetConfig({ onFechar }: { onFechar: () => void }) {
  const { state, dispatch } = useStore();
  return (
    <Sheet
      titulo="Controles do protótipo"
      sub="Os mesmos parâmetros da barra de demonstração da versão web. O protótipo simula o painel de uma empresa só."
      onFechar={onFechar}
      rodape={<button className="mob-btn mob-btn--escuro" onClick={onFechar}>Fechar</button>}
    >
      <div className="mob-campo">
        <label className="mob-rot">Estado da tela</label>
        {(['normal', 'carregando', 'vazio', 'erro'] as EstadoTela[]).map((e) => (
          <button
            key={e} className="mob-opcao" aria-pressed={state.estadoTela === e}
            onClick={() => dispatch({ type: 'set_estado_tela', valor: e })}
          >
            <div className="mob-opcao__txt">
              <div className="mob-opcao__nome" style={{ textTransform: 'capitalize' }}>{e}</div>
            </div>
            {state.estadoTela === e && <span className="mob-opcao__check">●</span>}
          </button>
        ))}
      </div>

      <div className="mob-campo">
        <label className="mob-rot">Estados do fluxo</label>
        <div className="mob-cartao">
          {Object.values(STATUS_META).map((m) => (
            <div className="mob-linha" key={m.label}>
              <span className="mob-linha__r" style={{ flex: 1 }}>{m.label}</span>
              <span className="mob-linha__v" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
                {m.terminal ? 'final' : 'em curso'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 10 }} />
    </Sheet>
  );
}

/* ============================================================
   Fim da simulação — traz o usuário de volta para a própria obra
   ============================================================ */
function SheetFimSimulacao({ onVoltar }: { onVoltar: () => void }) {
  return (
    <Sheet
      titulo="Aprovação registrada"
      sub="Nada mais depende da outra empresa"
      onFechar={onVoltar}
      rodape={
        <button className="mob-btn mob-btn--primario" onClick={onVoltar}>
          Voltar para o fluxo da minha obra
        </button>
      }
    >
      <MobAviso tom="ok" titulo="A fila de aprovação zerou">
        Volte para o painel de {nomeObra(OBRA_ATUAL)} para seguir o fluxo — despachar o que foi
        aprovado, acompanhar o trânsito e conferir o que chegar.
      </MobAviso>
      <p className="mob-dica">
        O modo de simulação volta a ficar apagado até que outra transferência sua precise do ok de
        quem vai receber.
      </p>
    </Sheet>
  );
}
