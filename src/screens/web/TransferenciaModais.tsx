import { Fragment, useMemo, useState } from 'react';
import { Check, X, Truck, AlertTriangle, Package, ClipboardCheck } from 'lucide-react';
import { Modal, Rotulo, Aviso, BadgeStatus } from '../../components/ui';
import { useStore } from '../../state/store';
import { nomeObra } from '../../data/obras';
import { fmtData } from '../../domain/notificacoes';
import type { Transferencia } from '../../domain/types';

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
  const [previsao, setPrevisao] = useState(padrao);

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
              dispatch({ type: 'despachar', id: t.id, previsaoChegada: new Date(`${previsao}T08:00:00`).toISOString() });
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

      <div className="campo">
        <Rotulo obrigatorio ajuda="O trânsito real leva de 3 a 7 dias. A obra de destino é notificada com esta data.">
          Previsão de chegada
        </Rotulo>
        <input className="input" type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} />
      </div>
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
   Avaliação de entrega (FVM) — enviado × recebido
   Padrão herdado do modal "Detalhes do Pedido" (Qtd. Pedido ×
   Qtd. Recebida), agora aplicado a transferências.
   ============================================================ */
export function FvmModal({ t, onFechar }: { t: Transferencia; onFechar: () => void }) {
  const { dispatch } = useStore();
  const [recebidos, setRecebidos] = useState<Record<string, string>>(
    () => Object.fromEntries(t.itens.map((i) => [i.insumoId, String(i.qtdEnviada)])),
  );
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  const linhas = t.itens.map((it) => {
    const rec = Number(recebidos[it.insumoId] ?? it.qtdEnviada);
    return { it, rec, delta: rec - it.qtdEnviada };
  });
  const temDivergencia = linhas.some((l) => l.delta !== 0);
  const faltaMotivo = linhas.some((l) => l.delta !== 0 && !(motivos[l.it.insumoId] ?? '').trim());

  const totalEnviado = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const totalRecebido = linhas.reduce((s, l) => s + l.rec * l.it.custoUnitario, 0);

  return (
    <Modal
      titulo={<span><ClipboardCheck size={17} style={{ verticalAlign: -3, marginRight: 7 }} />Avaliação de entrega — {t.codigo}</span>}
      sub={`${nomeObra(t.obraOrigemId)} → ${nomeObra(t.obraDestinoId)} · despachada em ${t.despachadaEm ? fmtData(t.despachadaEm) : '—'}`}
      largura="medio" onFechar={onFechar}
      rodapeEsquerda={
        <div className="txt-12 txt-muted">
          Valor enviado <strong style={{ color: 'var(--text)' }}>{totalEnviado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          {' · '}recebido{' '}
          <strong style={{ color: totalRecebido === totalEnviado ? 'var(--green-fg)' : 'var(--red-fg)' }}>
            {totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </strong>
        </div>
      }
      rodape={
        <>
          <button className="btn" onClick={onFechar}>Cancelar</button>
          <button
            className={temDivergencia ? 'btn btn--perigo' : 'btn btn--primario'}
            disabled={faltaMotivo}
            title={faltaMotivo ? 'Descreva o motivo de cada divergência' : undefined}
            onClick={() => {
              dispatch({
                type: 'confirmar_recebimento', id: t.id,
                recebidos: Object.fromEntries(linhas.map((l) => [l.it.insumoId, l.rec])),
                motivos,
              });
              onFechar();
            }}
          >
            {temDivergencia ? <><AlertTriangle size={15} /> Registrar divergência</> : <><Check size={15} /> Confirmar Entrega</>}
          </button>
        </>
      }
    >
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
          Descreva o motivo de cada item divergente para registrar a avaliação.
        </div>
      )}
      <div style={{ height: 6 }} />
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
