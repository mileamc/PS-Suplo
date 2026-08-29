import { useState } from 'react';
import {
  Boxes, ArrowLeftRight, Bell, Smartphone, Building2, BookOpen, Check, X, AlertTriangle,
} from 'lucide-react';
import { useStore, USUARIO_POR_PAPEL } from '../state/store';
import type { Role } from '../domain/types';
import { ROLE_LABEL, fmtDataHora } from '../domain/notificacoes';
import { Segmentado, Switch } from './ui';
import type { Rota } from '../state/rotas';

/* ============================================================
   Sidebar — espelha o rail escuro do produto atual
   ============================================================ */
export function Sidebar({ rota, onNavegar }: { rota: Rota; onNavegar: (r: Rota) => void }) {
  // O rail do produto tem mais de uma dezena de módulos, mas este é um
  // protótipo de duas telas: ícone que não leva a lugar nenhum só convida
  // ao clique morto. Ficam os dois que existem de verdade.
  return (
    <nav className="sidebar" aria-label="Navegação principal">
      <div className="sidebar__logo" title="Suplos">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 3v18M5.5 6.5l13 11M18.5 6.5l-13 11" />
        </svg>
      </div>
      <button
        className={`sidebar__item ${rota === 'estoque' ? 'sidebar__item--ativo' : ''}`}
        title="Estoque de Materiais" onClick={() => onNavegar('estoque')}
      >
        <Boxes size={17} />
      </button>
      <button
        className={`sidebar__item ${rota === 'transferencias' ? 'sidebar__item--ativo' : ''}`}
        title="Transferências entre Obras" onClick={() => onNavegar('transferencias')}
      >
        <ArrowLeftRight size={17} />
      </button>
      <div className="sidebar__spacer" />
      <div className="sidebar__avatar" />
    </nav>
  );
}

/* ============================================================
   Header escuro da tela
   ============================================================ */
export function TelaHeader({
  titulo, sub, ajuda, acoes, onVerMobile,
}: {
  titulo: string; sub: string; ajuda: string;
  acoes?: React.ReactNode; onVerMobile?: () => void;
}) {
  return (
    <header className="tela-header">
      <div>
        <h1 className="tela-header__titulo">{titulo}</h1>
        <div className="tela-header__sub">{sub}</div>
      </div>
      <div className="tela-header__acoes">
        <button className="tela-header__ajuda"><BookOpen size={14} /> {ajuda}</button>
        {acoes}
        {onVerMobile && (
          <button className="icon-btn-dark" title="Versão mobile" onClick={onVerMobile}>
            <Smartphone size={15} />
          </button>
        )}
        <SinoNotificacoes />
        <button className="icon-btn-dark" title="Obra atual: Suplos Tower II"><Building2 size={15} /></button>
        <div className="sidebar__avatar" style={{ margin: 0 }} />
      </div>
    </header>
  );
}

/* ============================================================
   Sino de notificações — seção 4
   ============================================================ */
function SinoNotificacoes() {
  const { notificacoesDoPapel, state, dispatch } = useStore();
  const [aberto, setAberto] = useState(false);
  const naoLidas = notificacoesDoPapel.filter((n) => !n.lida).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="icon-btn-dark"
        title="Notificações"
        onClick={() => { setAberto((v) => !v); if (!aberto) dispatch({ type: 'ler_notificacoes' }); }}
      >
        <Bell size={15} />
        {naoLidas > 0 && <span className="icon-btn-dark__dot" />}
      </button>
      {aberto && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setAberto(false)} />
          <div className="popover">
            <div className="popover__cabecalho">
              <div>
                <div className="popover__titulo">Notificações</div>
                <div className="txt-11 txt-muted" style={{ marginTop: 2 }}>
                  Vendo como <strong>{ROLE_LABEL[state.papel]}</strong> · {USUARIO_POR_PAPEL[state.papel]}
                </div>
              </div>
              <button className="modal__fechar" onClick={() => setAberto(false)}><X size={16} /></button>
            </div>
            <div className="popover__lista">
              {notificacoesDoPapel.length === 0 ? (
                <div style={{ padding: 26, textAlign: 'center' }} className="txt-12 txt-muted">
                  Nenhuma notificação para este papel ainda.<br />
                  Execute uma ação no fluxo para ver quem é avisado.
                </div>
              ) : notificacoesDoPapel.map((n) => (
                <div key={n.id} className={`notif ${n.critica ? 'notif--critica' : n.tripla ? 'notif--tripla' : ''}`}>
                  <div className="notif__icone">
                    {n.critica ? <AlertTriangle size={15} color="var(--red-fg)" />
                      : n.tripla ? <Check size={15} color="var(--amber-fg)" />
                      : <Bell size={14} color="var(--text-faint)" />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="notif__titulo">{n.titulo}</div>
                    <div className="notif__desc">{n.descricao}</div>
                    <div className="notif__papeis">
                      {(['origem', 'aprovador', 'destino'] as Role[]).map((p) => (
                        <span key={p} className={`notif__papel ${n.destinatarios.includes(p) ? 'notif__papel--on' : ''}`}>
                          {ROLE_LABEL[p]}
                        </span>
                      ))}
                      {n.tripla && <span className="notif__papel notif__papel--on">notificação tripla</span>}
                      {n.critica && <span className="notif__papel notif__papel--critica">exige decisão</span>}
                    </div>
                    <div className="txt-11 txt-muted" style={{ marginTop: 6 }}>{fmtDataHora(n.em)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   Barra de controles do protótipo
   ============================================================ */
export function DemoBar() {
  const { state, dispatch } = useStore();
  return (
    <div className="demobar">
      <div className="demobar__grupo">
        <span className="demobar__rotulo">Ver como</span>
        <Segmentado<Role>
          valor={state.papel}
          onMudar={(v) => dispatch({ type: 'set_papel', valor: v })}
          opcoes={[
            { valor: 'origem', rotulo: 'Obra de origem' },
            { valor: 'aprovador', rotulo: 'Aprovador' },
            { valor: 'destino', rotulo: 'Obra de destino' },
          ]}
        />
      </div>
      <div className="demobar__grupo">
        <span className="demobar__rotulo">Aprovação obrigatória (parâmetro do cliente)</span>
        <Switch
          ligado={state.aprovacaoAtiva}
          rotulo="Aprovação obrigatória"
          onMudar={(v) => dispatch({ type: 'set_aprovacao', valor: v })}
        />
        <span className="demobar__rotulo">{state.aprovacaoAtiva ? 'ligada' : 'desligada'}</span>
      </div>
      <div className="demobar__grupo">
        <span className="demobar__rotulo">Estado da tela</span>
        <Segmentado
          valor={state.estadoTela}
          onMudar={(v) => dispatch({ type: 'set_estado_tela', valor: v })}
          opcoes={[
            { valor: 'normal', rotulo: 'Normal' },
            { valor: 'carregando', rotulo: 'Carregando' },
            { valor: 'vazio', rotulo: 'Vazio' },
            { valor: 'erro', rotulo: 'Erro' },
          ]}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Toasts
   ============================================================ */
export function Toasts() {
  const { state, dispatch } = useStore();
  return (
    <div className="toasts">
      {state.toasts.slice(-3).map((t) => (
        <ToastItem key={t.id} id={t.id} tom={t.tom} titulo={t.titulo} descricao={t.descricao}
          onFechar={() => dispatch({ type: 'fechar_toast', id: t.id })} />
      ))}
    </div>
  );
}

function ToastItem({
  tom, titulo, descricao, onFechar,
}: { id: string; tom: 'sucesso' | 'erro' | 'info'; titulo: string; descricao?: string; onFechar: () => void }) {
  const cor = tom === 'sucesso' ? 'var(--green)' : tom === 'erro' ? 'var(--red)' : 'var(--blue)';
  const Icone = tom === 'sucesso' ? Check : tom === 'erro' ? X : Bell;
  return (
    <div className="toast" style={{ ['--c' as string]: cor }}>
      <Icone size={15} color={cor} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="toast__titulo">{titulo}</div>
        {descricao && <div className="toast__desc">{descricao}</div>}
      </div>
      <button className="modal__fechar" onClick={onFechar} style={{ width: 24, height: 24 }}><X size={14} /></button>
    </div>
  );
}
