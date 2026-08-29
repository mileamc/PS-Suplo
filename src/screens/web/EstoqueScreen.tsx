import { useMemo, useState } from 'react';
import {
  Archive, TrendingDown, Package, Search, FileText, FileSpreadsheet,
  Download, Upload, ArrowUpDown, ArrowRightLeft, ChevronDown, Layers, Activity, HelpCircle,
} from 'lucide-react';
import { TelaHeader } from '../../components/Shell';
import { Badge, BadgeStatus, EstadoVazio } from '../../components/ui';
import { INSUMOS } from '../../data/insumos';
import { OBRA_ATUAL, nomeObra } from '../../data/obras';
import { useStore } from '../../state/store';
import { STATUS_ABERTOS, STATUS_META } from '../../domain/status';
import { fmtDataHora } from '../../domain/notificacoes';
import type { TransferStatus } from '../../domain/types';
import { RegistrarSaidaModal } from './RegistrarSaidaModal';

type Aba = 'estoque' | 'movimentacoes';

export function EstoqueScreen({ onAbrirTransferencia }: { onAbrirTransferencia: (id: string) => void }) {
  const [aba, setAba] = useState<Aba>('estoque');
  const [modalSaida, setModalSaida] = useState(false);

  return (
    <>
      <TelaHeader
        titulo="Estoque de Materiais"
        sub="Controle o inventário, movimentações, reservas e kits da obra"
        ajuda="Como trabalhar com a tela de Estoque de Materiais?"
      />

      <CardsResumo />

      <div className="abas">
        <button className={`aba ${aba === 'estoque' ? 'aba--ativa' : ''}`} onClick={() => setAba('estoque')}>
          <Package size={15} /> Estoque
        </button>
        <button className={`aba ${aba === 'movimentacoes' ? 'aba--ativa' : ''}`} onClick={() => setAba('movimentacoes')}>
          <ArrowUpDown size={15} /> Movimentações
        </button>
      </div>

      {aba === 'estoque'
        ? <AbaEstoque onAbrirSaida={() => setModalSaida(true)} />
        : <AbaMovimentacoes onAbrirTransferencia={onAbrirTransferencia} />}

      {modalSaida && <RegistrarSaidaModal onFechar={() => setModalSaida(false)} />}
    </>
  );
}

/* ============================================================
   Cards de resumo — "Materiais Reservados" agora soma também
   as reservas de transferência entre obras (seção 6).
   ============================================================ */
function CardsResumo() {
  const { state, aEnviar } = useStore();

  const reservasTransferencia = useMemo(() => {
    const linhas: { nome: string; qtd: number; unidade: string; codigo: string; destino: string }[] = [];
    for (const t of aEnviar) {
      if (!['reservado', 'aguardando_aprovacao', 'aprovado'].includes(t.status)) continue;
      for (const it of t.itens) {
        linhas.push({
          nome: it.nome, qtd: it.qtdEnviada, unidade: it.unidade,
          codigo: t.codigo, destino: nomeObra(t.obraDestinoId),
        });
      }
    }
    return linhas;
  }, [aEnviar]);

  // Reservas de requisição interna que já existiam no produto.
  const reservasRequisicao = [
    { nome: 'Terminal de compressão 25mm', qtd: 5, unidade: 'un' },
    { nome: 'Curva 90° PVC rígido roscável longa para eletroduto Ø 2 - un', qtd: 20, unidade: 'un' },
  ];
  const totalReservas = 95 + reservasTransferencia.length;

  return (
    <div className="cards-resumo">
      {/* ---------- Materiais Reservados ---------- */}
      <div className="card-resumo" style={{ ['--c' as string]: 'var(--purple)' }}>
        <div className="card-resumo__topo">
          <div className="card-resumo__titulo"><Archive size={15} /> Materiais Reservados <HelpCircle size={12} color="var(--text-faint)" /></div>
          <span className="card-resumo__contagem">{totalReservas}</span>
        </div>
        <div className="card-resumo__lista">
          {reservasTransferencia.slice(0, 2).map((r, i) => (
            <div className="card-resumo__linha" key={`t-${i}`}>
              <div>
                <div className="card-resumo__nome">{r.nome}</div>
                <div className="card-resumo__meta">
                  <Badge tom="roxo">Transferência</Badge>{' '}
                  {r.codigo} → {r.destino}
                </div>
              </div>
              <div className="card-resumo__valor">{r.qtd.toLocaleString('pt-BR')} {r.unidade}</div>
            </div>
          ))}
          {reservasRequisicao.slice(0, Math.max(0, 2 - reservasTransferencia.length)).map((r, i) => (
            <div className="card-resumo__linha" key={`r-${i}`}>
              <div>
                <div className="card-resumo__nome">{r.nome}</div>
                <div className="card-resumo__meta">Requisição interna</div>
              </div>
              <div className="card-resumo__valor">{r.qtd} {r.unidade}</div>
            </div>
          ))}
        </div>
        <div className="card-resumo__rodape">
          +{Math.max(0, totalReservas - 2)} itens · inclui reservas de transferência
        </div>
      </div>

      {/* ---------- Estoque Baixo ---------- */}
      <div className="card-resumo" style={{ ['--c' as string]: 'var(--amber)', ['--bg-c' as string]: 'var(--amber-bg)', ['--fg-c' as string]: 'var(--amber-fg)' }}>
        <div className="card-resumo__topo">
          <div className="card-resumo__titulo"><TrendingDown size={15} /> Estoque Baixo <HelpCircle size={12} color="var(--text-faint)" /></div>
          <span className="card-resumo__contagem">6</span>
        </div>
        <div className="card-resumo__lista">
          <div className="card-resumo__linha">
            <div>
              <div className="card-resumo__nome">Teste suplos</div>
              <div className="card-resumo__meta">1/3 uni</div>
            </div>
            <span className="pill-pct" style={{ background: 'var(--amber-bg)', color: 'var(--amber-fg)' }}>33%</span>
          </div>
          <div className="card-resumo__linha">
            <div>
              <div className="card-resumo__nome">Abraçadeira de nylon 2,5 × 150 mm</div>
              <div className="card-resumo__meta">66/115 un</div>
            </div>
            <span className="pill-pct" style={{ background: 'var(--amber-bg)', color: 'var(--amber-fg)' }}>57%</span>
          </div>
        </div>
        <div className="card-resumo__rodape">+4 itens</div>
      </div>

      {/* ---------- Kits de Material ---------- */}
      <div className="card-resumo" style={{ ['--c' as string]: 'var(--green)', ['--bg-c' as string]: 'var(--green-bg)', ['--fg-c' as string]: 'var(--green-fg)' }}>
        <div className="card-resumo__topo">
          <div className="card-resumo__titulo"><Layers size={15} /> Kits de Material <HelpCircle size={12} color="var(--text-faint)" /></div>
          <span className="card-resumo__contagem">5/13</span>
        </div>
        <div className="card-resumo__lista">
          <div className="card-resumo__linha">
            <div className="card-resumo__nome">Kit Village</div>
            <div className="card-resumo__valor txt-muted">0 kits</div>
          </div>
          <div className="card-resumo__linha">
            <div className="card-resumo__nome">KIT LRG</div>
            <div className="card-resumo__valor" style={{ color: 'var(--green-fg)' }}>25 kits</div>
          </div>
        </div>
        <div className="card-resumo__rodape">+11 kits</div>
      </div>

      {state.estadoTela === 'carregando' && null}
    </div>
  );
}

/* ============================================================
   Aba Estoque — coluna de quantidade agora tripartida
   ============================================================ */
function AbaEstoque({ onAbrirSaida }: { onAbrirSaida: () => void }) {
  const { saldo } = useStore();
  const [busca, setBusca] = useState('');

  const lista = INSUMOS.filter((i) =>
    `${i.codigo} ${i.nome} ${i.categoria}`.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <>
      <div className="toolbar">
        <button className="btn btn--primario"><Download size={15} /> Entrada</button>
        <button className="btn btn--perigo" onClick={onAbrirSaida}><Upload size={15} /> Saída</button>
        <div className="campo-busca">
          <Search size={15} />
          <input placeholder="Pesquisar por item..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="select-inline">
          <Layers size={14} />
          <span className="select-inline__rotulo">Categoria:</span>
          <select><option>Todos</option></select>
          <ChevronDown size={14} />
        </div>
        <div className="select-inline">
          <Activity size={14} />
          <span className="select-inline__rotulo">Status:</span>
          <select><option>Em estoque</option></select>
          <ChevronDown size={14} />
        </div>
        <button className="btn"><FileText size={15} /> PDF</button>
        <button className="btn"><FileSpreadsheet size={15} /> Excel</button>
      </div>

      <div className="tabela-wrap">
        <div className="tabela-scroll">
          <table className="tabela">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th style={{ textAlign: 'right' }}>Quantidade</th>
                <th style={{ textAlign: 'right' }}>Estoque mín</th>
                <th>Último movimento</th>
                {/* Coluna nova: complementa o saldo, sem substituir nada. */}
                <th>Situação da transferência</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((i) => {
                const s = saldo(i.id);
                return (
                  <tr key={i.id}>
                    <td className="td-forte">{i.codigo}</td>
                    <td className="celula-nome">{i.nome}</td>
                    <td className="txt-muted">{i.categoria}</td>
                    <td><Badge tom={i.tipo === 'avulso' ? 'verde' : 'ambar'}>{i.tipo === 'avulso' ? 'Avulso' : 'Pedido'}</Badge></td>
                    <td>
                      {/* Quantidade continua sendo o saldo total do item, como
                          na tela original. O que a reserva tirou do disponível
                          aparece logo abaixo, sem esconder o número de antes. */}
                      <div className="saldo">
                        <span className="saldo__principal">
                          {s.fisico.toLocaleString('pt-BR')} {i.unidade}
                        </span>
                        <span className="txt-11 txt-muted">
                          {s.disponivel.toLocaleString('pt-BR')} {i.unidade} disponível
                        </span>
                      </div>
                    </td>
                    <td className="td-num txt-muted">{i.estoqueMin} {i.unidade}</td>
                    <td className="txt-muted">{i.ultimoMovimento}</td>
                    <td>
                      {(s.reservado > 0 || s.emTransito > 0 || s.aReceber > 0) ? (
                        <span className="saldo__detalhe" style={{ flexWrap: 'wrap' }}>
                          {s.reservado > 0 && (
                            <span className="saldo__chip saldo__chip--res" title="Reservado para transferência, ainda na obra">
                              {s.reservado.toLocaleString('pt-BR')} reservado
                            </span>
                          )}
                          {s.emTransito > 0 && (
                            <span className="saldo__chip saldo__chip--tra" title="Já despachado, a caminho de outra obra">
                              {s.emTransito.toLocaleString('pt-BR')} em trânsito
                            </span>
                          )}
                          {s.aReceber > 0 && (
                            <span className="saldo__chip saldo__chip--rec" title="A receber de outra obra">
                              +{s.aReceber.toLocaleString('pt-BR')} a receber
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="txt-11 txt-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="txt-12 txt-muted mt-8">
        As colunas originais continuam todas aqui. <strong>Quantidade</strong> segue mostrando o saldo
        do item, com o disponível logo abaixo, e a coluna <strong>Situação da transferência</strong>
        acrescenta o que está reservado, em trânsito ou a receber — reserva não é saída.
      </p>
    </>
  );
}

/* ============================================================
   Aba Movimentações — agora com status, não só histórico fechado
   ============================================================ */
interface LinhaMov {
  id: string;
  em: string;
  tipo: 'Entrada' | 'Saída';
  subtipo: string;
  item: string;
  qtd: string;
  vlrUnit: string;
  vlrTotal: string;
  usuario: string;
  local: string;
  observacao: string;
  status?: TransferStatus;
  transferenciaId?: string;
}

const MOV_HISTORICO: LinhaMov[] = [
  { id: 'm1', em: '2026-08-20T15:38:00', tipo: 'Saída', subtipo: 'Múltipla', item: 'Curva 90° PVC rígido roscável longa para e…', qtd: '10 un', vlrUnit: '—', vlrTotal: '—', usuario: 'Rafael', local: 'PAV01', observacao: '-' },
  { id: 'm2', em: '2026-08-20T15:24:00', tipo: 'Saída', subtipo: 'Múltipla', item: 'Curva 90° PVC rígido roscável longa para e…', qtd: '10 un', vlrUnit: '—', vlrTotal: '—', usuario: 'Rafael', local: 'PAV01;PAV03', observacao: '-' },
  { id: 'm3', em: '2026-08-20T15:22:00', tipo: 'Entrada', subtipo: 'Caixinha', item: 'Cabo telefônico CTP-APL com 400 pares Ø…', qtd: '50 m', vlrUnit: 'R$ 5,00', vlrTotal: 'R$ 250,00', usuario: 'Rafael', local: '-', observacao: '-' },
  { id: 'm4', em: '2026-08-20T14:10:00', tipo: 'Entrada', subtipo: 'Pedido', item: 'Terminal de compressão 25mm', qtd: '1000 un', vlrUnit: 'R$ 0,87', vlrTotal: 'R$ 870,00', usuario: 'Rafael', local: '-', observacao: '-' },
];

const FILTROS_STATUS: { valor: 'todos' | TransferStatus; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'reservado', rotulo: 'Reservado' },
  { valor: 'aguardando_aprovacao', rotulo: 'Aguardando aprovação' },
  { valor: 'em_transito', rotulo: 'Em trânsito' },
  { valor: 'avaliacao_entrega', rotulo: 'Avaliação de entrega' },
  { valor: 'recebido_ok', rotulo: 'Recebido ok' },
  { valor: 'recebido_divergencia', rotulo: 'Com divergência' },
  { valor: 'cancelado', rotulo: 'Cancelado' },
  { valor: 'reprovado', rotulo: 'Reprovado' },
];

function AbaMovimentacoes({ onAbrirTransferencia }: { onAbrirTransferencia: (id: string) => void }) {
  const { state } = useStore();
  const [status, setStatus] = useState<'todos' | TransferStatus>('todos');
  const [busca, setBusca] = useState('');

  const linhas: LinhaMov[] = useMemo(() => {
    const deTransferencias: LinhaMov[] = state.transferencias.flatMap((t) => {
      const ehSaida = t.obraOrigemId === OBRA_ATUAL;
      return t.itens.map((it) => ({
        id: `${t.id}-${it.insumoId}`,
        em: t.despachadaEm ?? t.criadaEm,
        tipo: (ehSaida ? 'Saída' : 'Entrada') as 'Saída' | 'Entrada',
        subtipo: 'Transferência',
        item: it.nome,
        qtd: `${(it.qtdRecebida ?? it.qtdEnviada).toLocaleString('pt-BR')} ${it.unidade}`,
        vlrUnit: it.custoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        vlrTotal: (it.qtdEnviada * it.custoUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        usuario: t.criadaPor.split(' ')[0],
        local: ehSaida ? nomeObra(t.obraDestinoId) : nomeObra(t.obraOrigemId),
        observacao: t.observacao,
        status: t.status,
        transferenciaId: t.id,
      }));
    });
    return [...deTransferencias, ...MOV_HISTORICO]
      .filter((l) => (status === 'todos' ? true : l.status === status))
      .filter((l) => `${l.item} ${l.usuario}`.toLowerCase().includes(busca.toLowerCase()))
      .sort((a, b) => b.em.localeCompare(a.em));
  }, [state.transferencias, status, busca]);

  const abertas = state.transferencias.filter((t) => STATUS_ABERTOS.includes(t.status)).length;

  return (
    <>
      <div className="toolbar">
        <div className="campo-busca">
          <Search size={15} />
          <input placeholder="Pesquisar por item ou usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="select-inline">
          <Activity size={14} />
          <span className="select-inline__rotulo">Tipo:</span>
          <select><option>Todos</option><option>Entrada</option><option>Saída</option></select>
          <ChevronDown size={14} />
        </div>
        <div className="select-inline">
          <Layers size={14} />
          <span className="select-inline__rotulo">Subtipo:</span>
          <select><option>Todos</option><option>Transferência</option></select>
          <ChevronDown size={14} />
        </div>
        {/* NOVO: filtro de status da transferência */}
        <div className="select-inline" style={{ borderColor: 'var(--purple)' }}>
          <ArrowRightLeft size={14} color="var(--purple-fg)" />
          <span className="select-inline__rotulo">Status da transferência:</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as 'todos' | TransferStatus)}>
            {FILTROS_STATUS.map((f) => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
          </select>
          <ChevronDown size={14} />
        </div>
        <button className="btn"><FileText size={15} /> PDF</button>
        <button className="btn"><FileSpreadsheet size={15} /> Excel</button>
      </div>

      {abertas > 0 && (
        <div className="aviso aviso--info" style={{ marginTop: 0, marginBottom: 12 }}>
          <ArrowRightLeft size={15} />
          <div>
            <strong className="aviso__titulo">{abertas} transferências ainda em andamento</strong>
            A aba deixou de mostrar só histórico fechado: transferências aparecem desde a reserva, com o
            status atual em cada linha.
          </div>
        </div>
      )}

      {linhas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma movimentação com esse filtro"
          texto="Ajuste o status ou a busca para ver outras movimentações desta obra."
        />
      ) : (
        <div className="tabela-wrap">
          <div className="tabela-scroll">
            <table className="tabela" style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>Data/hora</th>
                  <th>Tipo</th>
                  <th>Subtipo</th>
                  <th>Status</th>
                  <th>Item</th>
                  <th style={{ textAlign: 'right' }}>Quantidade</th>
                  <th style={{ textAlign: 'right' }}>Vlr. unit.</th>
                  <th style={{ textAlign: 'right' }}>Vlr. total</th>
                  <th>Usuário</th>
                  <th>Local / obra</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr
                    key={l.id}
                    className={l.transferenciaId ? 'clicavel' : ''}
                    onClick={() => l.transferenciaId && onAbrirTransferencia(l.transferenciaId)}
                  >
                    <td className="nowrap txt-muted">{fmtDataHora(l.em)}</td>
                    <td><Badge tom={l.tipo === 'Entrada' ? 'verde' : 'vermelho'}>{l.tipo}</Badge></td>
                    <td><Badge tom={l.subtipo === 'Transferência' ? 'ambar' : l.subtipo === 'Múltipla' ? 'roxo' : 'cinza'}>{l.subtipo}</Badge></td>
                    <td>{l.status ? <BadgeStatus status={l.status} compacto /> : <span className="txt-muted">—</span>}</td>
                    <td className="celula-nome">{l.item}</td>
                    <td className="td-num td-forte">{l.qtd}</td>
                    <td className="td-num txt-muted">{l.vlrUnit}</td>
                    <td className="td-num">{l.vlrTotal}</td>
                    <td className="txt-muted">{l.usuario}</td>
                    <td className="txt-muted">{l.local}</td>
                    <td className="txt-muted celula-nome">{l.observacao || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="txt-12 txt-muted mt-8">
        Linhas de transferência são clicáveis e abrem o detalhe com o histórico de aprovação.
        Status possíveis: {Object.values(STATUS_META).map((m) => m.label).join(' · ')}.
      </p>
    </>
  );
}
