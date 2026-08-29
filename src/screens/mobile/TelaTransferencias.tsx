import { useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpFromLine, ArrowDownToLine, Plus, AlertCircle,
  ClipboardCheck, Truck, PackageCheck, SlidersHorizontal, Send,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { nomeObra } from '../../data/obras';
import { STATUS_META, STATUS_TRANSITO } from '../../domain/status';
import { acoesDoPapel } from '../../domain/machine';
import { fmtData } from '../../domain/notificacoes';
import { BadgeStatus, corDoStatus } from '../../components/ui';
import type { Transferencia, TransferStatus } from '../../domain/types';
import { MobTop, MobVazio, MobCarregando, brl } from './comuns';

const HOJE = new Date('2026-08-29T12:00:00');

export function atrasada(t: Transferencia): boolean {
  return STATUS_TRANSITO.includes(t.status)
    && Boolean(t.previsaoChegada)
    && new Date(t.previsaoChegada!) < HOJE;
}

const FILTROS: { valor: TransferStatus | 'todos'; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'reservado', rotulo: 'Reservado' },
  { valor: 'aguardando_aprovacao', rotulo: 'Aguard. aprovação' },
  { valor: 'aprovado', rotulo: 'Aprovado' },
  { valor: 'em_transito', rotulo: 'Em trânsito' },
  { valor: 'avaliacao_entrega', rotulo: 'Avaliação de entrega' },
  { valor: 'recebido_ok', rotulo: 'Recebido ok' },
  { valor: 'recebido_divergencia', rotulo: 'Com divergência' },
  { valor: 'reprovado', rotulo: 'Reprovado' },
  { valor: 'cancelado', rotulo: 'Cancelado' },
];

export function TelaTransferencias({
  onAbrir, onNova, onConfig,
}: { onAbrir: (id: string) => void; onNova: () => void; onConfig: () => void }) {
  const { state, aEnviar, aReceber } = useStore();
  const [direcao, setDirecao] = useState<'enviar' | 'receber'>('enviar');
  const [filtro, setFiltro] = useState<TransferStatus | 'todos'>('todos');

  const base = direcao === 'enviar' ? aEnviar : aReceber;
  const lista = useMemo(
    () => base
      .filter((t) => (filtro === 'todos' ? true : t.status === filtro))
      .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
    [base, filtro],
  );
  const abertas = (l: Transferencia[]) => l.filter((t) => !STATUS_META[t.status].terminal).length;
  const conta = (s: TransferStatus | 'todos') =>
    s === 'todos' ? base.length : base.filter((t) => t.status === s).length;

  return (
    <>
      <MobTop
        eyebrow={nomeObra('ob-002')}
        titulo="Transferências"
        acoes={
          <button className="mob-icone" onClick={onConfig} aria-label="Configurações da demo">
            <SlidersHorizontal size={18} />
          </button>
        }
      />

      <div className="mob-corpo">
        <div className="mob-pad" style={{ paddingBottom: 0 }}>
          <div className="mob-seg">
            <button aria-pressed={direcao === 'enviar'} onClick={() => { setDirecao('enviar'); setFiltro('todos'); }}>
              <ArrowUpFromLine size={16} /> A Enviar
              <span className="mob-seg__cont">{abertas(aEnviar)}</span>
            </button>
            <button aria-pressed={direcao === 'receber'} onClick={() => { setDirecao('receber'); setFiltro('todos'); }}>
              <ArrowDownToLine size={16} /> A Receber
              <span className="mob-seg__cont">{abertas(aReceber)}</span>
            </button>
          </div>
        </div>

        <div className="mob-chips">
          {FILTROS.filter((f) => f.valor === 'todos' || conta(f.valor) > 0).map((f) => (
            <button
              key={f.valor} className="mob-chip"
              aria-pressed={filtro === f.valor}
              onClick={() => setFiltro(f.valor)}
            >
              {f.rotulo} <span className="mob-chip__n">{conta(f.valor)}</span>
            </button>
          ))}
        </div>

        {state.estadoTela === 'carregando' ? (
          <MobCarregando />
        ) : state.estadoTela === 'vazio' || lista.length === 0 ? (
          <MobVazio
            titulo={direcao === 'enviar' ? 'Nada para enviar' : 'Nada a receber'}
            texto={direcao === 'enviar'
              ? 'Quando esta obra tiver sobra de material, crie uma transferência para reservar a quantidade.'
              : 'Assim que outra obra despachar material para cá, ele aparece aqui com a previsão de chegada.'}
            acao={direcao === 'enviar'
              ? <button className="mob-btn mob-btn--primario mob-btn--sm" onClick={onNova}>
                  <Plus size={18} /> Nova transferência
                </button>
              : undefined}
          />
        ) : (
          <div className="mob-pad" style={{ paddingTop: 0, paddingBottom: 96 }}>
            {lista.map((t) => (
              <CardTransferencia key={t.id} t={t} direcao={direcao} onAbrir={onAbrir} />
            ))}
          </div>
        )}
      </div>

      {direcao === 'enviar' && state.estadoTela === 'normal' && lista.length > 0 && (
        <button className="mob-fab" onClick={onNova}>
          <Plus size={19} /> Nova
        </button>
      )}
    </>
  );
}

/* ---------------- Card ---------------------------------------- */
function CardTransferencia({
  t, direcao, onAbrir,
}: { t: Transferencia; direcao: 'enviar' | 'receber'; onAbrir: (id: string) => void }) {
  const { state } = useStore();
  const total = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const acoes = acoesDoPapel(t, state.papel, state.aprovacaoAtiva);
  // O atalho do card sugere sempre a ação que faz o fluxo andar;
  // cancelar e reprovar ficam só dentro do detalhe.
  const principal = acoes.find((a) => a.tom !== 'perigo');

  const icone = principal?.id === 'avaliar_entrega' ? <ClipboardCheck size={15} />
    : principal?.id === 'registrar_chegada' ? <PackageCheck size={15} />
    : principal?.id === 'despachar' ? <Truck size={15} />
    : principal?.id === 'enviar_aprovacao' ? <Send size={15} />
    : <ArrowRight size={15} />;

  return (
    <button className="mob-tcard" style={{ ['--c' as string]: corDoStatus(t.status) }} onClick={() => onAbrir(t.id)}>
      <div className="mob-tcard__topo">
        <span className="mob-tcard__cod">{t.codigo}</span>
        <BadgeStatus status={t.status} compacto />
      </div>

      <div className="mob-tcard__rota">
        <span>{direcao === 'enviar' ? 'para' : 'de'}</span>
        <ArrowRight size={13} />
        <strong>{nomeObra(direcao === 'enviar' ? t.obraDestinoId : t.obraOrigemId)}</strong>
      </div>

      <div className="mob-tcard__meta">
        {t.itens.length === 1
          ? `${t.itens[0].nome}`
          : `${t.itens.length} insumos`}
        {' · '}
        {t.itens.reduce((s, i) => s + i.qtdEnviada, 0).toLocaleString('pt-BR')} un. no total
      </div>

      {atrasada(t) && (
        <div className="mob-alerta-atraso">
          <AlertCircle size={13} /> Atrasada — previsão era {fmtData(t.previsaoChegada!)}
        </div>
      )}

      <div className="mob-tcard__rodape">
        <span className="mob-tcard__valor">{brl(total)}</span>
        {principal
          ? <span className="mob-tcard__acao">{icone} {principal.label}</span>
          : <span className="mob-tcard__acao" style={{ color: 'var(--text-faint)' }}>
              {t.status === 'em_transito' && t.previsaoChegada
                ? `chega ${fmtData(t.previsaoChegada)}`
                : 'ver detalhe'}
            </span>}
      </div>
    </button>
  );
}
