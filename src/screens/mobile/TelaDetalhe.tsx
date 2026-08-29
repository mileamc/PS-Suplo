import { useMemo, useState } from 'react';
import {
  ArrowRight, Check, X, Truck, PackageCheck, ClipboardCheck, RotateCcw, Ban,
  FileText, Star, Paperclip, Wallet, AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { nomeObra } from '../../data/obras';
import { STATUS_META, divergenciaPendente } from '../../domain/status';
import { acoesDoPapel, trilha, indiceNaTrilha } from '../../domain/machine';
import { fmtData, fmtDataHora, ROLE_LABEL } from '../../domain/notificacoes';
import { FICHAS, nomeCriterio } from '../../data/avaliacao';
import { linhaPorId } from '../../data/orcamento';
import { BadgeStatus, BadgeDivergencia } from '../../components/ui';
import type { Transferencia, TransferEvento } from '../../domain/types';
import { MobTop, MobAviso, Sheet, brl, num } from './comuns';

type SheetAberto = null | 'despacho' | 'reprovar' | 'cancelar' | 'chegada' | 'nf' | 'encerrar';

export function TelaDetalhe({
  t, onVoltar, onFvm, somenteLeitura = false,
}: {
  t: Transferencia; onVoltar: () => void;
  onFvm: (id: string) => void; somenteLeitura?: boolean;
}) {
  const { state, dispatch } = useStore();
  const [sheet, setSheet] = useState<SheetAberto>(null);
  const acoes = somenteLeitura ? [] : acoesDoPapel(t, state.papel);
  const custo = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const divergente = divergenciaPendente(t) || t.status === 'encerrado_divergencia';

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
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <BadgeStatus status={t.status} />
              <BadgeDivergencia t={t} />
            </div>
            <p className="mob-dica" style={{ marginTop: 10 }}>{STATUS_META[t.status].descricao}</p>
          </div>

          {divergente && (
            <MobAviso
              tom={divergenciaPendente(t) ? 'perigo' : 'atencao'}
              titulo={divergenciaPendente(t)
                ? 'Divergência aberta — decisão da origem'
                : 'Finalizada com divergência'}
            >
              {t.itens.filter((i) => i.qtdRecebida !== null && i.qtdRecebida !== i.qtdEnviada).map((i) => (
                <div key={i.insumoId} style={{ marginTop: 4 }}>
                  <strong>{i.nome}</strong>: saíram {num(i.qtdEnviada)}, chegaram {num(i.qtdRecebida ?? 0)} {i.unidade}
                  {i.motivoDivergencia && <> — {i.motivoDivergencia}</>}
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                {divergenciaPendente(t)
                  ? `A transferência só fecha quando ${nomeObra(t.obraOrigemId)} enviar o saldo faltante ou encerrar assumindo a falta. Anexar a NF aqui não finaliza.`
                  : `${t.encerramento?.por} encerrou o caso em ${t.encerramento ? fmtDataHora(t.encerramento.em) : '—'}.${t.encerramento?.observacao ? ` ${t.encerramento.observacao}` : ''}`}
              </div>
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
              <Linha r="Quando saiu" v={t.dataSaida ? fmtData(t.dataSaida) : 'Ainda na origem'} />
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
                  {i.linhaOrcamento && (
                    <div className="mob-item__meta" style={{ color: 'var(--blue-fg)', fontWeight: 600 }}>
                      <Wallet size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                      {linhaPorId(i.linhaOrcamento)?.codigo} — {linhaPorId(i.linhaOrcamento)?.nome}
                    </div>
                  )}
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

          {t.avaliacao && (
            <div className="mob-bloco">
              <div className="mob-bloco__t">Avaliação de entrega</div>
              <div className="mob-cartao">
                {Object.entries(t.avaliacao.respostas).map(([id, v]) => (
                  <div className="mob-linha" key={id}>
                    <span className="mob-linha__r" style={{ flex: 1 }}>{nomeCriterio(id)}</span>
                    <span className="mob-linha__v">
                      {typeof v === 'number' ? (
                        <span style={{ display: 'inline-flex', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n} size={15}
                              color={v >= n ? 'var(--amber)' : 'var(--border-strong)'}
                              fill={v >= n ? 'var(--amber)' : 'none'}
                            />
                          ))}
                        </span>
                      ) : (v ? 'Sim' : 'Não')}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mob-dica">
                Fichas: {t.avaliacao.fichas.map((f) => FICHAS.find((x) => x.id === f)?.nome).filter(Boolean).join(' · ')}
                {' · '}por {t.avaliacao.avaliadaPor}
              </p>
              {t.avaliacao.observacao && <p className="mob-dica">{t.avaliacao.observacao}</p>}
              {t.avaliacao.anexos.map((a) => (
                <p className="mob-dica" key={a}><Paperclip size={12} style={{ verticalAlign: -2 }} /> {a}</p>
              ))}
            </div>
          )}

          {t.nf && (
            <div className="mob-bloco">
              <div className="mob-bloco__t">Nota fiscal</div>
              <div className="mob-cartao">
                <Linha r="Número da NF" v={t.nf.numero} />
                <Linha r="Confirmada por" v={`${t.nf.confirmadaPor} · ${fmtData(t.nf.confirmadaEm)}`} />
                <Linha r="Anexo" v={t.nf.anexo} />
              </div>
            </div>
          )}

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
                {somenteLeitura
                  ? 'Visão geral, só leitura. As ações ficam nos filtros por estado.'
                  : STATUS_META[t.status].terminal
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
                : a.id === 'aprovar' ? <Check size={19} />
                : a.id === 'cancelar' ? <Ban size={19} />
                : a.id === 'confirmar_nf' ? <FileText size={19} />
                : a.id === 'reprovar' ? <X size={19} /> : <ArrowRight size={19} />;
              return (
                <button
                  key={a.id} className={classe}
                  onClick={() => {
                    switch (a.id) {
                      case 'aprovar': dispatch({ type: 'aprovar', id: t.id }); break;
                      case 'reprovar': setSheet('reprovar'); break;
                      case 'despachar': setSheet('despacho'); break;
                      case 'cancelar': setSheet('cancelar'); break;
                      case 'registrar_chegada': setSheet('chegada'); break;
                      case 'avaliar_entrega': onFvm(t.id); break;
                      case 'confirmar_nf': setSheet('nf'); break;
                      case 'reenviar': dispatch({ type: 'reenviar', id: t.id }); break;
                      case 'encerrar_divergencia': setSheet('encerrar'); break;
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
      {sheet === 'chegada' && (
        <SheetChegada
          t={t} onFechar={() => setSheet(null)}
          onSeguirParaFvm={() => { setSheet(null); onFvm(t.id); }}
        />
      )}
      {sheet === 'nf' && <SheetNf t={t} onFechar={() => setSheet(null)} />}
      {sheet === 'encerrar' && (
        <SheetEncerrarDivergencia t={t} onFechar={() => setSheet(null)} onPronto={onVoltar} />
      )}
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
  const divergente = divergenciaPendente(t) || t.status === 'encerrado_divergencia';

  if (t.status === 'reprovado' || t.status === 'cancelado') {
    return (
      <MobAviso tom="atencao" titulo={STATUS_META[t.status].label}>
        {STATUS_META[t.status].descricao}
      </MobAviso>
    );
  }

  const quando: Partial<Record<string, string | undefined>> = {
    reservado: t.criadaEm,
    // A criação já entra em "aprovação pendente", então é o mesmo instante.
    aguardando_aprovacao: t.criadaEm,
    aprovado: t.aprovadaEm,
    em_transito: t.despachadaEm,
    avaliacao_entrega: t.chegadaEm,
    aguardando_nf: t.recebidaEm,
    recebido_ok: t.nf?.confirmadaEm,
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
                {erro ? 'Com divergência' : STATUS_META[p].passo ?? STATUS_META[p].curto}
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
  aprovada: <Check size={11} color="var(--green-fg)" />,
  reprovada: <X size={11} color="var(--red-fg)" />,
  despachada: <Truck size={11} color="var(--cyan-fg)" />,
  chegada_registrada: <PackageCheck size={11} color="var(--cyan-fg)" />,
  recebida_ok: <Check size={11} color="var(--green-fg)" />,
  recebida_divergencia: <X size={11} color="var(--red-fg)" />,
  divergencia_encerrada: <AlertTriangle size={11} color="var(--red-fg)" />,
  cancelada: <Ban size={11} />,
  reenviada: <RotateCcw size={11} color="var(--purple-fg)" />,
  nf_confirmada: <FileText size={11} color="var(--green-fg)" />,
};
const T_EV: Record<string, string> = {
  criada: 'Criada — quantidade reservada',
  aprovada: 'Aprovada',
  reprovada: 'Reprovada',
  despachada: 'Despachada — saiu da obra',
  chegada_registrada: 'Chegada registrada',
  recebida_ok: 'Recebida sem divergência',
  recebida_divergencia: 'Recebida com divergência',
  divergencia_encerrada: 'Divergência encerrada pela origem',
  cancelada: 'Cancelada',
  reenviada: 'Reenviada — voltou para Reservado',
  nf_confirmada: 'NF confirmada — transferência encerrada',
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
  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [saida, setSaida] = useState(hoje);
  const [previsao, setPrevisao] = useState(padrao);
  const [erro, setErro] = useState('');

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
              if (new Date(previsao) < new Date(saida)) {
                setErro('A previsão não pode ser anterior à data de saída.');
                return;
              }
              dispatch({
                type: 'despachar', id: t.id,
                dataSaida: new Date(`${saida}T08:00:00`).toISOString(),
                previsaoChegada: new Date(`${previsao}T08:00:00`).toISOString(),
              });
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
        <label className="mob-rot">Data de saída <i>*</i></label>
        <input className="mob-input" type="date" value={saida}
          onChange={(e) => { setSaida(e.target.value); setErro(''); }} />
      </div>
      <div className="mob-campo">
        <label className="mob-rot">Previsão de chegada <i>*</i></label>
        <input className="mob-input" type="date" value={previsao}
          onChange={(e) => { setPrevisao(e.target.value); setErro(''); }} />
        <p className="mob-dica">O trânsito real leva de 3 a 7 dias. A obra de destino é notificada com esta data.</p>
        {erro && <div className="mob-erro">{erro}</div>}
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

/**
 * Alegar o recebimento tira a carga do trânsito e emenda direto na FVM —
 * o material está no pátio agora, é a hora natural de conferir. Quem não
 * puder conferir na hora reencontra a transferência no chip "FVM pendente".
 */
function SheetChegada({
  t, onFechar, onSeguirParaFvm,
}: { t: Transferencia; onFechar: () => void; onSeguirParaFvm: () => void }) {
  const { dispatch } = useStore();

  function alegarRecebimento(seguir: boolean) {
    dispatch({ type: 'registrar_chegada', id: t.id });
    if (seguir) onSeguirParaFvm(); else onFechar();
  }

  return (
    <Sheet
      titulo="O material chegou?" sub={t.codigo} onFechar={onFechar}
      rodape={
        <>
          <button className="mob-btn mob-btn--primario" onClick={() => alegarRecebimento(true)}>
            <PackageCheck size={19} /> Chegou — conferir agora
          </button>
          <button className="mob-btn mob-btn--sm" onClick={() => alegarRecebimento(false)}>
            Chegou, faço a FVM depois
          </button>
          <button className="mob-btn mob-btn--sm" onClick={onFechar}>Ainda não chegou</button>
        </>
      }
    >
      <MobAviso tom="info" titulo="Ainda não entrou no estoque">
        Alegar o recebimento só tira a carga do trânsito. Quem faz o material entrar no estoque é a{' '}
        <strong>Avaliação de entrega (FVM)</strong> — a conferência de quantidade que captura o
        "saíram 10, chegaram 8". Sem ela, a transferência fica em <strong>FVM pendente</strong>.
      </MobAviso>
      <div className="mob-cartao" style={{ marginBottom: 16 }}>
        <Linha r="De" v={nomeObra(t.obraOrigemId)} />
        <Linha r="Saiu em" v={t.despachadaEm ? fmtData(t.despachadaEm) : '—'} />
        <Linha r="Previsão" v={t.previsaoChegada ? fmtData(t.previsaoChegada) : '—'} />
      </div>
    </Sheet>
  );
}

/* ---------------- Confirmação da NF --------------------------- */
function SheetNf({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const [numero, setNumero] = useState('');
  const [anexo, setAnexo] = useState('');
  const [erro, setErro] = useState(false);
  const divergente = t.itens.some((i) => i.qtdRecebida !== null && i.qtdRecebida !== i.qtdEnviada);

  return (
    <Sheet
      titulo="Confirmar NF" sub={`${t.codigo} · material já conferido e no estoque`}
      onFechar={onFechar}
      rodape={
        <>
          <button
            className="mob-btn mob-btn--primario"
            onClick={() => {
              if (!numero.trim() || !anexo) { setErro(true); return; }
              dispatch({ type: 'confirmar_nf', id: t.id, numero: numero.trim(), anexo });
              onFechar();
            }}
          >
            <Check size={19} /> Confirmar recebimento da NF
          </button>
          <button className="mob-btn mob-btn--sm" onClick={onFechar}>Agora não</button>
        </>
      }
    >
      <MobAviso tom={divergente ? 'atencao' : 'info'}>
        {divergente
          ? `A conferência registrou divergência, então a NF não encerra a transferência: ela fica aberta até ${nomeObra(t.obraOrigemId)} enviar o que faltou ou encerrar assumindo a falta.`
          : 'A conferência fechou sem divergência. Confirmar a NF encerra a transferência.'}
      </MobAviso>

      <div className="mob-campo">
        <label className="mob-rot">Número da NF <i>*</i></label>
        <input
          className="mob-input" placeholder="Ex.: 000.412.889" inputMode="numeric"
          value={numero} onChange={(e) => { setNumero(e.target.value); setErro(false); }}
        />
      </div>

      <div className="mob-campo">
        <label className="mob-rot">Anexo da NF <i>*</i></label>
        {anexo ? (
          <div className="mob-opcao" aria-pressed="true">
            <Paperclip size={17} className="mob-opcao__check" />
            <div className="mob-opcao__txt"><div className="mob-opcao__nome">{anexo}</div></div>
            <button
              className="mob-icone"
              style={{ width: 38, height: 38, background: 'var(--red-bg)', borderColor: 'transparent', color: 'var(--red-fg)' }}
              onClick={() => setAnexo('')} aria-label="Remover"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            className="mob-btn mob-btn--sm"
            onClick={() => setAnexo(`nf-${t.codigo.toLowerCase()}.pdf`)}
          >
            <Paperclip size={17} /> Anexar a nota fiscal
          </button>
        )}
        <p className="mob-dica">PDF ou XML da nota. Máximo 10MB.</p>
        {erro && <div className="mob-erro">Informe o número da NF e anexe o arquivo.</div>}
      </div>
    </Sheet>
  );
}

/* ---------------- Encerrar a divergência ----------------------
   A decisão é da obra de ORIGEM. É ela, e não a nota fiscal do
   destino, que leva a transferência para "finalizada".
   -------------------------------------------------------------- */
function SheetEncerrarDivergencia({
  t, onFechar, onPronto,
}: { t: Transferencia; onFechar: () => void; onPronto: () => void }) {
  const { dispatch } = useStore();
  const [observacao, setObservacao] = useState('');

  const faltas = t.itens
    .filter((i) => i.qtdRecebida !== null && i.qtdRecebida !== i.qtdEnviada)
    .map((i) => ({ ...i, falta: i.qtdEnviada - (i.qtdRecebida ?? 0) }));
  const perda = faltas.reduce((s, i) => s + i.falta * i.custoUnitario, 0);

  return (
    <Sheet
      titulo="Encerrar com divergência" sub={t.codigo} onFechar={onFechar}
      rodape={
        <>
          <button
            className="mob-btn mob-btn--perigo"
            onClick={() => {
              dispatch({ type: 'encerrar_divergencia', id: t.id, observacao });
              onFechar(); onPronto();
            }}
          >
            <Check size={19} /> Encerrar assumindo a falta
          </button>
          <button className="mob-btn mob-btn--sm" onClick={onFechar}>Voltar</button>
        </>
      }
    >
      <MobAviso tom="atencao" titulo="Esta é a decisão que fecha a transferência">
        Encerrar significa que não vem mais material: a diferença vira perda assumida por{' '}
        {nomeObra(t.obraOrigemId)}. Se ainda for enviar o saldo, volte e escolha "Enviar o que faltou".
      </MobAviso>

      {!t.nf && (
        <MobAviso tom="info">
          {nomeObra(t.obraDestinoId)} ainda não confirmou a nota fiscal. Encerrar agora fecha o caso
          assim mesmo.
        </MobAviso>
      )}

      <div className="mob-cartao" style={{ marginBottom: 16 }}>
        {faltas.map((i) => (
          <div className="mob-linha" key={i.insumoId}>
            <span className="mob-linha__r">{i.nome}</span>
            <span className="mob-linha__v" style={{ color: 'var(--red-fg)' }}>
              -{num(i.falta)} {i.unidade}
            </span>
          </div>
        ))}
        <div className="mob-linha">
          <span className="mob-linha__r">Perda assumida</span>
          <span className="mob-linha__v" style={{ color: 'var(--red-fg)' }}>{brl(perda)}</span>
        </div>
      </div>

      <div className="mob-campo">
        <label className="mob-rot">Por que está encerrando sem reenviar?</label>
        <textarea
          className="mob-textarea"
          placeholder="Ex.: perda no trajeto já apurada com a transportadora."
          value={observacao} onChange={(e) => setObservacao(e.target.value)}
        />
      </div>
    </Sheet>
  );
}
