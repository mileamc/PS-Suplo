import { useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpFromLine, ArrowDownToLine, Search, ChevronLeft, ChevronRight,
  AlertCircle, CalendarClock, Plus, Package, Calendar as CalIcon, List,
  Archive, Truck, CheckCircle2, AlertTriangle, FileText, XCircle, Eye,
} from 'lucide-react';
import { TelaHeader } from '../../components/Shell';
import { BadgeStatus, EstadoVazio, EstadoErro, ListaCarregando, corDoStatus } from '../../components/ui';
import { useStore } from '../../state/store';
import { nomeObra } from '../../data/obras';
import {
  STATUS_META, STATUS_TRANSITO, STATUS_RESERVA, STATUS_CANCELADOS, STATUS_ATIVOS,
} from '../../domain/status';
import { fmtData } from '../../domain/notificacoes';
import type { Transferencia } from '../../domain/types';
import { RegistrarSaidaModal } from './RegistrarSaidaModal';

type Direcao = 'enviar' | 'receber';
type Visao = 'lista' | 'calendario';

/* ------------------------------------------------------------
   Os cards seguem o vocabulário que a tela de Entregas já usa
   (Total, Pendentes, Atrasados, Aguardando NF, Completos,
   Cancelados), e cada um agrupa os estados do fluxo.
   ------------------------------------------------------------ */
type Grupo =
  | 'total' | 'pendentes' | 'transito' | 'atrasados'
  | 'nf' | 'divergencia' | 'completos' | 'cancelados';

const HOJE_G = new Date('2026-08-29T12:00:00');

function noGrupo(t: Transferencia, g: Grupo): boolean {
  switch (g) {
    case 'total': return STATUS_ATIVOS.includes(t.status);
    case 'pendentes': return STATUS_RESERVA.includes(t.status);
    case 'transito': return STATUS_TRANSITO.includes(t.status);
    case 'atrasados':
      return STATUS_TRANSITO.includes(t.status)
        && Boolean(t.previsaoChegada) && new Date(t.previsaoChegada!) < HOJE_G;
    case 'nf': return t.status === 'aguardando_nf';
    case 'divergencia': return t.status === 'recebido_divergencia';
    case 'completos': return t.status === 'recebido_ok';
    case 'cancelados': return STATUS_CANCELADOS.includes(t.status);
  }
}

const HOJE = new Date('2026-08-29T12:00:00');

export function TransferenciasScreen({
  onAbrir,
}: { onAbrir: (id: string) => void }) {
  const { state, aEnviar, aReceber } = useStore();
  const [direcao, setDirecao] = useState<Direcao>('enviar');
  const [visao, setVisao] = useState<Visao>('lista');
  const [grupo, setGrupo] = useState<Grupo>('total');
  const [busca, setBusca] = useState('');
  const [modalSaida, setModalSaida] = useState(false);

  const base = direcao === 'enviar' ? aEnviar : aReceber;
  const somenteLeitura = grupo === 'total';

  const lista = useMemo(() => base
    .filter((t) => noGrupo(t, grupo))
    .filter((t) => `${t.codigo} ${nomeObra(t.obraDestinoId)} ${nomeObra(t.obraOrigemId)} ${t.itens.map((i) => i.nome).join(' ')}`
      .toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
  [base, grupo, busca]);

  const conta = (g: Grupo) => base.filter((t) => noGrupo(t, g)).length;

  const cards: { grupo: Grupo; rotulo: string; icone: React.ReactNode; cor: string }[] = [
    { grupo: 'total', rotulo: 'Total', icone: <Package size={15} />, cor: 'var(--text-muted)' },
    { grupo: 'pendentes', rotulo: 'Pendentes', icone: <Archive size={15} />, cor: corDoStatus('aguardando_aprovacao') },
    { grupo: 'transito', rotulo: 'Em trânsito', icone: <Truck size={15} />, cor: corDoStatus('em_transito') },
    { grupo: 'atrasados', rotulo: 'Atrasados', icone: <AlertCircle size={15} />, cor: 'var(--red)' },
    { grupo: 'nf', rotulo: 'Aguardando NF', icone: <FileText size={15} />, cor: corDoStatus('aguardando_nf') },
    { grupo: 'divergencia', rotulo: 'Com divergência', icone: <AlertTriangle size={15} />, cor: corDoStatus('recebido_divergencia') },
    { grupo: 'completos', rotulo: 'Completos', icone: <CheckCircle2 size={15} />, cor: corDoStatus('recebido_ok') },
    { grupo: 'cancelados', rotulo: 'Cancelados', icone: <XCircle size={15} />, cor: corDoStatus('cancelado') },
  ];

  const atrasadas = base.filter((t) =>
    STATUS_TRANSITO.includes(t.status) && t.previsaoChegada && new Date(t.previsaoChegada) < HOJE);
  const proximas = base.filter((t) => {
    if (!t.previsaoChegada || !STATUS_TRANSITO.includes(t.status)) return false;
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
      />

      <div className="cards-status">
        {cards.map((c) => (
          <button
            key={c.grupo}
            className={`card-status ${grupo === c.grupo ? 'card-status--ativo' : ''}`}
            style={{ ['--c' as string]: c.cor }}
            onClick={() => setGrupo(c.grupo)}
          >
            <div className="card-status__topo">{c.icone}</div>
            <div className="card-status__valor">{conta(c.grupo)}</div>
            <div className="card-status__rotulo">{c.rotulo}</div>
          </button>
        ))}
      </div>

      <div className="abas">
        <button className={`aba ${direcao === 'enviar' ? 'aba--ativa' : ''}`} onClick={() => { setDirecao('enviar'); setGrupo('total'); }}>
          <ArrowUpFromLine size={15} /> A Enviar
          <span className="aba__badge">{aEnviar.filter((t) => !STATUS_META[t.status].terminal).length}</span>
        </button>
        <button className={`aba ${direcao === 'receber' ? 'aba--ativa' : ''}`} onClick={() => { setDirecao('receber'); setGrupo('total'); }}>
          <ArrowDownToLine size={15} /> A Receber
          <span className="aba__badge">{aReceber.filter((t) => !STATUS_META[t.status].terminal).length}</span>
        </button>
      </div>

      <div className="toolbar">
        <button className="btn btn--primario" onClick={() => setModalSaida(true)}>
          <Plus size={15} /> Nova transferência
        </button>
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
            : `Nada em ${cards.find((c) => c.grupo === grupo)?.rotulo.toLowerCase()}`}
          texto={direcao === 'enviar'
            ? 'Quando esta obra tiver sobra de material, registre uma Saída de Estoque do tipo Transferência para reservar a quantidade e mandar para outra obra.'
            : 'Assim que outra obra despachar material para cá, ele aparece aqui com a previsão de chegada.'}
          acao={direcao === 'enviar' && grupo === 'total'
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
    </>
  );
}

/* ============================================================
   Item da lista
   ============================================================ */
function ItemLista({
  t, direcao, onAbrir, somenteLeitura,
}: { t: Transferencia; direcao: Direcao; onAbrir: (id: string) => void; somenteLeitura?: boolean }) {
  const total = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const atrasada = STATUS_TRANSITO.includes(t.status)
    && t.previsaoChegada && new Date(t.previsaoChegada) < HOJE;

  return (
    <button
      className="item-transf" style={{ ['--c' as string]: corDoStatus(t.status) }}
      onClick={() => onAbrir(somenteLeitura ? `${t.id}?leitura` : t.id)}
    >
      <div className="item-transf__corpo">
        <div className="item-transf__topo">
          <span className="item-transf__codigo">{t.codigo}</span>
          <BadgeStatus status={t.status} compacto />
          {atrasada && <span className="badge badge--vermelho"><AlertCircle size={11} /> atrasada</span>}
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
