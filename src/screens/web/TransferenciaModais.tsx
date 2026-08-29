import { Fragment, useMemo, useState } from 'react';
import {
  Check, X, Truck, AlertTriangle, Package, ClipboardCheck, Star, ChevronRight,
  Paperclip, FileText, ChevronLeft,
} from 'lucide-react';
import { Modal, Rotulo, Aviso, BadgeStatus } from '../../components/ui';
import { linhaPorId } from '../../data/orcamento';
import { useStore, USUARIO_POR_PAPEL } from '../../state/store';
import { nomeObra } from '../../data/obras';
import { fmtData } from '../../domain/notificacoes';
import type { AvaliacaoEntrega, RespostaCriterio, Transferencia } from '../../domain/types';
import { FICHAS, criteriosDasFichas } from '../../data/avaliacao';

/* ============================================================
   Reprovar — exige motivo
   ============================================================ */
export function ReprovarModal({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState(false);

  return (
    <Modal
      titulo={`Reprovar ${t.codigo}`}
      sub={`${nomeObra(t.obraOrigemId)} → ${nomeObra(t.obraDestinoId)}`}
      largura="estreito" onFechar={onFechar}
      rodape={
        <>
          <button className="btn" onClick={onFechar}>Voltar</button>
          <button
            className="btn btn--perigo"
            onClick={() => {
              if (!motivo.trim()) { setErro(true); return; }
              dispatch({ type: 'reprovar', id: t.id, motivo });
              onFechar();
            }}
          >
            <X size={15} /> Reprovar transferência
          </button>
        </>
      }
    >
      <Aviso tom="atencao">
        Nada foi movimentado ainda. Ao reprovar, a quantidade reservada volta imediatamente ao
        disponível de <strong>{nomeObra(t.obraOrigemId)}</strong>, e só a obra de origem é notificada.
      </Aviso>
      <div className="campo">
        <Rotulo obrigatorio ajuda="Fica registrado no histórico da transferência.">Motivo da reprovação</Rotulo>
        <textarea
          className={`textarea ${erro ? 'textarea--erro' : ''}`}
          placeholder="Ex.: a obra já recebeu carga equivalente no pedido 800075."
          value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(false); }}
        />
        {erro && <div className="campo__erro">Informe o motivo da reprovação.</div>}
      </div>
      <div style={{ height: 4 }} />
    </Modal>
  );
}

/* ============================================================
   Registrar despacho — captura "quando saiu" e "previsão de chegada"
   ============================================================ */
export function DespachoModal({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const padrao = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4); // trânsito típico de 3 a 7 dias
    return d.toISOString().slice(0, 10);
  }, []);
  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [saida, setSaida] = useState(hoje);
  const [previsao, setPrevisao] = useState(padrao);
  const [erro, setErro] = useState('');

  return (
    <Modal
      titulo={`Registrar despacho — ${t.codigo}`}
      sub={`${nomeObra(t.obraOrigemId)} → ${nomeObra(t.obraDestinoId)}`}
      largura="estreito" onFechar={onFechar}
      rodape={
        <>
          <button className="btn" onClick={onFechar}>Cancelar</button>
          <button
            className="btn btn--primario"
            onClick={() => {
              if (new Date(previsao) < new Date(saida)) {
                setErro('A previsão de chegada não pode ser anterior à data de saída.');
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
            <Truck size={15} /> Confirmar despacho
          </button>
        </>
      }
    >
      <Aviso tom="info" titulo="É aqui que o material sai do saldo">
        Até agora a quantidade estava apenas reservada. Ao confirmar o despacho, ela sai do estoque de
        <strong> {nomeObra(t.obraOrigemId)}</strong> e passa a contar como <strong>Em trânsito</strong>.
        Depois disso não há cancelamento.
      </Aviso>

      <div className="bloco mt-20">
        <div className="bloco__titulo">Itens que saem agora</div>
        {t.itens.map((it) => (
          <div className="painel__item" key={it.insumoId}>
            <div>
              <div className="painel__nome">{it.nome}</div>
              <div className="painel__meta">{it.codigo} · {it.tipo === 'avulso' ? 'avulsa' : 'pedido'}</div>
            </div>
            <div className="forte nowrap">{it.qtdEnviada.toLocaleString('pt-BR')} {it.unidade}</div>
          </div>
        ))}
      </div>

      <div className="campo-linha">
        <div>
          <Rotulo obrigatorio ajuda="Data efetiva em que o material saiu da obra de origem.">
            Data de saída
          </Rotulo>
          <input className="input" type="date" value={saida}
            onChange={(e) => { setSaida(e.target.value); setErro(''); }} />
        </div>
        <div>
          <Rotulo obrigatorio ajuda="O trânsito real leva de 3 a 7 dias. A obra de destino é notificada com esta data.">
            Previsão de chegada
          </Rotulo>
          <input className="input" type="date" value={previsao}
            onChange={(e) => { setPrevisao(e.target.value); setErro(''); }} />
        </div>
      </div>
      {erro && <div className="campo__erro">{erro}</div>}
      <div style={{ height: 4 }} />
    </Modal>
  );
}

/* ============================================================
   Cancelar — só antes do despacho
   ============================================================ */
export function CancelarModal({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const [motivo, setMotivo] = useState('');
  return (
    <Modal
      titulo={`Cancelar ${t.codigo}`} largura="estreito" onFechar={onFechar}
      rodape={
        <>
          <button className="btn" onClick={onFechar}>Voltar</button>
          <button
            className="btn btn--perigo"
            onClick={() => { dispatch({ type: 'cancelar', id: t.id, motivo }); onFechar(); }}
          >
            <X size={15} /> Cancelar transferência
          </button>
        </>
      }
    >
      <Aviso tom="atencao" titulo="Ainda dá tempo">
        O material não foi despachado, então o cancelamento é possível. A quantidade volta ao disponível
        de {nomeObra(t.obraOrigemId)}.
      </Aviso>
      <div className="campo">
        <Rotulo ajuda="Opcional, mas fica no histórico.">Motivo</Rotulo>
        <textarea className="textarea" placeholder="Ex.: a própria obra passou a precisar do material."
          value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </div>
      <div style={{ height: 4 }} />
    </Modal>
  );
}

/* ============================================================
   Confirmação simples de chegada
   ============================================================ */
export function ChegadaModal({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  return (
    <Modal
      titulo={`Registrar chegada — ${t.codigo}`} largura="estreito" onFechar={onFechar}
      rodape={
        <>
          <button className="btn" onClick={onFechar}>Voltar</button>
          <button className="btn btn--primario" onClick={() => { dispatch({ type: 'registrar_chegada', id: t.id }); onFechar(); }}>
            <Package size={15} /> Material chegou
          </button>
        </>
      }
    >
      <div className="linha" style={{ gap: 10, marginBottom: 4 }}>
        <BadgeStatus status={t.status} />
        <span className="txt-12 txt-muted">
          Previsão: {t.previsaoChegada ? fmtData(t.previsaoChegada) : '—'}
        </span>
      </div>
      <Aviso tom="info">
        Registrar a chegada abre a <strong>Avaliação de entrega (FVM)</strong>. A conferência de
        quantidade é obrigatória — é ela que captura o "saíram 10, chegaram 8".
      </Aviso>
      <div style={{ height: 4 }} />
    </Modal>
  );
}

/* ============================================================
   Avaliação de entrega (FVM) — duas etapas.

   1. Conferência de quantidade: enviado × recebido. Sempre
      obrigatória — é ela que captura o "saem 10, chegam 8".
   2. Avaliação por critérios: as fichas são configuradas pelo
      cliente, então só travam a conclusão quando existem.

   A comparação lado a lado reaproveita o padrão que já existe
   no modal "Detalhes do Pedido" dos pedidos de compra.
   ============================================================ */
export function FvmModal({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const [passo, setPasso] = useState<0 | 1>(0);

  const [recebidos, setRecebidos] = useState<Record<string, string>>(
    () => Object.fromEntries(t.itens.map((i) => [i.insumoId, String(i.qtdEnviada)])),
  );
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  const [fichas, setFichas] = useState<string[]>(FICHAS.map((f) => f.id));
  const [respostas, setRespostas] = useState<Record<string, RespostaCriterio>>({});
  const [observacao, setObservacao] = useState('');
  const [anexos, setAnexos] = useState<string[]>([]);

  const linhas = t.itens.map((it) => {
    const rec = Number(recebidos[it.insumoId] ?? it.qtdEnviada);
    return { it, rec, delta: rec - it.qtdEnviada };
  });
  const temDivergencia = linhas.some((l) => l.delta !== 0);
  const faltaMotivo = linhas.some((l) => l.delta !== 0 && !(motivos[l.it.insumoId] ?? '').trim());

  const criterios = criteriosDasFichas(fichas);
  const respondidos = criterios.filter((c) => respostas[c.id] !== undefined).length;
  const faltaAvaliar = criterios.length > 0 && respondidos < criterios.length;

  const totalEnviado = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const totalRecebido = linhas.reduce((s, l) => s + l.rec * l.it.custoUnitario, 0);

  function concluir() {
    const avaliacao: AvaliacaoEntrega | undefined = criterios.length > 0
      ? {
        fichas, respostas, observacao, anexos,
        avaliadaPor: USUARIO_POR_PAPEL.destino, avaliadaEm: new Date().toISOString(),
      }
      : undefined;
    dispatch({
      type: 'confirmar_recebimento', id: t.id,
      recebidos: Object.fromEntries(linhas.map((l) => [l.it.insumoId, l.rec])),
      motivos, avaliacao,
    });
    onFechar();
  }

  return (
    <Modal
      titulo={
        <span>
          <ClipboardCheck size={17} style={{ verticalAlign: -3, marginRight: 7 }} />
          Avaliação de entrega — {t.codigo}
        </span>
      }
      sub={`${nomeObra(t.obraOrigemId)} → ${nomeObra(t.obraDestinoId)} · ${passo === 0 ? 'passo 1 de 2 · conferência de quantidade' : 'passo 2 de 2 · avaliação da entrega'}`}
      largura="medio" onFechar={onFechar}
      rodapeEsquerda={
        passo === 0 ? (
          <div className="txt-12 txt-muted">
            Valor enviado <strong style={{ color: 'var(--text)' }}>{totalEnviado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            {' · '}recebido{' '}
            <strong style={{ color: totalRecebido === totalEnviado ? 'var(--green-fg)' : 'var(--red-fg)' }}>
              {totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </strong>
          </div>
        ) : (
          <div className="txt-12 txt-muted">
            {criterios.length === 0
              ? 'Nenhuma ficha selecionada — a avaliação por critérios é opcional.'
              : `${respondidos} de ${criterios.length} critérios avaliados`}
          </div>
        )
      }
      rodape={
        passo === 0 ? (
          <>
            <button className="btn" onClick={onFechar}>Cancelar</button>
            <button
              className={temDivergencia ? 'btn btn--perigo' : 'btn btn--primario'}
              disabled={faltaMotivo}
              title={faltaMotivo ? 'Descreva o motivo de cada divergência' : undefined}
              onClick={() => setPasso(1)}
            >
              {temDivergencia ? <><AlertTriangle size={15} /> Continuar com divergência</> : <>Continuar <ChevronRight size={15} /></>}
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={() => setPasso(0)}><ChevronLeft size={15} /> Voltar</button>
            <button
              className={temDivergencia ? 'btn btn--perigo' : 'btn btn--primario'}
              disabled={faltaAvaliar}
              title={faltaAvaliar ? 'Avalie todos os critérios para continuar' : undefined}
              onClick={concluir}
            >
              {temDivergencia
                ? <><AlertTriangle size={15} /> Registrar divergência</>
                : <><Check size={15} /> Confirmar Entrega</>}
            </button>
          </>
        )
      }
    >
      {passo === 0 ? (
        <>
          <Aviso tom={temDivergencia ? 'perigo' : 'info'} titulo={temDivergencia ? 'Recebimento com divergência' : 'Confira o que chegou'}>
            {temDivergencia
              ? 'A quantidade recebida não bate com a enviada. Ao registrar, origem, Aprovador e obra de destino são notificados — é o único evento com notificação tripla no fluxo.'
              : 'A conferência de quantidade é obrigatória: é ela que captura perdas no trajeto. Ajuste as quantidades recebidas se algo não chegou.'}
          </Aviso>

          <div className="tabela-wrap mt-16">
            <table className="comparacao">
              <thead>
                <tr>
                  <th>Material</th>
                  <th style={{ textAlign: 'right' }}>Qtd. enviada</th>
                  <th style={{ textAlign: 'right' }}>Qtd. recebida</th>
                  <th style={{ textAlign: 'right' }}>Vlr. unitário</th>
                  <th style={{ textAlign: 'right' }}>Diferença</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ it, delta }) => (
                  <Fragment key={it.insumoId}>
                    <tr>
                      <td>
                        <div className="td-forte">{it.nome}</div>
                        <div className="txt-11 txt-muted" style={{ marginTop: 3 }}>
                          {it.codigo} · {it.tipo === 'avulso' ? 'avulsa' : 'pedido'}
                          {it.linhaOrcamento && ` · ${linhaPorId(it.linhaOrcamento)?.codigo ?? ''}`}
                        </div>
                      </td>
                      <td className="td-num comparacao__enviado">{it.qtdEnviada.toLocaleString('pt-BR')} {it.unidade}</td>
                      <td className="td-num">
                        <input
                          className="input input-qtd" type="number" min={0} max={it.qtdEnviada}
                          value={recebidos[it.insumoId] ?? ''}
                          onChange={(e) => setRecebidos((r) => ({ ...r, [it.insumoId]: e.target.value }))}
                        />
                        <div className="txt-11 txt-muted" style={{ marginTop: 4 }}>{it.unidade}</div>
                      </td>
                      <td className="td-num txt-muted">
                        {it.custoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="td-num">
                        <span className={`delta ${delta === 0 ? 'delta--zero' : delta < 0 ? 'delta--neg' : 'delta--pos'}`}>
                          {delta === 0 ? 'sem divergência' : `${delta > 0 ? '+' : ''}${delta.toLocaleString('pt-BR')} ${it.unidade}`}
                        </span>
                        {delta !== 0 && (
                          <div className="txt-11 txt-muted" style={{ marginTop: 3 }}>
                            {Math.abs(delta * it.custoUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </div>
                        )}
                      </td>
                    </tr>
                    {delta !== 0 && (
                      <tr className="linha-motivo">
                        <td colSpan={5} style={{ paddingTop: 0 }}>
                          <input
                            className="input"
                            placeholder="Motivo da divergência (obrigatório) — ex.: sacos rasgados, 40 kg perdidos no trajeto."
                            value={motivos[it.insumoId] ?? ''}
                            onChange={(e) => setMotivos((m) => ({ ...m, [it.insumoId]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {faltaMotivo && (
            <div className="campo__erro" style={{ marginTop: 10 }}>
              Descreva o motivo de cada item divergente para continuar.
            </div>
          )}
          <div style={{ height: 6 }} />
        </>
      ) : (
        <FormAvaliacao
          fichas={fichas} setFichas={setFichas}
          respostas={respostas} setRespostas={setRespostas}
          observacao={observacao} setObservacao={setObservacao}
          anexos={anexos} setAnexos={setAnexos}
          faltaAvaliar={faltaAvaliar}
        />
      )}
    </Modal>
  );
}

/* ---------------- Formulário de critérios --------------------- */
export function FormAvaliacao({
  fichas, setFichas, respostas, setRespostas,
  observacao, setObservacao, anexos, setAnexos, faltaAvaliar,
}: {
  fichas: string[];
  setFichas: (v: string[]) => void;
  respostas: Record<string, RespostaCriterio>;
  setRespostas: React.Dispatch<React.SetStateAction<Record<string, RespostaCriterio>>>;
  observacao: string;
  setObservacao: (v: string) => void;
  anexos: string[];
  setAnexos: React.Dispatch<React.SetStateAction<string[]>>;
  faltaAvaliar: boolean;
}) {
  const criterios = criteriosDasFichas(fichas);
  const respondidos = criterios.filter((c) => respostas[c.id] !== undefined).length;

  return (
    <>
      <div className="campo" style={{ marginTop: 4 }}>
        <Rotulo ajuda="Cada ficha acrescenta critérios à avaliação. Quais fichas existem é configuração do cliente.">
          Fichas de avaliação
        </Rotulo>
        <div className="fichas">
          {FICHAS.map((f) => {
            const on = fichas.includes(f.id);
            return (
              <button
                key={f.id} type="button" className={`ficha ${on ? 'ficha--on' : ''}`}
                onClick={() => setFichas(on ? fichas.filter((x) => x !== f.id) : [...fichas, f.id])}
              >
                <span className="ficha__box">{on && <Check size={13} />}</span>
                <span>
                  <strong>{f.nome}</strong>
                  <em>{f.criterios.length} critérios</em>
                </span>
              </button>
            );
          })}
        </div>
        <div className="campo__dica">{fichas.length} ficha(s) selecionada(s)</div>
      </div>

      {criterios.length > 0 && (
        <div className="bloco mt-20">
          <div className="linha linha--entre" style={{ marginBottom: 10 }}>
            <div className="bloco__titulo" style={{ margin: 0 }}>Critérios de avaliação</div>
            <span className="txt-12 txt-muted">{respondidos} de {criterios.length} avaliados</span>
          </div>
          <div className="tabela-wrap">
            <table className="comparacao">
              <thead>
                <tr>
                  <th>Critério</th>
                  <th style={{ textAlign: 'right' }}>Avaliação</th>
                </tr>
              </thead>
              <tbody>
                {criterios.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="td-forte">{c.nome}</div>
                      <div className="txt-11 txt-muted" style={{ marginTop: 3 }}>{c.ajuda}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {c.tipo === 'estrelas' ? (
                        <div className="estrelas">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n} type="button"
                              className={`estrela ${Number(respostas[c.id] ?? 0) >= n ? 'estrela--on' : ''}`}
                              onClick={() => setRespostas((r) => ({ ...r, [c.id]: n }))}
                              aria-label={`${n} de 5`}
                            >
                              <Star size={19} fill={Number(respostas[c.id] ?? 0) >= n ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="linha linha--fim" style={{ gap: 6 }}>
                          <button
                            type="button"
                            className={`btn btn--sm ${respostas[c.id] === true ? 'btn--confirmar' : ''}`}
                            onClick={() => setRespostas((r) => ({ ...r, [c.id]: true }))}
                          >
                            <Check size={13} /> Sim
                          </button>
                          <button
                            type="button"
                            className={`btn btn--sm ${respostas[c.id] === false ? 'btn--confirmar' : ''}`}
                            onClick={() => setRespostas((r) => ({ ...r, [c.id]: false }))}
                          >
                            <X size={13} /> Não
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="campo">
        <Rotulo ajuda="Fica registrada no histórico da transferência.">Observação</Rotulo>
        <textarea className="textarea" placeholder="Digite aqui..."
          value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </div>

      <div className="campo">
        <Rotulo ajuda="Fotos da carga, canhoto, laudo. Máximo 10MB por arquivo.">
          Anexos <span className="txt-11 txt-muted">(Máximo 10MB)</span>
        </Rotulo>
        <button
          type="button" className="anexar"
          onClick={() => setAnexos((a) => [...a, `foto-descarga-${a.length + 1}.jpg`])}
        >
          <Paperclip size={15} /> Anexar arquivos
        </button>
        {anexos.length > 0 && (
          <div className="anexos">
            {anexos.map((a, i) => (
              <span className="anexo" key={a}>
                <FileText size={13} /> {a}
                <button type="button" onClick={() => setAnexos((v) => v.filter((_, k) => k !== i))} aria-label="Remover">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {faltaAvaliar && (
        <div className="campo__erro" style={{ marginTop: 4 }}>
          Avalie todos os critérios para continuar.
        </div>
      )}
      <div style={{ height: 6 }} />
    </>
  );
}

/* ============================================================
   Confirmação da nota fiscal
   ============================================================ */
export function NfModal({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const [numero, setNumero] = useState('');
  const [anexo, setAnexo] = useState('');
  const [erro, setErro] = useState(false);

  const divergente = t.itens.some((i) => i.qtdRecebida !== null && i.qtdRecebida !== i.qtdEnviada);

  return (
    <Modal
      titulo={`Confirmar NF — ${t.codigo}`}
      sub={`${nomeObra(t.obraOrigemId)} → ${nomeObra(t.obraDestinoId)} · material já conferido e no estoque`}
      largura="estreito" onFechar={onFechar}
      rodape={
        <>
          <button className="btn" onClick={onFechar}>Cancelar</button>
          <button
            className="btn btn--primario"
            onClick={() => {
              if (!numero.trim() || !anexo) { setErro(true); return; }
              dispatch({ type: 'confirmar_nf', id: t.id, numero: numero.trim(), anexo });
              onFechar();
            }}
          >
            <Check size={15} /> Confirmar recebimento da NF
          </button>
        </>
      }
    >
      <Aviso tom={divergente ? 'atencao' : 'info'}>
        {divergente
          ? 'A conferência registrou divergência. A NF encerra a transferência, e a diferença fica registrada para auditoria.'
          : 'A conferência fechou sem divergência. Confirmar a NF encerra a transferência.'}
      </Aviso>

      <div className="campo">
        <Rotulo obrigatorio ajuda="Número da nota fiscal de transferência emitida pela obra de origem.">
          Número da NF
        </Rotulo>
        <input
          className={`input ${erro && !numero.trim() ? 'input--erro' : ''}`}
          placeholder="Ex.: 000.412.889"
          value={numero} onChange={(e) => { setNumero(e.target.value); setErro(false); }}
        />
      </div>

      <div className="campo">
        <Rotulo obrigatorio ajuda="PDF ou XML da nota. Máximo 10MB.">
          Anexo da NF <span className="txt-11 txt-muted">(Máximo 10MB)</span>
        </Rotulo>
        {anexo ? (
          <div className="anexos">
            <span className="anexo">
              <FileText size={13} /> {anexo}
              <button type="button" onClick={() => setAnexo('')} aria-label="Remover"><X size={12} /></button>
            </span>
          </div>
        ) : (
          <button
            type="button" className={`anexar ${erro ? 'anexar--erro' : ''}`}
            onClick={() => setAnexo(`nf-${t.codigo.toLowerCase()}.pdf`)}
          >
            <Paperclip size={15} /> Anexar a nota fiscal
          </button>
        )}
      </div>

      {erro && <div className="campo__erro">Informe o número da NF e anexe o arquivo.</div>}
      <div style={{ height: 4 }} />
    </Modal>
  );
}
