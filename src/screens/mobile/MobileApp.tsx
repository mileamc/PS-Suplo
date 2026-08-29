import { useCallback, useMemo, useState } from 'react';
import { ArrowLeftRight, Boxes, ArrowUpDown, Bell } from 'lucide-react';
import { useStore, type EstadoTela } from '../../state/store';
import { STATUS_META } from '../../domain/status';
import { ROLE_LABEL } from '../../domain/notificacoes';
import type { Role } from '../../domain/types';
import { Sheet } from './comuns';
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
  const { state, notificacoesDoPapel } = useStore();
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
        return <TelaEstoque />;
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
      sub="Os mesmos parâmetros da barra de demonstração da versão web."
      onFechar={onFechar}
      rodape={<button className="mob-btn mob-btn--escuro" onClick={onFechar}>Fechar</button>}
    >
      <div className="mob-campo">
        <label className="mob-rot">Ver como</label>
        {(['origem', 'aprovador', 'destino'] as Role[]).map((p) => (
          <button
            key={p} className="mob-opcao" aria-pressed={state.papel === p}
            onClick={() => dispatch({ type: 'set_papel', valor: p })}
          >
            <div className="mob-opcao__txt">
              <div className="mob-opcao__nome">{ROLE_LABEL[p]}</div>
              <div className="mob-opcao__meta">
                {p === 'origem' ? 'Cria, cancela e despacha'
                  : p === 'aprovador' ? 'Aprova ou reprova'
                  : 'Registra chegada e confere a entrega'}
              </div>
            </div>
            {state.papel === p && <span className="mob-opcao__check">●</span>}
          </button>
        ))}
        <p className="mob-dica">
          Muda quais ações ficam disponíveis em cada estado, conforme a tabela de atores.
        </p>
      </div>

      <div className="mob-campo">
        <label className="mob-rot">Aprovação obrigatória</label>
        <button
          className="mob-opcao" aria-pressed={state.aprovacaoAtiva}
          onClick={() => dispatch({ type: 'set_aprovacao', valor: !state.aprovacaoAtiva })}
        >
          <div className="mob-opcao__txt">
            <div className="mob-opcao__nome">{state.aprovacaoAtiva ? 'Ligada' : 'Desligada'}</div>
            <div className="mob-opcao__meta">
              {state.aprovacaoAtiva
                ? 'O estado "Aguardando aprovação" existe no fluxo'
                : 'O fluxo pula de Reservado direto para o despacho'}
            </div>
          </div>
          {state.aprovacaoAtiva && <span className="mob-opcao__check">●</span>}
        </button>
        <p className="mob-dica">Parâmetro por cliente — decide se o estado existe, sem duplicar lógica.</p>
      </div>

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
