import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, PackageCheck, Inbox, AlertTriangle, Truck, Minus, Plus,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { nomeObra, OBRA_ATUAL } from '../../data/obras';
import { STATUS_TRANSITO } from '../../domain/status';
import { fmtData } from '../../domain/notificacoes';
import { BadgeStatus } from '../../components/ui';
import type { Transferencia } from '../../domain/types';

type Passo = { tela: 'lista' } | { tela: 'conferencia'; id: string } | { tela: 'fim'; id: string; divergente: boolean };

/* ============================================================
   Tela mobile de confirmação de recebimento (seção 7, item 4)
   ============================================================ */
export function MobileScreen() {
  const { aReceber, state } = useStore();
  const [passo, setPasso] = useState<Passo>({ tela: 'lista' });

  const chegando = useMemo(
    () => aReceber.filter((t) => STATUS_TRANSITO.includes(t.status)),
    [aReceber],
  );

  return (
    <div className="mob-palco">
      <div className="mob-frame">
        <div className="mob-tela">
          <div className="mob-notch">Suplos · 9:41</div>
          {passo.tela === 'lista' && (
            <TelaLista lista={chegando} onAbrir={(id) => setPasso({ tela: 'conferencia', id })} vazio={state.estadoTela === 'vazio'} />
          )}
          {passo.tela === 'conferencia' && (
            <TelaConferencia
              t={aReceber.find((t) => t.id === passo.id)!}
              onVoltar={() => setPasso({ tela: 'lista' })}
              onPronto={(divergente) => setPasso({ tela: 'fim', id: passo.id, divergente })}
            />
          )}
          {passo.tela === 'fim' && (
            <TelaFim
              t={aReceber.find((t) => t.id === passo.id)!}
              divergente={passo.divergente}
              onVoltar={() => setPasso({ tela: 'lista' })}
            />
          )}
        </div>
      </div>

      <div className="mob-notas">
        <h3>Decisões desta tela</h3>
        <ul>
          <li>O almoxarife chega com luva, sol na tela e conexão ruim: alvos de 54&nbsp;px, texto grande e nenhuma tabela.</li>
          <li><strong>Chegou tudo</strong> resolve o caso comum em <strong>um toque</strong> — preenche todas as quantidades de uma vez.</li>
          <li>A divergência é o caminho alternativo, não o padrão: só aparece quando ele mexe em alguma quantidade.</li>
          <li>A conferência de quantidade é obrigatória: não existe botão que pule a Avaliação de entrega.</li>
          <li>O motivo por item vira registro de auditoria — é o que hoje se perde no WhatsApp.</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Lista ------------------------------------- */
function TelaLista({
  lista, onAbrir, vazio,
}: { lista: Transferencia[]; onAbrir: (id: string) => void; vazio: boolean }) {
  const mostrar = vazio ? [] : lista;
  return (
    <>
      <header className="mob-header">
        <div className="mob-header__obra">{nomeObra(OBRA_ATUAL)}</div>
        <div className="mob-header__titulo">Materiais a receber</div>
      </header>
      <div className="mob-corpo">
        {mostrar.length === 0 ? (
          <div className="mob-vazio">
            <div className="mob-vazio__icone"><Inbox size={26} /></div>
            <div className="mob-vazio__titulo">Nada para conferir agora</div>
            <p className="mob-vazio__texto">
              Quando um caminhão chegar de outra obra, a transferência aparece aqui para você conferir.
            </p>
          </div>
        ) : mostrar.map((t) => {
          const chegou = t.status === 'avaliacao_entrega';
          return (
            <button
              key={t.id} className="mob-card"
              style={{ ['--c' as string]: chegou ? 'var(--st-fvm)' : 'var(--st-transito)' }}
              onClick={() => onAbrir(t.id)}
            >
              <div className="mob-card__topo">
                <span className="mob-card__codigo">{t.codigo}</span>
                <BadgeStatus status={t.status} compacto />
              </div>
              <div className="mob-card__rota">
                {nomeObra(t.obraOrigemId)} <ArrowRight size={14} /> aqui
              </div>
              <div className="mob-card__itens">
                {t.itens.length} {t.itens.length === 1 ? 'insumo' : 'insumos'}
                {t.previsaoChegada && ` · previsão ${fmtData(t.previsaoChegada)}`}
              </div>
              <div className="mob-card__cta">
                <span className={`mob-btn ${chegou ? 'mob-btn--primario' : 'mob-btn--fantasma'}`} style={{ height: 46, fontSize: 15 }}>
                  {chegou ? <><PackageCheck size={18} /> Conferir entrega</> : <><Truck size={18} /> Ainda em trânsito</>}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Conferência ------------------------------- */
function TelaConferencia({
  t, onVoltar, onPronto,
}: { t: Transferencia; onVoltar: () => void; onPronto: (divergente: boolean) => void }) {
  const { dispatch } = useStore();
  const emTransito = t.status === 'em_transito';
  const [recebidos, setRecebidos] = useState<Record<string, number>>(
    () => Object.fromEntries(t.itens.map((i) => [i.insumoId, i.qtdEnviada])),
  );
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [mexeu, setMexeu] = useState(false);

  const divergentes = t.itens.filter((i) => recebidos[i.insumoId] !== i.qtdEnviada);
  const temDivergencia = divergentes.length > 0;
  const faltaMotivo = divergentes.some((i) => !(motivos[i.insumoId] ?? '').trim());

  if (emTransito) {
    return (
      <>
        <header className="mob-header">
          <div className="mob-header__linha">
            <button className="mob-voltar" onClick={onVoltar}><ArrowLeft size={18} /></button>
            <div style={{ flex: 1 }}>
              <div className="mob-header__obra">{t.codigo}</div>
              <div className="mob-header__titulo">Em trânsito</div>
            </div>
          </div>
        </header>
        <div className="mob-corpo">
          <div className="mob-resumo">
            <div className="mob-resumo__linha"><span className="txt-muted">De</span><strong>{nomeObra(t.obraOrigemId)}</strong></div>
            <div className="mob-resumo__linha"><span className="txt-muted">Saiu em</span><strong>{t.despachadaEm ? fmtData(t.despachadaEm) : '—'}</strong></div>
            <div className="mob-resumo__linha"><span className="txt-muted">Previsão</span><strong>{t.previsaoChegada ? fmtData(t.previsaoChegada) : '—'}</strong></div>
          </div>
          <p className="mob-vazio__texto" style={{ textAlign: 'left' }}>
            Assim que o caminhão encostar, toque no botão abaixo. Só então a conferência abre.
          </p>
        </div>
        <div className="mob-rodape">
          <button className="mob-btn mob-btn--primario" onClick={() => dispatch({ type: 'registrar_chegada', id: t.id })}>
            <PackageCheck size={19} /> O material chegou
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="mob-header">
        <div className="mob-header__linha">
          <button className="mob-voltar" onClick={onVoltar}><ArrowLeft size={18} /></button>
          <div style={{ flex: 1 }}>
            <div className="mob-header__obra">{t.codigo} · de {nomeObra(t.obraOrigemId)}</div>
            <div className="mob-header__titulo">Conferir o que chegou</div>
          </div>
        </div>
      </header>

      <div className="mob-corpo">
        {!mexeu && (
          <button
            className="mob-btn mob-btn--primario" style={{ marginBottom: 14 }}
            onClick={() => {
              dispatch({
                type: 'confirmar_recebimento', id: t.id,
                recebidos: Object.fromEntries(t.itens.map((i) => [i.insumoId, i.qtdEnviada])),
                motivos: {},
              });
              onPronto(false);
            }}
          >
            <Check size={20} /> Chegou tudo certo
          </button>
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
              <div className="mob-item__meta">{i.codigo} · {i.tipo === 'avulso' ? 'avulsa' : 'pedido'}</div>
              <div className="mob-item__enviado">
                Saiu da obra de origem: <strong>{i.qtdEnviada.toLocaleString('pt-BR')}</strong> {i.unidade}
              </div>
              <div className={`mob-stepper ${dif ? 'mob-stepper--dif' : ''}`}>
                <button onClick={() => set(rec - 1)} aria-label="Diminuir"><Minus size={20} /></button>
                <input
                  type="number" inputMode="numeric" value={rec}
                  onChange={(e) => set(Number(e.target.value))}
                />
                <button onClick={() => set(rec + 1)} aria-label="Aumentar"><Plus size={20} /></button>
              </div>
              {dif ? (
                <>
                  <div className="mob-chip-dif">
                    <AlertTriangle size={15} /> Faltam {(i.qtdEnviada - rec).toLocaleString('pt-BR')} {i.unidade}
                  </div>
                  <textarea
                    className="mob-motivo" placeholder="O que aconteceu? (obrigatório)"
                    value={motivos[i.insumoId] ?? ''}
                    onChange={(e) => setMotivos((m) => ({ ...m, [i.insumoId]: e.target.value }))}
                  />
                </>
              ) : (
                <div className="mob-chip-ok"><Check size={15} /> Bateu com o enviado</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mob-rodape">
        <button
          className={temDivergencia ? 'mob-btn mob-btn--perigo' : 'mob-btn mob-btn--primario'}
          disabled={faltaMotivo}
          onClick={() => {
            dispatch({ type: 'confirmar_recebimento', id: t.id, recebidos, motivos });
            onPronto(temDivergencia);
          }}
        >
          {temDivergencia
            ? <><AlertTriangle size={19} /> Registrar divergência</>
            : <><Check size={19} /> Confirmar recebimento</>}
        </button>
        {faltaMotivo && (
          <div className="txt-12" style={{ color: 'var(--red-fg)', textAlign: 'center' }}>
            Escreva o motivo de cada item que faltou.
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------- Confirmação ------------------------------- */
function TelaFim({
  t, divergente, onVoltar,
}: { t: Transferencia; divergente: boolean; onVoltar: () => void }) {
  return (
    <>
      <header className="mob-header">
        <div className="mob-header__obra">{t.codigo}</div>
        <div className="mob-header__titulo">{divergente ? 'Divergência registrada' : 'Recebimento confirmado'}</div>
      </header>
      <div className="mob-corpo">
        <div className="mob-sucesso">
          <div className={`mob-sucesso__icone ${divergente ? 'mob-sucesso__icone--erro' : ''}`}>
            {divergente ? <AlertTriangle size={34} /> : <Check size={34} />}
          </div>
          <div className="mob-sucesso__titulo">
            {divergente ? 'Registrado para auditoria' : 'Tudo certo'}
          </div>
          <p className="mob-sucesso__texto">
            {divergente
              ? 'A obra de origem, o Aprovador e esta obra foram avisados da diferença. A origem decide se reenvia o que faltou.'
              : 'A obra de origem, o Aprovador e esta obra foram avisados. O material já entrou no estoque daqui.'}
          </p>
        </div>

        <div className="mob-resumo">
          {t.itens.map((i) => (
            <div className="mob-resumo__linha" key={i.insumoId}>
              <span style={{ flex: 1 }}>{i.nome}</span>
              <strong style={{ color: i.qtdRecebida === i.qtdEnviada ? 'var(--green-fg)' : 'var(--red-fg)' }}>
                {(i.qtdRecebida ?? 0).toLocaleString('pt-BR')}/{i.qtdEnviada.toLocaleString('pt-BR')} {i.unidade}
              </strong>
            </div>
          ))}
        </div>
      </div>
      <div className="mob-rodape">
        <button className="mob-btn mob-btn--fantasma" onClick={onVoltar}>Voltar para a lista</button>
      </div>
    </>
  );
}
