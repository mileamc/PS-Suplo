import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpFromLine, ArrowDownToLine, Search, ChevronLeft, ChevronRight,
  AlertCircle, CalendarClock, Plus, Package, Calendar as CalIcon, List,
  Archive, Truck, CheckCircle2, AlertTriangle, FileText, XCircle, Eye,
  Stamp, ClipboardCheck, UserCheck, ArrowLeft,
} from 'lucide-react';
import { TelaHeader } from '../../components/Shell';
import {
  BadgeStatus, BadgeDivergencia, EstadoVazio, EstadoErro, ListaCarregando, corDoStatus,
  Modal, Aviso,
} from '../../components/ui';
import { useStore } from '../../state/store';
import { OBRA_ATUAL, nomeObra } from '../../data/obras';
import { STATUS_META, STATUS_EM_ROTA } from '../../domain/status';
import {
  HOJE, atrasada, noGrupo, gruposVisiveis, rotuloGrupo, type Direcao, type Grupo,
} from '../../domain/grupos';
import { fmtData } from '../../domain/notificacoes';
import type { Transferencia } from '../../domain/types';
import { RegistrarSaidaModal } from './RegistrarSaidaModal';

type Visao = 'lista' | 'calendario';

/* ------------------------------------------------------------
   Os cards seguem o vocabulário que a tela de Entregas já usa,
   e cada um agrupa os estados do fluxo. A definição da lista
   mora em domain/grupos.ts, compartilhada com o mobile.

   O ícone e a cor de cada card vêm da mesma família do estado
   que a tag usa — o card nunca inventa cor própria.
   ------------------------------------------------------------ */
const ICONE_GRUPO: Record<Grupo, React.ReactNode> = {
  total: <Package size={15} />,
  reservados: <Archive size={15} />,
  aprovacoes: <Stamp size={15} />,
  transito: <Truck size={15} />,
  atrasados: <AlertCircle size={15} />,
  fvm: <ClipboardCheck size={15} />,
  nf: <FileText size={15} />,
  divergencia: <AlertTriangle size={15} />,
  completos: <CheckCircle2 size={15} />,
  cancelados: <XCircle size={15} />,
};

/** Cards sem família própria usam um neutro (Total) ou o vermelho de alerta. */
const COR_SEM_FAMILIA: Partial<Record<Grupo, string>> = {
  total: 'var(--text-muted)',
  atrasados: 'var(--red)',
};

export function TransferenciasScreen({
  onAbrir, onVerMobile,
}: { onAbrir: (id: string) => void; onVerMobile?: () => void }) {
  const { state, dispatch, aEnviar, aReceber, aguardandoOutraEmpresa } = useStore();
  const [direcao, setDirecao] = useState<Direcao>('enviar');
  const [visao, setVisao] = useState<Visao>('lista');
  const [grupo, setGrupo] = useState<Grupo>('total');
  const [busca, setBusca] = useState('');
  const [modalSaida, setModalSaida] = useState(false);

  // No modo de simulação só existe um assunto: o que sai daqui e espera
  // o ok da outra empresa. A tela vai direto para ele.
  const simulando = state.modoAprovador;
  const [avisoFim, setAvisoFim] = useState(false);
  useEffect(() => {
    if (simulando) { setDirecao('enviar'); setGrupo('aprovacoes'); setVisao('lista'); }
    else setAvisoFim(false);
  }, [simulando]);
  // Fila zerada dentro do modo: o trabalho da outra empresa acabou e o
  // usuário precisa ser trazido de volta, senão fica olhando uma lista
  // vazia sem saber que já pode sair.
  useEffect(() => {
    if (simulando && aguardandoOutraEmpresa.length === 0) setAvisoFim(true);
  }, [simulando, aguardandoOutraEmpresa.length]);

  const base = direcao === 'enviar' ? aEnviar : aReceber;
  const somenteLeitura = grupo === 'total';

  const lista = useMemo(() => base
    .filter((t) => noGrupo(t, grupo, direcao))
    .filter((t) => `${t.codigo} ${nomeObra(t.obraDestinoId)} ${nomeObra(t.obraOrigemId)} ${t.itens.map((i) => i.nome).join(' ')}`
      .toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
  [base, grupo, busca, direcao]);

  const conta = (g: Grupo) => base.filter((t) => noGrupo(t, g, direcao)).length;

  // "Aprovações pendentes" é card só para quem aprova daquele lado, e na
  // simulação é o único card. Se o card selecionado some ao trocar de
  // direção ou de modo, a lista cai no primeiro card que sobrou — nunca
  // num grupo que não está mais na tela.
  const cards = useMemo(() => gruposVisiveis(direcao, simulando), [direcao, simulando]);
  useEffect(() => {
    if (!cards.some((c) => c.grupo === grupo)) setGrupo(cards[0].grupo);
  }, [cards, grupo]);

  const atrasadas = base.filter((t) => atrasada(t));
  const proximas = base.filter((t) => {
    if (!t.previsaoChegada || !STATUS_EM_ROTA.includes(t.status)) return false;
    const d = new Date(t.previsaoChegada);
    const lim = new Date(HOJE); lim.setDate(lim.getDate() + 7);
    return d >= HOJE && d <= lim;
  });

  return (
    <>
      <TelaHeader
        titulo="Transferências entre Obras"
        sub="Acompanhe o que esta obra tem para enviar e para receber"
        ajuda="Como funciona a transferência entre obras?"
        onVerMobile={onVerMobile}
      />

      {simulando && <FaixaSimulacao onSair={() => dispatch({ type: 'set_modo_aprovador', valor: false })} />}

      {/* Primeira camada de navegação: de que lado desta obra a
          transferência está. Os cards de status abaixo só existem dentro
          da direção escolhida — por isso ela vem antes, e com mais peso
          visual do que eles. Durante a simulação ela não existe: a outra
          empresa só tem assunto com o que sai daqui. */}
      {!simulando && (
      <div className="direcao" role="group" aria-label="Direção da transferência">
        <OpcaoDirecao
          ativa={direcao === 'enviar'}
          icone={<ArrowUpFromLine size={19} />}
          titulo="Saindo desta obra"
          sub={`${nomeObra(OBRA_ATUAL)} → outras obras`}
          contagem={aEnviar.filter((t) => !STATUS_META[t.status].terminal).length}
          onClick={() => { setDirecao('enviar'); setGrupo('total'); }}
        />
        <OpcaoDirecao
          ativa={direcao === 'receber'}
          icone={<ArrowDownToLine size={19} />}
          titulo="Chegando nesta obra"
          sub={`outras obras → ${nomeObra(OBRA_ATUAL)}`}
          contagem={aReceber.filter((t) => !STATUS_META[t.status].terminal).length}
          onClick={() => { setDirecao('receber'); setGrupo('total'); }}
        />
      </div>
      )}

      <div className="cards-status">
        {cards.map((c) => (
          <button
            key={c.grupo}
            className={`card-status ${grupo === c.grupo ? 'card-status--ativo' : ''}`}
            style={{ ['--c' as string]: c.familia ? `var(--st-${c.familia})` : COR_SEM_FAMILIA[c.grupo] }}
            onClick={() => setGrupo(c.grupo)}
          >
            <div className="card-status__topo">{ICONE_GRUPO[c.grupo]}</div>
            <div className="card-status__valor">{conta(c.grupo)}</div>
            <div className="card-status__rotulo">{c.rotulo}</div>
          </button>
        ))}
      </div>

      <div className="toolbar">
        {!simulando && (
          <button className="btn btn--primario" onClick={() => setModalSaida(true)}>
            <Plus size={15} /> Nova transferência
          </button>
        )}
        <div className="campo-busca">
          <Search size={15} />
          <input placeholder="Pesquisar por código, obra ou insumo..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="toolbar__espaco" />
        <div className="segmentado" style={{ background: 'var(--surface-3)' }}>
          <button aria-pressed={visao === 'lista'} onClick={() => setVisao('lista')} style={{ color: visao === 'lista' ? '#06231a' : 'var(--text-muted)' }}>
            <List size={13} style={{ verticalAlign: -2, marginRight: 5 }} />Lista
          </button>
          <button aria-pressed={visao === 'calendario'} onClick={() => setVisao('calendario')} style={{ color: visao === 'calendario' ? '#06231a' : 'var(--text-muted)' }}>
            <CalIcon size={13} style={{ verticalAlign: -2, marginRight: 5 }} />Calendário
          </button>
        </div>
      </div>

      {state.estadoTela === 'erro' ? (
        <EstadoErro onTentar={() => { /* protótipo: apenas volta ao normal */ }} />
      ) : state.estadoTela === 'carregando' ? (
        <ListaCarregando />
      ) : state.estadoTela === 'vazio' || lista.length === 0 ? (
        <EstadoVazio
          titulo={grupo === 'total'
            ? (direcao === 'enviar' ? 'Nenhuma transferência ativa para enviar' : 'Nenhuma transferência ativa a receber')
            : `Nada no filtro "${rotuloGrupo(grupo)}"`}
          texto={direcao === 'enviar'
            ? 'Quando esta obra tiver sobra de material, registre uma Saída de Estoque do tipo Transferência para reservar a quantidade e mandar para outra obra.'
            : 'Assim que outra obra despachar material para cá, ele aparece aqui com a previsão de chegada.'}
          acao={!simulando && direcao === 'enviar' && grupo === 'total'
            ? <button className="btn btn--primario" onClick={() => setModalSaida(true)}><Plus size={15} /> Nova transferência</button>
            : undefined}
        />
      ) : visao === 'lista' ? (
        <div className="grade-cal">
          <div>
            {somenteLeitura && (
              <div className="aviso aviso--info" style={{ marginTop: 0, marginBottom: 12 }}>
                <Eye size={15} />
                <div>
                  <strong className="aviso__titulo">Visão geral, só leitura</strong>
                  Total mostra tudo que está entrando e saindo desta obra e em que estado está.
                  Para agir — aprovar, despachar, conferir, confirmar NF — escolha o card do estado
                  correspondente.
                </div>
              </div>
            )}
            <div className="lista-transf">
              {lista.map((t) => (
                <ItemLista key={t.id} t={t} direcao={direcao} onAbrir={onAbrir} somenteLeitura={somenteLeitura} />
              ))}
            </div>
          </div>
          <PainelLateral atrasadas={atrasadas} proximas={proximas} onAbrir={onAbrir} />
        </div>
      ) : (
        <div className="grade-cal">
          <Calendario lista={base} onAbrir={onAbrir} />
          <PainelLateral atrasadas={atrasadas} proximas={proximas} onAbrir={onAbrir} />
        </div>
      )}

      {modalSaida && <RegistrarSaidaModal onFechar={() => setModalSaida(false)} />}
      {avisoFim && (
        <ModalFimSimulacao onVoltar={() => {
          setAvisoFim(false);
          dispatch({ type: 'set_modo_aprovador', valor: false });
        }} />
      )}
    </>
  );
}

/* ============================================================
   Modo de simulação — a outra ponta, emprestada

   O protótipo é o painel de uma empresa só. Aqui o usuário veste,
   por um instante, o Aprovador de quem vai receber — e a tela
   deixa isso explícito o tempo todo, para ninguém confundir o que
   está vendo com o painel da própria obra.
   ============================================================ */
function FaixaSimulacao({ onSair }: { onSair: () => void }) {
  return (
    <div className="simul-faixa">
      <UserCheck size={17} />
      <div>
        <strong>Você está simulando a outra empresa</strong>
        Estas são as transferências que <b>{nomeObra(OBRA_ATUAL)}</b> enviou e que dependem do ok de
        quem vai receber. Aprovar ou reprovar aqui é o que destrava o fluxo — no sistema real, quem
        faria isso é o Aprovador da outra obra.
      </div>
      <button className="btn btn--sm" onClick={onSair}>
        <ArrowLeft size={13} /> Voltar para minha obra
      </button>
    </div>
  );
}

function ModalFimSimulacao({ onVoltar }: { onVoltar: () => void }) {
  return (
    <Modal
      titulo="Aprovação registrada"
      largura="estreito" onFechar={onVoltar}
      rodape={
        <button className="btn btn--primario" onClick={onVoltar}>
          <ArrowLeft size={15} /> Voltar para o fluxo da minha obra
        </button>
      }
    >
      <Aviso tom="sucesso" titulo="Nada mais depende da outra empresa">
        A fila de aprovação zerou. Volte para o painel de {nomeObra(OBRA_ATUAL)} para seguir o
        fluxo — despachar o que foi aprovado, acompanhar o trânsito e conferir o que chegar.
      </Aviso>
      <p className="txt-12 txt-muted" style={{ marginTop: 12 }}>
        O modo de simulação volta a ficar apagado até que outra transferência sua precise do ok de
        quem vai receber.
      </p>
      <div style={{ height: 4 }} />
    </Modal>
  );
}

/* ============================================================
   Seletor de direção — a primeira decisão da tela

   Não é um filtro a mais: é a perspectiva a partir da qual todo
   o resto é lido. O rótulo carrega o significado sozinho ("Saindo
   desta obra"), e a seta e o sentido da rota só reforçam — quem
   não distingue as setas continua entendendo pelo texto.
   ============================================================ */
function OpcaoDirecao({
  ativa, icone, titulo, sub, contagem, onClick,
}: {
  ativa: boolean; icone: React.ReactNode; titulo: string; sub: string;
  contagem: number; onClick: () => void;
}) {
  return (
    <button
      className={`direcao__op ${ativa ? 'direcao__op--ativa' : ''}`}
      aria-pressed={ativa} onClick={onClick}
    >
      <span className="direcao__icone">{icone}</span>
      <span className="direcao__txt">
        <span className="direcao__titulo">{titulo}</span>
        <span className="direcao__sub">{sub}</span>
      </span>
      <span className="direcao__cont">{contagem}</span>
    </button>
  );
}

/* ============================================================
   Item da lista
   ============================================================ */
function ItemLista({
  t, direcao, onAbrir, somenteLeitura,
}: { t: Transferencia; direcao: Direcao; onAbrir: (id: string) => void; somenteLeitura?: boolean }) {
  const total = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);

  return (
    <button
      className="item-transf" style={{ ['--c' as string]: corDoStatus(t.status) }}
      onClick={() => onAbrir(somenteLeitura ? `${t.id}?leitura` : t.id)}
    >
      <div className="item-transf__corpo">
        <div className="item-transf__topo">
          <span className="item-transf__codigo">{t.codigo}</span>
          <BadgeStatus status={t.status} compacto />
          <BadgeDivergencia t={t} />
          {atrasada(t) && <span className="badge badge--vermelho"><AlertCircle size={11} /> atrasada</span>}
          {t.ciclo > 0 && <span className="badge badge--roxo">{t.ciclo}º reenvio</span>}
        </div>
        <div className="rota mt-8">
          <span className="rota__obra">{nomeObra(t.obraOrigemId)}</span>
          <ArrowRight size={13} />
          <span className="rota__obra">{nomeObra(t.obraDestinoId)}</span>
        </div>
        <div className="item-transf__resumo">
          {t.itens.length === 1
            ? `${t.itens[0].nome} · ${t.itens[0].qtdEnviada.toLocaleString('pt-BR')} ${t.itens[0].unidade}`
            : `${t.itens.length} insumos · ${t.itens.reduce((s, i) => s + i.qtdEnviada, 0).toLocaleString('pt-BR')} un. no total`}
        </div>
      </div>
      <div className="item-transf__lado">
        <div className="item-transf__data">
          {t.status === 'em_transito' && t.previsaoChegada
            ? `chega ${fmtData(t.previsaoChegada)}`
            : direcao === 'enviar' ? `criada ${fmtData(t.criadaEm)}` : `enviada ${fmtData(t.criadaEm)}`}
        </div>
        <div className="item-transf__valor">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
      </div>
    </button>
  );
}

/* ============================================================
   Painel lateral — atrasadas + próximas chegadas
   ============================================================ */
function PainelLateral({
  atrasadas, proximas, onAbrir,
}: { atrasadas: Transferencia[]; proximas: Transferencia[]; onAbrir: (id: string) => void }) {
  return (
    <div className="painel-lateral">
      <div className={`painel ${atrasadas.length ? 'painel--alerta' : ''}`}>
        <div className={`painel__titulo ${atrasadas.length ? 'painel__titulo--alerta' : ''}`}>
          <AlertCircle size={14} /> Chegadas atrasadas ({atrasadas.length})
        </div>
        {atrasadas.length === 0 ? (
          <div className="txt-12 txt-muted">Nenhuma transferência passou da previsão de chegada.</div>
        ) : atrasadas.map((t) => (
          <button key={t.id} className="painel__item" style={{ width: '100%', border: 0, background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => onAbrir(t.id)}>
            <div>
              <div className="painel__nome">{t.codigo}</div>
              <div className="painel__meta">{nomeObra(t.obraOrigemId)} → {nomeObra(t.obraDestinoId)}</div>
            </div>
            <div className="txt-11" style={{ color: 'var(--red-fg)', fontWeight: 700 }}>
              {t.previsaoChegada && fmtData(t.previsaoChegada)}
            </div>
          </button>
        ))}
      </div>

      <div className="painel">
        <div className="painel__titulo"><CalendarClock size={14} /> Próximas chegadas (7 dias)</div>
        {proximas.length === 0 ? (
          <div className="txt-12 txt-muted">Nada previsto para os próximos 7 dias.</div>
        ) : proximas.map((t) => (
          <button key={t.id} className="painel__item" style={{ width: '100%', border: 0, background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => onAbrir(t.id)}>
            <div>
              <div className="painel__nome">{t.codigo}</div>
              <div className="painel__meta">{nomeObra(t.obraOrigemId)} → {nomeObra(t.obraDestinoId)}</div>
            </div>
            <BadgeStatus status={t.status} compacto />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Calendário — padrão herdado de "Entregas: Calendário"
   ============================================================ */
function Calendario({ lista, onAbrir }: { lista: Transferencia[]; onAbrir: (id: string) => void }) {
  const [mes, setMes] = useState(() => new Date(HOJE.getFullYear(), HOJE.getMonth(), 1));

  const primeiroDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
  const inicio = new Date(primeiroDia);
  inicio.setDate(inicio.getDate() - inicio.getDay());
  const dias = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio); d.setDate(d.getDate() + i); return d;
  });

  const porDia = useMemo(() => {
    const m = new Map<string, Transferencia[]>();
    for (const t of lista) {
      const ref = t.chegadaEm ?? t.previsaoChegada;
      if (!ref) continue;
      const k = new Date(ref).toDateString();
      m.set(k, [...(m.get(k) ?? []), t]);
    }
    return m;
  }, [lista]);

  return (
    <div className="cal">
      <div className="cal__topo">
        <div className="cal__mes">
          {mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase())}
        </div>
        <div className="cal__nav">
          <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={15} /></button>
          <button onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="cal__grade">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div className="cal__dia-semana" key={d}>{d}</div>
        ))}
        {dias.map((d) => {
          const fora = d.getMonth() !== mes.getMonth();
          const hoje = d.toDateString() === HOJE.toDateString();
          const eventos = porDia.get(d.toDateString()) ?? [];
          return (
            <div key={d.toISOString()} className={`cal__cel ${fora ? 'cal__cel--fora' : ''} ${hoje ? 'cal__cel--hoje' : ''}`}>
              <div className="cal__num">{d.getDate()}</div>
              {eventos.slice(0, 2).map((t) => (
                <button
                  key={t.id} className="cal__evento" onClick={() => onAbrir(t.id)}
                  style={{
                    background: `color-mix(in srgb, ${corDoStatus(t.status)} 16%, white)`,
                    color: `color-mix(in srgb, ${corDoStatus(t.status)} 75%, black)`,
                  }}
                  title={`${t.codigo} · ${STATUS_META[t.status].label}`}
                >
                  {t.codigo}
                </button>
              ))}
              {eventos.length > 2 && <div className="txt-11 txt-muted" style={{ marginTop: 3 }}>+{eventos.length - 2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
