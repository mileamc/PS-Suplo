import { useMemo, useState } from 'react';
import {
  ArrowRight, Check, X, Truck, PackageCheck, ClipboardCheck, RotateCcw, Send, Ban,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { nomeObra } from '../../data/obras';
import { STATUS_META } from '../../domain/status';
import { acoesDoPapel, trilha, indiceNaTrilha } from '../../domain/machine';
import { fmtData, fmtDataHora, ROLE_LABEL } from '../../domain/notificacoes';
import { BadgeStatus } from '../../components/ui';
import type { Transferencia, TransferEvento } from '../../domain/types';
import { MobTop, MobAviso, Sheet, brl, num } from './comuns';

type SheetAberto = null | 'despacho' | 'reprovar' | 'cancelar' | 'chegada';

export function TelaDetalhe({
  t, onVoltar, onFvm,
}: { t: Transferencia; onVoltar: () => void; onFvm: (id: string) => void }) {
  const { state, dispatch } = useStore();
  const [sheet, setSheet] = useState<SheetAberto>(null);
  const acoes = acoesDoPapel(t, state.papel, state.aprovacaoAtiva);
  const custo = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const divergente = t.status === 'recebido_divergencia';

  return (
    <>
      <MobTop eyebrow={STATUS_META[t.status].label} titulo={t.codigo} onVoltar={onVoltar} />

      <div className="mob-corpo">
        <div className="mob-pad">
          <div className="mob-cartao" style={{ marginBottom: 16 }}>
            <div className="mob-tcard__rota" style={{ marginTop: 0 }}>
              <strong>{nomeObra(t.obraOrigemId)}</strong>
              <ArrowRight size={14} />
              <strong>{nomeObra(t.obraDestinoId)}</strong>
            </div>
            <div style={{ marginTop: 10 }}><BadgeStatus status={t.status} /></div>
            <p className="mob-dica" style={{ marginTop: 10 }}>{STATUS_META[t.status].descricao}</p>
          </div>

          {divergente && (
            <MobAviso tom="perigo" titulo="Recebido com divergência">
              {t.itens.filter((i) => i.qtdRecebida !== null && i.qtdRecebida !== i.qtdEnviada).map((i) => (
                <div key={i.insumoId} style={{ marginTop: 4 }}>
                  <strong>{i.nome}</strong>: saíram {num(i.qtdEnviada)}, chegaram {num(i.qtdRecebida ?? 0)} {i.unidade}
                  {i.motivoDivergencia && <> — {i.motivoDivergencia}</>}
                </div>
              ))}
            </MobAviso>
          )}

          <div className="mob-bloco">
            <div className="mob-bloco__t">Onde está no fluxo</div>
            <div className="mob-cartao"><Trilha t={t} /></div>
          </div>

          <div className="mob-bloco">
            <div className="mob-bloco__t">Dados da transferência</div>
            <div className="mob-cartao">
              <Linha r="Criada por" v={`${t.criadaPor} · ${fmtData(t.criadaEm)}`} />
              <Linha r="Entrada no fluxo" v={t.entrada === 'requisicao' ? `Requisição ${t.requisicaoCodigo ?? ''}`.trim() : 'Saída direta'} />
              <Linha r="Quem aprovou" v={t.aprovadaPor ? `${t.aprovadaPor} · ${fmtData(t.aprovadaEm!)}` : (state.aprovacaoAtiva ? 'Ainda não aprovada' : 'Aprovação desligada')} />
              <Linha r="Quando saiu" v={t.despachadaEm ? fmtDataHora(t.despachadaEm) : 'Ainda na origem'} />
              <Linha r="Previsão de chegada" v={t.previsaoChegada ? fmtData(t.previsaoChegada) : '—'} />
              <Linha r="Quando chegou" v={t.chegadaEm ? fmtDataHora(t.chegadaEm) : '—'} />
              <Linha r="Custo dos itens" v={brl(custo)} />
            </div>
            {t.observacao && <p className="mob-dica">{t.observacao}</p>}
            {t.motivoReprovacao && (
              <p className="mob-dica" style={{ color: 'var(--red-fg)' }}>
                Motivo da reprovação: {t.motivoReprovacao}
              </p>
            )}
          </div>

          <div className="mob-bloco">
            <div className="mob-bloco__t">Itens · enviado × recebido</div>
            {t.itens.map((i) => {
              const conferido = i.qtdRecebida !== null;
              const ok = conferido && i.qtdRecebida === i.qtdEnviada;
              return (
                <div className="mob-item" key={i.insumoId}>
                  <div className="mob-item__nome">{i.nome}</div>
                  <div className="mob-item__meta">
                    {i.codigo} · {i.tipo === 'avulso' ? 'avulsa' : 'pedido'} · {brl(i.custoUnitario)}/{i.unidade}
                  </div>
                  <div className="mob-item__par">
                    <div className="mob-item__qtd">
                      <span>Enviado</span>
                      <b>{num(i.qtdEnviada)} {i.unidade}</b>
                    </div>
                    <div className={`mob-item__qtd ${conferido ? (ok ? 'mob-item__qtd--ok' : 'mob-item__qtd--dif') : ''}`}>
                      <span>Recebido</span>
                      <b>{conferido ? `${num(i.qtdRecebida!)} ${i.unidade}` : '—'}</b>
                    </div>
                  </div>
                  {i.motivoDivergencia && (
                    <p className="mob-dica" style={{ color: 'var(--red-fg)' }}>{i.motivoDivergencia}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mob-bloco">
            <div className="mob-bloco__t">Histórico</div>
            <div className="mob-cartao">
              <div className="mob-hist">
                {t.eventos.map((e) => <ItemHistorico key={e.id} e={e} />)}
              </div>
            </div>
          </div>

          {t.assinatura && (
            <div className="mob-bloco">
              <div className="mob-bloco__t">Assinatura da saída</div>
              <div className="mob-cartao" style={{ padding: 10 }}>
                <img src={t.assinatura} alt="Assinatura" style={{ width: '100%', maxHeight: 96, objectFit: 'contain' }} />
              </div>
            </div>
          )}

          <div className="mob-btns" style={{ paddingBottom: 12 }}>
            {acoes.length === 0 ? (
              <p className="mob-dica" style={{ textAlign: 'center' }}>
                {STATUS_META[t.status].terminal
                  ? 'Transferência encerrada.'
                  : `Nenhuma ação para ${ROLE_LABEL[state.papel]} neste estado.`}
              </p>
            ) : acoes.map((a) => {
              const classe = a.tom === 'primario' ? 'mob-btn mob-btn--primario'
                : a.tom === 'perigo' ? 'mob-btn mob-btn--perigo' : 'mob-btn';
              const ic = a.id === 'despachar' ? <Truck size={19} />
                : a.id === 'registrar_chegada' ? <PackageCheck size={19} />
                : a.id === 'avaliar_entrega' ? <ClipboardCheck size={19} />
                : a.id === 'reenviar' ? <RotateCcw size={19} />
                : a.id === 'enviar_aprovacao' ? <Send size={19} />
                : a.id === 'aprovar' ? <Check size={19} />
                : a.id === 'cancelar' ? <Ban size={19} />
                : a.id === 'reprovar' ? <X size={19} /> : <ArrowRight size={19} />;
              return (
                <button
                  key={a.id} className={classe}
                  onClick={() => {
                    switch (a.id) {
                      case 'enviar_aprovacao': dispatch({ type: 'enviar_aprovacao', id: t.id }); break;
                      case 'aprovar': dispatch({ type: 'aprovar', id: t.id }); break;
                      case 'reprovar': setSheet('reprovar'); break;
                      case 'despachar': setSheet('despacho'); break;
                      case 'cancelar': setSheet('cancelar'); break;
                      case 'registrar_chegada': setSheet('chegada'); break;
                      case 'avaliar_entrega': onFvm(t.id); break;
                      case 'reenviar': dispatch({ type: 'reenviar', id: t.id }); break;
                      case 'encerrar_divergencia':
                        dispatch({ type: 'encerrar_divergencia', id: t.id }); onVoltar(); break;
                    }
                  }}
                >
                  {ic} {a.label}{a.v1 ? ' (V1)' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {sheet === 'despacho' && <SheetDespacho t={t} onFechar={() => setSheet(null)} />}
      {sheet === 'reprovar' && <SheetReprovar t={t} onFechar={() => setSheet(null)} />}
      {sheet === 'cancelar' && <SheetCancelar t={t} onFechar={() => setSheet(null)} />}
      {sheet === 'chegada' && <SheetChegada t={t} onFechar={() => setSheet(null)} />}
    </>
  );
}

/* ---------------- Sub-componentes ----------------------------- */
function Linha({ r, v }: { r: string; v: string }) {
  return (
    <div className="mob-linha">
      <span className="mob-linha__r">{r}</span>
      <span className="mob-linha__v">{v}</span>
    </div>
  );
}

function Trilha({ t }: { t: Transferencia }) {
  const { state } = useStore();
  const passos = trilha(state.aprovacaoAtiva);
  const atual = indiceNaTrilha(t.status, state.aprovacaoAtiva);
  const divergente = t.status === 'recebido_divergencia';

  if (t.status === 'reprovado' || t.status === 'cancelado') {
    return (
      <MobAviso tom="atencao" titulo={STATUS_META[t.status].label}>
        {STATUS_META[t.status].descricao}
      </MobAviso>
    );
  }

  const quando: Partial<Record<string, string | undefined>> = {
    reservado: t.criadaEm,
    aguardando_aprovacao: t.eventos.find((e) => e.tipo === 'enviada_aprovacao')?.em,
    aprovado: t.aprovadaEm,
    em_transito: t.despachadaEm,
    avaliacao_entrega: t.chegadaEm,
    recebido_ok: t.recebidaEm,
  };

  return (
    <div className="mob-trilha">
      {passos.map((p, i) => {
        const feita = i < atual;
        const eAtual = i === atual;
        const ultimo = i === passos.length - 1;
        const erro = divergente && ultimo;
        const q = quando[p];
        return (
          <div className={`mob-trilha__p ${feita ? 'feito' : ''}`} key={p}>
            <span className={`mob-trilha__bola ${erro ? 'erro' : feita ? 'feito' : eAtual ? 'atual' : ''}`}>
              {erro ? '!' : feita ? <Check size={13} /> : i + 1}
            </span>
            <div>
              <div className={`mob-trilha__rot ${eAtual || erro ? 'atual' : ''}`}>
                {erro ? 'Recebido com divergência' : STATUS_META[p].curto}
              </div>
              {q && (feita || eAtual || erro) && (
                <div className="mob-trilha__quando">{fmtDataHora(q)}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const IC_EV: Record<string, React.ReactNode> = {
  criada: <PackageCheck size={11} />,
  enviada_aprovacao: <Send size={11} />,
  aprovada: <Check size={11} color="var(--green-fg)" />,
  reprovada: <X size={11} color="var(--red-fg)" />,
  despachada: <Truck size={11} color="var(--cyan-fg)" />,
  chegada_registrada: <PackageCheck size={11} color="var(--cyan-fg)" />,
  recebida_ok: <Check size={11} color="var(--green-fg)" />,
  recebida_divergencia: <X size={11} color="var(--red-fg)" />,
  cancelada: <Ban size={11} />,
  reenviada: <RotateCcw size={11} color="var(--purple-fg)" />,
};
const T_EV: Record<string, string> = {
  criada: 'Criada — quantidade reservada',
  enviada_aprovacao: 'Enviada para aprovação',
  aprovada: 'Aprovada',
  reprovada: 'Reprovada',
  despachada: 'Despachada — saiu da obra',
  chegada_registrada: 'Chegada registrada',
  recebida_ok: 'Recebida sem divergência',
  recebida_divergencia: 'Recebida com divergência',
  cancelada: 'Cancelada',
  reenviada: 'Reenviada — voltou para Reservado',
};

function ItemHistorico({ e }: { e: TransferEvento }) {
  return (
    <div className="mob-hist__i">
      <span className="mob-hist__b">{IC_EV[e.tipo]}</span>
      <div>
        <div className="mob-hist__t">{T_EV[e.tipo] ?? e.tipo}</div>
        <div className="mob-hist__m">{fmtDataHora(e.em)} · {e.porNome} · {e.obra}</div>
        {e.detalhe && <div className="mob-hist__d">{e.detalhe}</div>}
      </div>
    </div>
  );
}

/* ---------------- Sheets de ação ------------------------------ */
function SheetDespacho({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const padrao = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().slice(0, 10);
  }, []);
  const [previsao, setPrevisao] = useState(padrao);

  return (
    <Sheet
      titulo="Registrar despacho"
      sub={`${t.codigo} · ${nomeObra(t.obraOrigemId)} → ${nomeObra(t.obraDestinoId)}`}
      onFechar={onFechar}
      rodape={
        <>
          <button
            className="mob-btn mob-btn--primario"
            onClick={() => {
              dispatch({ type: 'despachar', id: t.id, previsaoChegada: new Date(`${previsao}T08:00:00`).toISOString() });
              onFechar();
            }}
          >
            <Truck size={19} /> Confirmar despacho
          </button>
          <button className="mob-btn mob-btn--sm" onClick={onFechar}>Cancelar</button>
        </>
      }
    >
      <MobAviso tom="info" titulo="É aqui que o material sai do saldo">
        Até agora a quantidade estava só reservada. Depois do despacho não há cancelamento.
      </MobAviso>
      <div className="mob-campo">
        <label className="mob-rot">Previsão de chegada <i>*</i></label>
        <input className="mob-input" type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} />
        <p className="mob-dica">O trânsito real leva de 3 a 7 dias. A obra de destino é notificada com esta data.</p>
      </div>
      <div className="mob-bloco">
        <div className="mob-bloco__t">Sai agora</div>
        <div className="mob-cartao">
          {t.itens.map((i) => (
            <Linha key={i.insumoId} r={i.nome} v={`${num(i.qtdEnviada)} ${i.unidade}`} />
          ))}
        </div>
      </div>
    </Sheet>
  );
}

function SheetReprovar({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState(false);
  return (
    <Sheet
      titulo="Reprovar transferência" sub={t.codigo} onFechar={onFechar}
      rodape={
        <>
          <button
            className="mob-btn mob-btn--perigo"
            onClick={() => {
              if (!motivo.trim()) { setErro(true); return; }
              dispatch({ type: 'reprovar', id: t.id, motivo });
              onFechar();
            }}
          >
            <X size={19} /> Reprovar
          </button>
          <button className="mob-btn mob-btn--sm" onClick={onFechar}>Voltar</button>
        </>
      }
    >
      <MobAviso tom="atencao">
        Nada foi movimentado ainda. A quantidade volta ao disponível de {nomeObra(t.obraOrigemId)}.
      </MobAviso>
      <div className="mob-campo">
        <label className="mob-rot">Motivo da reprovação <i>*</i></label>
        <textarea
          className="mob-textarea" placeholder="Ex.: a obra já recebeu carga equivalente."
          value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(false); }}
        />
        {erro && <div className="mob-erro">Informe o motivo da reprovação.</div>}
      </div>
    </Sheet>
  );
}

function SheetCancelar({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const [motivo, setMotivo] = useState('');
  return (
    <Sheet
      titulo="Cancelar transferência" sub={t.codigo} onFechar={onFechar}
      rodape={
        <>
          <button
            className="mob-btn mob-btn--perigo"
            onClick={() => { dispatch({ type: 'cancelar', id: t.id, motivo }); onFechar(); }}
          >
            <Ban size={19} /> Cancelar transferência
          </button>
          <button className="mob-btn mob-btn--sm" onClick={onFechar}>Voltar</button>
        </>
      }
    >
      <MobAviso tom="atencao" titulo="Ainda dá tempo">
        O material não foi despachado. A quantidade volta ao disponível de {nomeObra(t.obraOrigemId)}.
      </MobAviso>
      <div className="mob-campo">
        <label className="mob-rot">Motivo</label>
        <textarea
          className="mob-textarea" placeholder="Opcional, mas fica no histórico."
          value={motivo} onChange={(e) => setMotivo(e.target.value)}
        />
      </div>
    </Sheet>
  );
}

function SheetChegada({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  return (
    <Sheet
      titulo="O material chegou?" sub={t.codigo} onFechar={onFechar}
      rodape={
        <>
          <button
            className="mob-btn mob-btn--primario"
            onClick={() => { dispatch({ type: 'registrar_chegada', id: t.id }); onFechar(); }}
          >
            <PackageCheck size={19} /> Sim, chegou
          </button>
          <button className="mob-btn mob-btn--sm" onClick={onFechar}>Ainda não</button>
        </>
      }
    >
      <MobAviso tom="info">
        Registrar a chegada abre a <strong>Avaliação de entrega (FVM)</strong>. A conferência de
        quantidade é obrigatória — é ela que captura o "saíram 10, chegaram 8".
      </MobAviso>
      <div className="mob-cartao" style={{ marginBottom: 16 }}>
        <Linha r="De" v={nomeObra(t.obraOrigemId)} />
        <Linha r="Saiu em" v={t.despachadaEm ? fmtData(t.despachadaEm) : '—'} />
        <Linha r="Previsão" v={t.previsaoChegada ? fmtData(t.previsaoChegada) : '—'} />
      </div>
    </Sheet>
  );
}
