import { useEffect, useState } from 'react';
import {
  X, Check, ArrowRight, Truck, Package, ClipboardCheck, RotateCcw,
  User, Calendar, CalendarCheck, CalendarClock, Building2, Coins, PenLine, ClipboardList,
  FileText, Star, Paperclip, Wallet, AlertTriangle,
} from 'lucide-react';
import { BadgeStatus, BadgeDivergencia, Aviso } from '../../components/ui';
import { STATUS_META, divergenciaPendente } from '../../domain/status';
import { acoesDoPapel, trilha, indiceNaTrilha } from '../../domain/machine';
import { fmtData, fmtDataHora, ROLE_LABEL } from '../../domain/notificacoes';
import { nomeObra } from '../../data/obras';
import { useStore } from '../../state/store';
import type { Transferencia, TransferEvento } from '../../domain/types';
import {
  ReprovarModal, DespachoModal, CancelarModal, FvmModal, ChegadaModal, NfModal,
  EncerrarDivergenciaModal,
} from './TransferenciaModais';
import { FICHAS, nomeCriterio } from '../../data/avaliacao';
import { linhaPorId } from '../../data/orcamento';

type ModalAberto = null | 'reprovar' | 'despacho' | 'cancelar' | 'fvm' | 'chegada' | 'nf' | 'encerrar';

export function TransferenciaDrawer({
  t, onFechar, somenteLeitura = false,
}: { t: Transferencia; onFechar: () => void; somenteLeitura?: boolean }) {
  const { state, dispatch } = useStore();
  const [modal, setModal] = useState<ModalAberto>(null);
  const acoes = somenteLeitura ? [] : acoesDoPapel(t, state.papel);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !modal) onFechar(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modal, onFechar]);
  const meta = STATUS_META[t.status];

  const custoTotal = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const divergenciaAberta = divergenciaPendente(t);

  return (
    <>
      <div className="drawer-overlay" onClick={onFechar} />
      <aside className="drawer" role="dialog" aria-label={`Transferência ${t.codigo}`}>
        <header className="drawer__cabecalho">
          <div className="linha linha--entre">
            <div>
              <div className="linha" style={{ gap: 10 }}>
                <h2 className="modal__titulo">{t.codigo}</h2>
                <BadgeStatus status={t.status} />
                <BadgeDivergencia t={t} />
                {t.ciclo > 0 && <span className="badge badge--roxo">{t.ciclo}º reenvio</span>}
              </div>
              <div className="rota mt-8">
                <span className="rota__obra">{nomeObra(t.obraOrigemId)}</span>
                <ArrowRight size={14} />
                <span className="rota__obra">{nomeObra(t.obraDestinoId)}</span>
              </div>
            </div>
            <button className="modal__fechar" onClick={onFechar}><X size={18} /></button>
          </div>
          <p className="txt-12 txt-muted mt-12">{meta.descricao}</p>
        </header>

        <div className="drawer__corpo">
          <Stepper t={t} />

          {(divergenciaAberta || t.status === 'encerrado_divergencia') && (
            <Aviso
              tom={divergenciaAberta ? 'perigo' : 'atencao'}
              titulo={divergenciaAberta
                ? 'Divergência aberta — decisão da obra de origem'
                : 'Finalizada com divergência'}
            >
              {t.itens.filter((i) => i.qtdRecebida !== null && i.qtdRecebida !== i.qtdEnviada).map((i) => (
                <div key={i.insumoId} style={{ marginTop: 4 }}>
                  <strong>{i.nome}</strong>: saíram {i.qtdEnviada.toLocaleString('pt-BR')} {i.unidade},
                  chegaram {(i.qtdRecebida ?? 0).toLocaleString('pt-BR')} {i.unidade}
                  {i.motivoDivergencia && <> — <em>{i.motivoDivergencia}</em></>}
                </div>
              ))}
              <div style={{ marginTop: 8 }}>
                {divergenciaAberta
                  ? <>Enquanto {nomeObra(t.obraOrigemId)} não decidir entre <strong>enviar o que faltou</strong> e{' '}
                      <strong>encerrar assumindo a falta</strong>, a transferência continua aberta —
                      mesmo que a nota fiscal já tenha sido confirmada.</>
                  : <>{t.encerramento?.por} encerrou o caso em {fmtDataHora(t.encerramento!.em)}.
                      {t.encerramento?.observacao && <> <em>{t.encerramento.observacao}</em></>}</>}
              </div>
            </Aviso>
          )}

          {/* -------- Dados obrigatórios da seção 8 -------- */}
          <div className="bloco mt-20">
            <div className="bloco__titulo">Dados da transferência</div>
            <div className="dados">
              <Dado icone={<Building2 size={12} />} rotulo="Obra de origem" valor={nomeObra(t.obraOrigemId)} />
              <Dado icone={<Building2 size={12} />} rotulo="Obra de destino" valor={nomeObra(t.obraDestinoId)} />
              <Dado icone={<User size={12} />} rotulo="Criada por" valor={`${t.criadaPor} · ${fmtData(t.criadaEm)}`} />
              <Dado
                icone={<ClipboardList size={12} />} rotulo="Entrada no fluxo"
                valor={t.entrada === 'requisicao'
                  ? `Requisição ${t.requisicaoCodigo ?? ''}`.trim()
                  : 'Saída direta do estoque'}
              />
              <Dado icone={<Check size={12} />} rotulo="Quem aprovou"
                valor={t.aprovadaPor ? `${t.aprovadaPor} · ${fmtData(t.aprovadaEm!)}` : (state.aprovacaoAtiva ? 'Ainda não aprovada' : 'Aprovação desligada')} />
              <Dado icone={<Calendar size={12} />} rotulo="Quando saiu" valor={t.dataSaida ? fmtData(t.dataSaida) : 'Ainda na obra de origem'} />
              <Dado icone={<CalendarClock size={12} />} rotulo="Previsão de chegada" valor={t.previsaoChegada ? fmtData(t.previsaoChegada) : '—'} />
              <Dado icone={<CalendarCheck size={12} />} rotulo="Quando chegou" valor={t.chegadaEm ? fmtDataHora(t.chegadaEm) : '—'} />
              <Dado icone={<Coins size={12} />} rotulo="Custo dos itens"
                valor={custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </div>
            {t.observacao && (
              <div className="mt-16">
                <div className="dado__rotulo"><PenLine size={12} /> Observação</div>
                <div className="dado__valor dado__valor--fraco">{t.observacao}</div>
              </div>
            )}
            {t.motivoReprovacao && (
              <div className="mt-16">
                <div className="dado__rotulo"><X size={12} /> Motivo da reprovação</div>
                <div className="dado__valor dado__valor--fraco">{t.motivoReprovacao}</div>
              </div>
            )}
          </div>

          {/* -------- Enviado × recebido -------- */}
          <div className="bloco">
            <div className="bloco__titulo">Itens e quantidades</div>
            <div className="tabela-wrap">
              <table className="comparacao">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th style={{ textAlign: 'right' }}>Enviado</th>
                    <th style={{ textAlign: 'right' }}>Recebido</th>
                  </tr>
                </thead>
                <tbody>
                  {t.itens.map((i) => {
                    const conferido = i.qtdRecebida !== null;
                    const ok = conferido && i.qtdRecebida === i.qtdEnviada;
                    return (
                      <tr key={i.insumoId}>
                        <td>
                          <div className="td-forte">{i.nome}</div>
                          <div className="txt-11 txt-muted" style={{ marginTop: 3 }}>
                            {i.codigo} · {i.tipo === 'avulso' ? 'avulsa' : 'pedido'} ·{' '}
                            {i.custoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/{i.unidade}
                          </div>
                          {i.linhaOrcamento && (
                            <div className="txt-11" style={{ marginTop: 4, color: 'var(--blue-fg)' }}>
                              <Wallet size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                              {linhaPorId(i.linhaOrcamento)?.codigo} — {linhaPorId(i.linhaOrcamento)?.nome}
                            </div>
                          )}
                          {i.motivoDivergencia && (
                            <div className="txt-11" style={{ marginTop: 5, color: 'var(--red-fg)' }}>{i.motivoDivergencia}</div>
                          )}
                        </td>
                        <td className="td-num comparacao__enviado">
                          {i.qtdEnviada.toLocaleString('pt-BR')} {i.unidade}
                        </td>
                        <td className={`td-num comparacao__recebido ${!conferido ? '' : ok ? 'comparacao__recebido--ok' : 'comparacao__recebido--dif'}`}>
                          {conferido ? `${i.qtdRecebida!.toLocaleString('pt-BR')} ${i.unidade}` : <span className="txt-muted">aguarda FVM</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* -------- Histórico -------- */}
          <div className="bloco">
            <div className="bloco__titulo">Histórico</div>
            <div className="timeline">
              {t.eventos.map((e) => <ItemTimeline key={e.id} e={e} />)}
            </div>
          </div>

          {t.avaliacao && (
            <div className="bloco">
              <div className="bloco__titulo">Avaliação de entrega</div>
              <div className="tabela-wrap">
                <table className="comparacao">
                  <tbody>
                    {Object.entries(t.avaliacao.respostas).map(([id, v]) => (
                      <tr key={id}>
                        <td className="td-forte">{nomeCriterio(id)}</td>
                        <td style={{ textAlign: 'right' }}>
                          {typeof v === 'number' ? (
                            <span className="estrelas">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <span key={n} className={`estrela ${v >= n ? 'estrela--on' : ''}`}>
                                  <Star size={15} fill={v >= n ? 'currentColor' : 'none'} />
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className={`badge ${v ? 'badge--vermelho' : 'badge--verde'}`}>{v ? 'Sim' : 'Não'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="txt-11 txt-muted mt-8">
                Fichas: {t.avaliacao.fichas.map((f) => FICHAS.find((x) => x.id === f)?.nome).filter(Boolean).join(' · ')}
                {' · '}avaliada por {t.avaliacao.avaliadaPor} em {fmtDataHora(t.avaliacao.avaliadaEm)}
              </div>
              {t.avaliacao.observacao && (
                <div className="timeline__detalhe mt-8">{t.avaliacao.observacao}</div>
              )}
              {t.avaliacao.anexos.length > 0 && (
                <div className="anexos">
                  {t.avaliacao.anexos.map((a) => (
                    <span className="anexo" key={a}><Paperclip size={12} /> {a}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {t.nf && (
            <div className="bloco">
              <div className="bloco__titulo">Nota fiscal</div>
              <div className="dados">
                <Dado icone={<FileText size={12} />} rotulo="Número da NF" valor={t.nf.numero} />
                <Dado icone={<Check size={12} />} rotulo="Confirmada por" valor={`${t.nf.confirmadaPor} · ${fmtData(t.nf.confirmadaEm)}`} />
              </div>
              <div className="anexos"><span className="anexo"><Paperclip size={12} /> {t.nf.anexo}</span></div>
            </div>
          )}

          {t.assinatura && (
            <div className="bloco">
              <div className="bloco__titulo">Assinatura da saída</div>
              <div className="assinatura">
                <img src={t.assinatura} alt="Assinatura" style={{ width: '100%', maxHeight: 110, objectFit: 'contain' }} />
              </div>
            </div>
          )}
        </div>

        {/* -------- Ações do papel ativo -------- */}
        <footer className="drawer__rodape">
          {acoes.length === 0 ? (
            <div className="txt-12 txt-muted" style={{ marginRight: 'auto' }}>
              {somenteLeitura
                ? 'Visão geral, só leitura. As ações ficam nos filtros por estado.'
                : STATUS_META[t.status].terminal
                  ? 'Transferência encerrada.'
                  : divergenciaAberta
                    ? `A divergência está com a obra de origem: só ela encerra o caso ou envia o saldo faltante. Nenhuma ação para ${ROLE_LABEL[state.papel]} aqui.`
                    : `Nenhuma ação para ${ROLE_LABEL[state.papel]} neste estado. Troque de papel na barra do topo.`}
            </div>
          ) : acoes.map((a) => {
            const classe = a.tom === 'primario' ? 'btn btn--primario' : a.tom === 'perigo' ? 'btn btn--perigo' : 'btn';
            const icone = a.id === 'despachar' ? <Truck size={15} />
              : a.id === 'registrar_chegada' ? <Package size={15} />
              : a.id === 'avaliar_entrega' ? <ClipboardCheck size={15} />
              : a.id === 'reenviar' ? <RotateCcw size={15} />
              : a.id === 'aprovar' ? <Check size={15} />
              : a.id === 'confirmar_nf' ? <FileText size={15} />
              : a.id === 'reprovar' || a.id === 'cancelar' ? <X size={15} />
              : <ArrowRight size={15} />;
            return (
              <button
                key={a.id} className={classe}
                onClick={() => {
                  switch (a.id) {
                    case 'aprovar': dispatch({ type: 'aprovar', id: t.id }); break;
                    case 'reprovar': setModal('reprovar'); break;
                    case 'despachar': setModal('despacho'); break;
                    case 'cancelar': setModal('cancelar'); break;
                    case 'registrar_chegada': setModal('chegada'); break;
                    case 'avaliar_entrega': setModal('fvm'); break;
                    case 'confirmar_nf': setModal('nf'); break;
                    case 'reenviar': dispatch({ type: 'reenviar', id: t.id }); break;
                    case 'encerrar_divergencia': setModal('encerrar'); break;
                  }
                }}
              >
                {icone} {a.label}{a.v1 ? ' (V1)' : ''}
              </button>
            );
          })}
        </footer>
      </aside>

      {modal === 'reprovar' && <ReprovarModal t={t} onFechar={() => setModal(null)} />}
      {modal === 'despacho' && <DespachoModal t={t} onFechar={() => setModal(null)} />}
      {modal === 'cancelar' && <CancelarModal t={t} onFechar={() => setModal(null)} />}
      {modal === 'fvm' && <FvmModal t={t} onFechar={() => setModal(null)} />}
      {modal === 'nf' && <NfModal t={t} onFechar={() => setModal(null)} />}
      {modal === 'encerrar' && <EncerrarDivergenciaModal t={t} onFechar={() => setModal(null)} />}
      {modal === 'chegada' && (
        <ChegadaModal
          t={t} onFechar={() => setModal(null)}
          // Alegar o recebimento emenda direto na conferência: o material
          // está no pátio agora. Quem não fizer aqui reencontra a
          // transferência no card "FVM pendente".
          onSeguirParaFvm={() => setModal('fvm')}
        />
      )}
    </>
  );
}

/* ---------------- Sub-componentes --------------------------- */

function Dado({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div>
      <div className="dado__rotulo">{icone} {rotulo}</div>
      <div className="dado__valor">{valor}</div>
    </div>
  );
}

function Stepper({ t }: { t: Transferencia }) {
  const { state } = useStore();
  const passos = trilha(state.aprovacaoAtiva);
  const atual = indiceNaTrilha(t.status, state.aprovacaoAtiva);
  const encerradoMal = t.status === 'reprovado' || t.status === 'cancelado';
  const divergente = t.status === 'recebido_divergencia' || t.status === 'encerrado_divergencia';

  if (encerradoMal) {
    return (
      <Aviso tom="atencao" titulo={STATUS_META[t.status].label}>
        {STATUS_META[t.status].descricao}
      </Aviso>
    );
  }

  return (
    <div className="stepper">
      {passos.map((p, i) => {
        const feita = i < atual;
        const eAtual = i === atual;
        const ultimo = i === passos.length - 1;
        const erro = divergente && ultimo;
        return (
          <div className="stepper__passo" key={p}>
            {!ultimo && <span className={`stepper__linha ${feita ? 'stepper__linha--feita' : ''}`} />}
            <span className={`stepper__bola ${erro ? 'stepper__bola--erro' : feita ? 'stepper__bola--feita' : eAtual ? 'stepper__bola--atual' : ''}`}>
              {erro ? '!' : feita ? <Check size={12} /> : i + 1}
            </span>
            <span className={`stepper__rotulo ${eAtual ? 'stepper__rotulo--atual' : ''}`}>
              {erro ? 'Com divergência' : STATUS_META[p].passo ?? STATUS_META[p].curto}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const ICONE_EVENTO: Record<string, React.ReactNode> = {
  criada: <Package size={11} />,
  enviada_aprovacao: <ArrowRight size={11} />,
  aprovada: <Check size={11} color="var(--green-fg)" />,
  reprovada: <X size={11} color="var(--red-fg)" />,
  despachada: <Truck size={11} color="var(--cyan-fg)" />,
  chegada_registrada: <Package size={11} color="var(--cyan-fg)" />,
  recebida_ok: <Check size={11} color="var(--green-fg)" />,
  recebida_divergencia: <X size={11} color="var(--red-fg)" />,
  divergencia_encerrada: <AlertTriangle size={11} color="var(--red-fg)" />,
  cancelada: <X size={11} />,
  reenviada: <RotateCcw size={11} color="var(--purple-fg)" />,
};

const TITULO_EVENTO: Record<string, string> = {
  criada: 'Transferência criada — quantidade reservada',
  enviada_aprovacao: 'Enviada para aprovação',
  aprovada: 'Aprovada',
  reprovada: 'Reprovada',
  despachada: 'Despachada — material saiu da obra',
  chegada_registrada: 'Chegada registrada',
  recebida_ok: 'Recebida sem divergência',
  recebida_divergencia: 'Recebida com divergência',
  divergencia_encerrada: 'Divergência encerrada pela origem',
  cancelada: 'Cancelada',
  reenviada: 'Reenviada — voltou para Reservado',
};

function ItemTimeline({ e }: { e: TransferEvento }) {
  return (
    <div className="timeline__item">
      <span className="timeline__bola">{ICONE_EVENTO[e.tipo]}</span>
      <div>
        <div className="timeline__titulo">{TITULO_EVENTO[e.tipo] ?? e.tipo}</div>
        <div className="timeline__meta">
          {fmtDataHora(e.em)} · {e.porNome} · {e.obra}
        </div>
        {e.detalhe && <div className="timeline__detalhe">{e.detalhe}</div>}
      </div>
    </div>
  );
}
