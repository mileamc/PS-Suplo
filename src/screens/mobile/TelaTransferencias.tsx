import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, ArrowUpFromLine, ArrowDownToLine, Plus, AlertCircle,
  ClipboardCheck, Truck, PackageCheck, SlidersHorizontal, Send, FileText, Eye,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { nomeObra } from '../../data/obras';
import { STATUS_META } from '../../domain/status';
// Os grupos são os mesmos da versão web — a definição vive em domain/grupos.ts
// para as duas telas não saírem do lugar uma da outra.
import { atrasada, noGrupo, gruposDoPapel, rotuloGrupo, type Grupo } from '../../domain/grupos';
import { acoesDoPapel } from '../../domain/machine';
import { fmtData } from '../../domain/notificacoes';
import { BadgeStatus, corDoStatus } from '../../components/ui';
import type { Transferencia } from '../../domain/types';
import { MobTop, MobVazio, MobCarregando, brl } from './comuns';

export function TelaTransferencias({
  onAbrir, onNova, onConfig,
}: { onAbrir: (id: string, leitura?: boolean) => void; onNova: () => void; onConfig: () => void }) {
  const { state, aEnviar, aReceber } = useStore();
  const [direcao, setDirecao] = useState<'enviar' | 'receber'>('enviar');
  const [filtro, setFiltro] = useState<Grupo>('total');

  const base = direcao === 'enviar' ? aEnviar : aReceber;
  const somenteLeitura = filtro === 'total';
  const lista = useMemo(
    () => base.filter((t) => noGrupo(t, filtro)).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
    [base, filtro],
  );
  const abertas = (l: Transferencia[]) => l.filter((t) => !STATUS_META[t.status].terminal).length;
  const conta = (g: Grupo) => base.filter((t) => noGrupo(t, g)).length;

  // "Aprovações pendentes" é chip só de quem aprova; para os outros papéis
  // a pendência aparece apenas como tag no card da transferência.
  const filtros = gruposDoPapel(state.papel);
  useEffect(() => {
    if (!filtros.some((f) => f.grupo === filtro)) setFiltro('total');
  }, [filtros, filtro]);

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
            <button aria-pressed={direcao === 'enviar'} onClick={() => { setDirecao('enviar'); setFiltro('total'); }}>
              <ArrowUpFromLine size={16} /> A Enviar
              <span className="mob-seg__cont">{abertas(aEnviar)}</span>
            </button>
            <button aria-pressed={direcao === 'receber'} onClick={() => { setDirecao('receber'); setFiltro('total'); }}>
              <ArrowDownToLine size={16} /> A Receber
              <span className="mob-seg__cont">{abertas(aReceber)}</span>
            </button>
          </div>
        </div>

        <div className="mob-chips">
          {filtros.filter((f) => f.grupo === 'total' || conta(f.grupo) > 0).map((f) => (
            <button
              key={f.grupo} className="mob-chip"
              aria-pressed={filtro === f.grupo}
              onClick={() => setFiltro(f.grupo)}
            >
              {f.rotulo} <span className="mob-chip__n">{conta(f.grupo)}</span>
            </button>
          ))}
        </div>

        {state.estadoTela === 'carregando' ? (
          <MobCarregando />
        ) : state.estadoTela === 'vazio' || lista.length === 0 ? (
          <MobVazio
            titulo={filtro === 'total'
              ? (direcao === 'enviar' ? 'Nada para enviar' : 'Nada a receber')
              : `Nada no filtro "${rotuloGrupo(filtro)}"`}
            texto={direcao === 'enviar'
              ? 'Quando esta obra tiver sobra de material, crie uma transferência para reservar a quantidade.'
              : 'Assim que outra obra despachar material para cá, ele aparece aqui com a previsão de chegada.'}
            acao={direcao === 'enviar' && filtro === 'total'
              ? <button className="mob-btn mob-btn--primario mob-btn--sm" onClick={onNova}>
                  <Plus size={18} /> Nova transferência
                </button>
              : undefined}
          />
        ) : (
          <div className="mob-pad" style={{ paddingTop: 0, paddingBottom: 96 }}>
            {somenteLeitura && (
              <div className="mob-aviso mob-aviso--info">
                <Eye size={16} />
                <div>
                  <b>Visão geral, só leitura</b>
                  Tudo que está entrando e saindo desta obra, e em que estado está. Para agir,
                  escolha o filtro do estado.
                </div>
              </div>
            )}
            {lista.map((t) => (
              <CardTransferencia
                key={t.id} t={t} direcao={direcao} onAbrir={onAbrir}
                somenteLeitura={somenteLeitura}
              />
            ))}
          </div>
        )}
      </div>

      {/* Criar não é agir sobre uma transferência existente: o atalho de
          criação continua disponível inclusive na visão Total. */}
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
  t, direcao, onAbrir, somenteLeitura,
}: {
  t: Transferencia; direcao: 'enviar' | 'receber';
  onAbrir: (id: string, leitura?: boolean) => void; somenteLeitura?: boolean;
}) {
  const { state } = useStore();
  const total = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const acoes = somenteLeitura ? [] : acoesDoPapel(t, state.papel);
  // O atalho do card sugere sempre a ação que faz o fluxo andar;
  // cancelar e reprovar ficam só dentro do detalhe.
  const principal = acoes.find((a) => a.tom !== 'perigo');

  const icone = principal?.id === 'avaliar_entrega' ? <ClipboardCheck size={15} />
    : principal?.id === 'registrar_chegada' ? <PackageCheck size={15} />
    : principal?.id === 'despachar' ? <Truck size={15} />
    : principal?.id === 'confirmar_nf' ? <FileText size={15} />
    : principal?.id === 'aprovar' ? <Send size={15} />
    : <ArrowRight size={15} />;

  return (
    <button
      className="mob-tcard" style={{ ['--c' as string]: corDoStatus(t.status) }}
      onClick={() => onAbrir(t.id, somenteLeitura)}
    >
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
