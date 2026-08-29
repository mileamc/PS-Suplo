import { useMemo, useState } from 'react';
import {
  Search, Bell, Check, ArrowRight, Archive, TrendingDown, Layers, AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { INSUMOS } from '../../data/insumos';
import { OBRA_ATUAL, nomeObra } from '../../data/obras';
import { STATUS_META } from '../../domain/status';
import { fmtDataHora, ROLE_LABEL } from '../../domain/notificacoes';
import { BadgeStatus, Badge } from '../../components/ui';
import type { Role, TransferStatus } from '../../domain/types';
import { MobTop, MobVazio, MobCarregando, brl, num } from './comuns';

/* ============================================================
   Estoque de Materiais — a mesma informação da tela web:
   cards de resumo e saldo separado em disponível / reservado /
   em trânsito / a receber.
   ============================================================ */
export function TelaEstoque() {
  const { state, aEnviar, saldo } = useStore();
  const [busca, setBusca] = useState('');

  const reservasTransferencia = useMemo(
    () => aEnviar
      .filter((t) => ['reservado', 'aguardando_aprovacao', 'aprovado'].includes(t.status))
      .flatMap((t) => t.itens.map((i) => ({ ...i, codigoTr: t.codigo, destino: nomeObra(t.obraDestinoId) }))),
    [aEnviar],
  );

  const lista = INSUMOS.filter((i) =>
    `${i.codigo} ${i.nome} ${i.categoria}`.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <MobTop eyebrow={nomeObra(OBRA_ATUAL)} titulo="Estoque de Materiais" />
      <div className="mob-corpo">
        <div className="mob-pad">
          <div className="mob-cartao" style={{ marginBottom: 12, borderLeft: '4px solid var(--purple)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 650 }}>
                <Archive size={16} /> Materiais Reservados
              </div>
              <span className="mob-saldo mob-saldo--res">{95 + reservasTransferencia.length}</span>
            </div>
            {reservasTransferencia.slice(0, 2).map((r, i) => (
              <div className="mob-linha" key={i}>
                <span className="mob-linha__r" style={{ flex: 1 }}>
                  {r.nome}
                  <span style={{ display: 'block', marginTop: 3 }}>
                    <Badge tom="roxo">Transferência</Badge> {r.codigoTr} → {r.destino}
                  </span>
                </span>
                <span className="mob-linha__v">{num(r.qtdEnviada)} {r.unidade}</span>
              </div>
            ))}
            <p className="mob-dica">Agora inclui as reservas de transferência entre obras.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div className="mob-cartao" style={{ borderLeft: '4px solid var(--amber)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 650 }}>
                <TrendingDown size={15} /> Estoque baixo
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>6</div>
            </div>
            <div className="mob-cartao" style={{ borderLeft: '4px solid var(--green)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 650 }}>
                <Layers size={15} /> Kits
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>5/13</div>
            </div>
          </div>

          <div className="mob-busca">
            <Search size={17} />
            <input placeholder="Pesquisar por item..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>

          {state.estadoTela === 'carregando' ? <MobCarregando /> : lista.length === 0 ? (
            <MobVazio titulo="Nenhum item encontrado" texto="Ajuste a busca para ver outros insumos desta obra." />
          ) : lista.map((i) => {
            const s = saldo(i.id);
            return (
              <div className="mob-icard" key={i.id}>
                <div className="mob-icard__topo">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mob-icard__nome">{i.nome}</div>
                    <div className="mob-icard__cod">{i.codigo} · {i.categoria}</div>
                  </div>
                  <Badge tom={i.tipo === 'avulso' ? 'verde' : 'ambar'}>
                    {i.tipo === 'avulso' ? 'Avulso' : 'Pedido'}
                  </Badge>
                </div>
                <div className="mob-icard__saldos">
                  <span className="mob-saldo mob-saldo--disp"><b>{num(s.disponivel)}</b> {i.unidade} disponível</span>
                  {s.reservado > 0 && <span className="mob-saldo mob-saldo--res"><b>{num(s.reservado)}</b> reservado</span>}
                  {s.emTransito > 0 && <span className="mob-saldo mob-saldo--tra"><b>{num(s.emTransito)}</b> em trânsito</span>}
                  {s.aReceber > 0 && <span className="mob-saldo mob-saldo--rec"><b>+{num(s.aReceber)}</b> a receber</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Movimentações — histórico com o status da transferência
   ============================================================ */
const FILTROS_MOV: { valor: TransferStatus | 'todos'; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todas' },
  { valor: 'reservado', rotulo: 'Reservado' },
  { valor: 'aguardando_aprovacao', rotulo: 'Aguard. aprovação' },
  { valor: 'em_transito', rotulo: 'Em trânsito' },
  { valor: 'avaliacao_entrega', rotulo: 'Avaliação de entrega' },
  { valor: 'recebido_ok', rotulo: 'Recebido ok' },
  { valor: 'recebido_divergencia', rotulo: 'Divergência pendente' },
  { valor: 'encerrado_divergencia', rotulo: 'Finalizada c/ divergência' },
];

export function TelaMovimentacoes({ onAbrir }: { onAbrir: (id: string) => void }) {
  const { state } = useStore();
  const [filtro, setFiltro] = useState<TransferStatus | 'todos'>('todos');

  const linhas = useMemo(() => state.transferencias
    .filter((t) => (filtro === 'todos' ? true : t.status === filtro))
    .flatMap((t) => t.itens.map((it) => ({
      id: `${t.id}-${it.insumoId}`,
      transferenciaId: t.id,
      codigo: t.codigo,
      em: t.despachadaEm ?? t.criadaEm,
      saida: t.obraOrigemId === OBRA_ATUAL,
      nome: it.nome,
      qtd: `${num(it.qtdRecebida ?? it.qtdEnviada)} ${it.unidade}`,
      valor: brl(it.qtdEnviada * it.custoUnitario),
      obra: nomeObra(t.obraOrigemId === OBRA_ATUAL ? t.obraDestinoId : t.obraOrigemId),
      usuario: t.criadaPor.split(' ')[0],
      status: t.status,
    })))
    .sort((a, b) => b.em.localeCompare(a.em)),
  [state.transferencias, filtro]);

  return (
    <>
      <MobTop eyebrow={nomeObra(OBRA_ATUAL)} titulo="Movimentações" />
      <div className="mob-chips" style={{ paddingTop: 12 }}>
        {FILTROS_MOV.map((f) => (
          <button
            key={f.valor} className="mob-chip"
            aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}
          >
            {f.rotulo}
          </button>
        ))}
      </div>
      <div className="mob-corpo">
        <div className="mob-pad" style={{ paddingTop: 0 }}>
          {linhas.length === 0 ? (
            <MobVazio
              titulo="Nenhuma movimentação com esse filtro"
              texto="Troque o status para ver outras movimentações desta obra."
            />
          ) : linhas.map((l) => (
            <button className="mob-mov" key={l.id} onClick={() => onAbrir(l.transferenciaId)} style={{ display: 'block', width: '100%', textAlign: 'left' }}>
              <div className="mob-mov__topo">
                <Badge tom={l.saida ? 'vermelho' : 'verde'}>{l.saida ? 'Saída' : 'Entrada'}</Badge>
                <Badge tom="ambar">Transferência</Badge>
                <BadgeStatus status={l.status} compacto />
              </div>
              <div className="mob-mov__nome">{l.nome}</div>
              <div className="mob-mov__meta">
                {l.qtd} · {l.valor}<br />
                {fmtDataHora(l.em)} · {l.usuario} · {l.saida ? 'para' : 'de'} {l.obra} · {l.codigo}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ============================================================
   Notificações — seção 4 da especificação
   ============================================================ */
export function TelaNotificacoes({ onAbrir }: { onAbrir: (id: string) => void }) {
  const { notificacoesDoPapel, state } = useStore();
  return (
    <>
      <MobTop
        eyebrow={`Vendo como ${ROLE_LABEL[state.papel]}`}
        titulo="Notificações"
      />
      <div className="mob-corpo">
        <div className="mob-pad">
          {notificacoesDoPapel.length === 0 ? (
            <MobVazio
              icone={<Bell size={26} />}
              titulo="Nada por aqui ainda"
              texto="Execute uma ação no fluxo — aprovar, despachar, conferir — para ver quem é avisado em cada transição."
            />
          ) : notificacoesDoPapel.map((n) => (
            <button
              key={n.id}
              className={`mob-notif ${n.critica ? 'mob-notif--critica' : n.tripla ? 'mob-notif--tripla' : ''}`}
              onClick={() => onAbrir(n.transferenciaId)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <span className="mob-notif__ic">
                {n.critica ? <AlertTriangle size={16} color="var(--red-fg)" />
                  : n.tripla ? <Check size={16} color="var(--amber-fg)" />
                  : <Bell size={15} color="var(--text-faint)" />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="mob-notif__t">{n.titulo}</span>
                <span className="mob-notif__d">{n.descricao}</span>
                <span className="mob-notif__papeis">
                  {(['origem', 'aprovador', 'destino'] as Role[]).map((p) => (
                    <span key={p} className={`mob-notif__papel ${n.destinatarios.includes(p) ? 'mob-notif__papel--on' : ''}`}>
                      {ROLE_LABEL[p]}
                    </span>
                  ))}
                  {n.tripla && <span className="mob-notif__papel mob-notif__papel--on">tripla</span>}
                  {n.critica && <span className="mob-notif__papel mob-notif__papel--critica">exige decisão</span>}
                </span>
                <span className="mob-notif__d" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {fmtDataHora(n.em)} <ArrowRight size={12} /> {n.transferenciaCodigo}
                </span>
              </span>
            </button>
          ))}
          {notificacoesDoPapel.length > 0 && (
            <p className="mob-dica" style={{ marginTop: 4 }}>
              A confirmação de recebimento é o único evento com notificação tripla em todo o fluxo.
              A divergência vai além: é o único aviso que exige uma decisão de quem mandou o
              material, e por isso vem marcado em vermelho.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export { STATUS_META };
