import { useState } from 'react';
import { Check, AlertTriangle, Minus, Plus, ClipboardCheck } from 'lucide-react';
import { useStore } from '../../state/store';
import { nomeObra } from '../../data/obras';
import { fmtData } from '../../domain/notificacoes';
import type { Transferencia } from '../../domain/types';
import { MobTop, MobAviso, brl, num } from './comuns';

/* ============================================================
   Avaliação de entrega (FVM) — a conferência no canteiro.
   "Chegou tudo certo" resolve o caso comum em um toque; a
   divergência só aparece quando alguma quantidade muda.
   ============================================================ */
export function TelaFvm({
  t, onVoltar, onPronto,
}: { t: Transferencia; onVoltar: () => void; onPronto: (divergente: boolean) => void }) {
  const { dispatch } = useStore();
  const [recebidos, setRecebidos] = useState<Record<string, number>>(
    () => Object.fromEntries(t.itens.map((i) => [i.insumoId, i.qtdEnviada])),
  );
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [mexeu, setMexeu] = useState(false);

  const divergentes = t.itens.filter((i) => recebidos[i.insumoId] !== i.qtdEnviada);
  const temDivergencia = divergentes.length > 0;
  const faltaMotivo = divergentes.some((i) => !(motivos[i.insumoId] ?? '').trim());

  const enviado = t.itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);
  const recebido = t.itens.reduce((s, i) => s + (recebidos[i.insumoId] ?? 0) * i.custoUnitario, 0);

  function confirmar(tudoCerto: boolean) {
    const r = tudoCerto
      ? Object.fromEntries(t.itens.map((i) => [i.insumoId, i.qtdEnviada]))
      : recebidos;
    dispatch({ type: 'confirmar_recebimento', id: t.id, recebidos: r, motivos: tudoCerto ? {} : motivos });
    onPronto(tudoCerto ? false : temDivergencia);
  }

  return (
    <>
      <MobTop
        eyebrow={`${t.codigo} · de ${nomeObra(t.obraOrigemId)}`}
        titulo="Conferir o que chegou"
        onVoltar={onVoltar}
      />

      <div className="mob-corpo">
        <div className="mob-pad">
          {!mexeu && (
            <>
              <button
                className="mob-btn mob-btn--primario"
                style={{ minHeight: 62, fontSize: 17, marginBottom: 14 }}
                onClick={() => confirmar(true)}
              >
                <Check size={22} /> Chegou tudo certo
              </button>
              <p className="mob-dica" style={{ textAlign: 'center', marginTop: -6, marginBottom: 16 }}>
                Um toque resolve o caso comum. Se faltou alguma coisa, ajuste abaixo.
              </p>
            </>
          )}

          {temDivergencia && (
            <MobAviso tom="perigo" titulo="Recebimento com divergência">
              Ao registrar, origem, Aprovador e obra de destino são notificados — é o único evento
              com notificação tripla no fluxo.
            </MobAviso>
          )}

          {t.itens.map((i) => {
            const rec = recebidos[i.insumoId];
            const dif = rec !== i.qtdEnviada;
            const set = (v: number) => {
              setMexeu(true);
              setRecebidos((r) => ({ ...r, [i.insumoId]: Math.max(0, Math.min(i.qtdEnviada, v)) }));
            };
            return (
              <div className="mob-item" key={i.insumoId}>
                <div className="mob-item__nome">{i.nome}</div>
                <div className="mob-item__meta">
                  {i.codigo} · {i.tipo === 'avulso' ? 'avulsa' : 'pedido'}
                </div>

                <div className="mob-item__par">
                  <div className="mob-item__qtd">
                    <span>Saiu da origem</span>
                    <b>{num(i.qtdEnviada)} {i.unidade}</b>
                  </div>
                  <div className={`mob-item__qtd ${dif ? 'mob-item__qtd--dif' : 'mob-item__qtd--ok'}`}>
                    <span>Chegou</span>
                    <b>{num(rec)} {i.unidade}</b>
                  </div>
                </div>

                <div className={`mob-cont ${dif ? 'mob-cont--dif' : ''}`}>
                  <button onClick={() => set(rec - 1)} aria-label="Diminuir"><Minus size={22} /></button>
                  <input
                    type="number" inputMode="numeric" value={rec}
                    onChange={(e) => set(Number(e.target.value))}
                  />
                  <button onClick={() => set(rec + 1)} aria-label="Aumentar"><Plus size={22} /></button>
                </div>

                {dif ? (
                  <>
                    <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 7, color: 'var(--red-fg)', fontSize: 13.5, fontWeight: 700 }}>
                      <AlertTriangle size={16} />
                      Faltam {num(i.qtdEnviada - rec)} {i.unidade} · {brl((i.qtdEnviada - rec) * i.custoUnitario)}
                    </div>
                    <textarea
                      className="mob-textarea" style={{ marginTop: 10, minHeight: 74 }}
                      placeholder="O que aconteceu? (obrigatório)"
                      value={motivos[i.insumoId] ?? ''}
                      onChange={(e) => setMotivos((m) => ({ ...m, [i.insumoId]: e.target.value }))}
                    />
                  </>
                ) : (
                  <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 7, color: 'var(--green-fg)', fontSize: 13.5, fontWeight: 700 }}>
                    <Check size={16} /> Bateu com o enviado
                  </div>
                )}
              </div>
            );
          })}

          <div className="mob-cartao">
            <div className="mob-linha">
              <span className="mob-linha__r">Valor enviado</span>
              <span className="mob-linha__v">{brl(enviado)}</span>
            </div>
            <div className="mob-linha">
              <span className="mob-linha__r">Valor recebido</span>
              <span className="mob-linha__v" style={{ color: recebido === enviado ? 'var(--green-fg)' : 'var(--red-fg)' }}>
                {brl(recebido)}
              </span>
            </div>
            <div className="mob-linha">
              <span className="mob-linha__r">Despachada em</span>
              <span className="mob-linha__v">{t.despachadaEm ? fmtData(t.despachadaEm) : '—'}</span>
            </div>
          </div>

          <p className="mob-dica" style={{ marginTop: 14 }}>
            A conferência de quantidade é obrigatória: não existe caminho que pule a Avaliação de entrega.
          </p>
        </div>
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button
          className={temDivergencia ? 'mob-btn mob-btn--perigo' : 'mob-btn mob-btn--primario'}
          disabled={faltaMotivo}
          onClick={() => confirmar(false)}
        >
          {temDivergencia
            ? <><AlertTriangle size={20} /> Registrar divergência</>
            : <><ClipboardCheck size={20} /> Confirmar entrega</>}
        </button>
        {faltaMotivo && (
          <p className="mob-erro" style={{ textAlign: 'center', marginTop: 8 }}>
            Escreva o motivo de cada item que faltou.
          </p>
        )}
      </div>
    </>
  );
}

/* ---------------- Confirmação --------------------------------- */
export function TelaFvmFim({
  t, divergente, onVoltar, onVerDetalhe,
}: {
  t: Transferencia;
  divergente: boolean;
  onVoltar: () => void;
  onVerDetalhe: () => void;
}) {
  return (
    <>
      <MobTop
        eyebrow={t.codigo}
        titulo={divergente ? 'Divergência registrada' : 'Recebimento confirmado'}
      />
      <div className="mob-corpo">
        <div className="mob-pad">
          <div style={{ textAlign: 'center', padding: '30px 8px 24px' }}>
            <div
              style={{
                width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center',
                margin: '0 auto 18px',
                background: divergente ? 'var(--red-bg)' : 'var(--green-bg)',
                color: divergente ? 'var(--red-fg)' : 'var(--green-fg)',
              }}
            >
              {divergente ? <AlertTriangle size={36} /> : <Check size={36} />}
            </div>
            <div style={{ fontSize: 21, fontWeight: 700 }}>
              {divergente ? 'Registrado para auditoria' : 'Tudo certo'}
            </div>
            <p className="mob-dica" style={{ fontSize: 14.5, marginTop: 10 }}>
              {divergente
                ? 'A obra de origem, o Aprovador e esta obra foram avisados da diferença. A origem decide se reenvia o que faltou.'
                : 'A obra de origem, o Aprovador e esta obra foram avisados. O material já entrou no estoque daqui.'}
            </p>
          </div>

          <div className="mob-cartao">
            {t.itens.map((i) => (
              <div className="mob-linha" key={i.insumoId}>
                <span className="mob-linha__r" style={{ flex: 1 }}>{i.nome}</span>
                <span
                  className="mob-linha__v"
                  style={{ color: i.qtdRecebida === i.qtdEnviada ? 'var(--green-fg)' : 'var(--red-fg)' }}
                >
                  {num(i.qtdRecebida ?? 0)}/{num(i.qtdEnviada)} {i.unidade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'grid', gap: 9 }}>
        <button className="mob-btn mob-btn--primario" onClick={onVerDetalhe}>Ver a transferência</button>
        <button className="mob-btn mob-btn--sm" onClick={onVoltar}>Voltar para a lista</button>
      </div>
    </>
  );
}
