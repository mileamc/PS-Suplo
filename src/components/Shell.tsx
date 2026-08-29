import { useEffect, useState } from 'react';
import {
  Boxes, ArrowLeftRight, Bell, Smartphone, Building2, BookOpen, Check, X, AlertTriangle,
  UserCheck, ArrowLeft,
} from 'lucide-react';
import { useStore, USUARIO_POR_PAPEL } from '../state/store';
import type { Role } from '../domain/types';
import { OBRA_ATUAL, nomeObra } from '../data/obras';
import { ROLE_LABEL, fmtDataHora } from '../domain/notificacoes';
import { Segmentado } from './ui';
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
                  {state.modoAprovador
                    ? <>Simulando o <strong>Aprovador</strong> da outra empresa</>
                    : <>O que <strong>{nomeObra(OBRA_ATUAL)}</strong> é avisada</>}
                </div>
              </div>
              <button className="modal__fechar" onClick={() => setAberto(false)}><X size={16} /></button>
            </div>
            <div className="popover__lista">
              {notificacoesDoPapel.length === 0 ? (
                <div style={{ padding: 26, textAlign: 'center' }} className="txt-12 txt-muted">
                  Nenhuma notificação ainda.<br />
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

   O protótipo é o painel de UMA empresa: não há mais troca de
   persona. Sobra um único controle de papel — o de emprestar,
   por um instante, o Aprovador da empresa que vai receber, sem
   o qual o que sai daqui nunca sairia da aprovação.
   ============================================================ */
export function DemoBar() {
  const { state, dispatch } = useStore();
  return (
    <div className="demobar">
      <BotaoAprovador />
      <div className="demobar__espaco" />
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

/* ------------------------------------------------------------
   O botão da empresa simulada.

   Fica apagado enquanto nada depende da outra ponta. Assim que
   uma transferência sai daqui e para na aprovação, ele acende e
   se anuncia — e volta a apagar quando a fila zera.
   ------------------------------------------------------------ */
function BotaoAprovador() {
  const { state, dispatch, aguardandoOutraEmpresa } = useStore();
  const pendentes = aguardandoOutraEmpresa.length;
  const ativo = state.modoAprovador;
  const disponivel = pendentes > 0 || ativo;

  // A dica se anuncia sozinha quando a pendência aparece; depois de
  // dispensada, só volta se a fila zerar e encher de novo.
  const [dicaVista, setDicaVista] = useState(false);
  useEffect(() => { if (pendentes === 0) setDicaVista(false); }, [pendentes]);
  const mostrarDica = pendentes > 0 && !ativo && !dicaVista;

  if (ativo) {
    return (
      <div className="demobar__grupo">
        <span className="simul__selo"><UserCheck size={14} /> Simulando a outra empresa</span>
        <span className="demobar__rotulo">
          Você está como Aprovador de quem vai receber — {USUARIO_POR_PAPEL.aprovador}
        </span>
        <button
          className="btn btn--sm"
          onClick={() => dispatch({ type: 'set_modo_aprovador', valor: false })}
        >
          <ArrowLeft size={13} /> Voltar para minha obra
        </button>
      </div>
    );
  }

  return (
    <div className="simul">
      <button
        className={`simul__btn ${disponivel ? 'simul__btn--aceso' : ''}`}
        disabled={!disponivel}
        onClick={() => { setDicaVista(true); dispatch({ type: 'set_modo_aprovador', valor: true }); }}
        title={disponivel
          ? 'Entrar no modo de simulação para aprovar como a outra empresa'
          : 'Este modo só liga quando alguma transferência sua está esperando o ok da outra empresa.'}
      >
        <UserCheck size={15} />
        Aprovador da outra empresa
        {pendentes > 0 && <span className="simul__n">{pendentes}</span>}
      </button>

      {mostrarDica && (
        <div className="simul__dica" role="status">
          <span className="simul__dica-seta" aria-hidden="true" />
          <strong>Precisa do ok da outra empresa</strong>
          <p>
            {pendentes === 1 ? 'Uma transferência sua saiu' : `${pendentes} transferências suas saíram`}{' '}
            e {pendentes === 1 ? 'está' : 'estão'} parada{pendentes === 1 ? '' : 's'} na aprovação de
            quem vai receber. Para simular essa aprovação como a outra empresa, clique aqui.
          </p>
          <button className="simul__dica-x" onClick={() => setDicaVista(true)} aria-label="Dispensar">
            <X size={13} />
          </button>
        </div>
      )}
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
