import React, { useEffect } from 'react';
import { X, HelpCircle, Check, AlertTriangle, Info, AlertOctagon, Inbox } from 'lucide-react';
import type { Transferencia, TransferStatus } from '../domain/types';
import { STATUS_META, divergenciaPendente } from '../domain/status';

/* ---------------- Badge de status da transferência ---------- */
export function BadgeStatus({ status, compacto }: { status: TransferStatus; compacto?: boolean }) {
  const m = STATUS_META[status];
  // A divergência esperando decisão da origem é a única pendência que
  // custa dinheiro por dia parado, então a tag respira em vez de sumir
  // no meio das outras.
  const pulsa = status === 'recebido_divergencia' ? ' badge-status--pulsa' : '';
  return (
    <span className={`badge-status badge-status--${m.token}${pulsa}`} title={m.descricao}>
      <span className="badge-status__ponto" />
      {compacto ? m.curto : m.label}
    </span>
  );
}

export function corDoStatus(status: TransferStatus): string {
  return `var(--st-${STATUS_META[status].token})`;
}

/**
 * Marca a divergência que ainda espera decisão da obra de origem.
 *
 * Só aparece em "Aguardando NF", onde as duas pendências correm em
 * paralelo — o destino anexa a nota, a origem decide o que fazer com a
 * falta — e a tag de status conta só metade da história. Em
 * "Divergência pendente" a própria tag de status já diz tudo, e repetir
 * seria ruído.
 */
export function BadgeDivergencia({ t }: { t: Transferencia }) {
  if (t.status !== 'aguardando_nf' || !divergenciaPendente(t)) return null;
  const faltando = t.itens.reduce(
    (s, i) => s + Math.max(0, i.qtdEnviada - (i.qtdRecebida ?? i.qtdEnviada)), 0,
  );
  return (
    <span
      className="badge-status badge-status--diverg badge-status--pulsa"
      title={`Faltaram ${faltando.toLocaleString('pt-BR')} un. no total. A obra de origem precisa decidir se envia o saldo faltante ou encerra assumindo a falta.`}
    >
      <AlertTriangle size={11} />
      Divergência pendente
    </span>
  );
}

/* ---------------- Badge genérico ---------------------------- */
type Tom = 'verde' | 'ambar' | 'vermelho' | 'roxo' | 'azul' | 'ciano' | 'cinza' | 'novo';
export function Badge({ tom = 'cinza', children }: { tom?: Tom; children: React.ReactNode }) {
  return <span className={`badge badge--${tom}`}>{children}</span>;
}

/* ---------------- Ícone de ajuda (padrão do produto) -------- */
export function Ajuda({ texto }: { texto: string }) {
  return (
    <span className="campo__ajuda" title={texto} aria-label={texto}>
      <HelpCircle size={13} />
    </span>
  );
}

/* ---------------- Rótulo de campo --------------------------- */
export function Rotulo({
  children, obrigatorio, ajuda,
}: { children: React.ReactNode; obrigatorio?: boolean; ajuda?: string }) {
  return (
    <label className="campo__rotulo">
      {children}
      {obrigatorio && <span className="campo__req">*</span>}
      {ajuda && <Ajuda texto={ajuda} />}
    </label>
  );
}

/* ---------------- Modal ------------------------------------- */
export function Modal({
  titulo, sub, largura = 'grande', onFechar, children, rodape, rodapeEsquerda,
}: {
  titulo: React.ReactNode;
  sub?: React.ReactNode;
  largura?: 'grande' | 'medio' | 'estreito';
  onFechar: () => void;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  rodapeEsquerda?: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onFechar]);

  const classe = largura === 'grande' ? '' : largura === 'medio' ? 'modal--medio' : 'modal--estreito';
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className={`modal ${classe}`} role="dialog" aria-modal="true">
        <div className="modal__cabecalho">
          <div>
            <h2 className="modal__titulo">{titulo}</h2>
            {sub && <div className="modal__sub">{sub}</div>}
          </div>
          <button className="modal__fechar" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className="modal__corpo">{children}</div>
        {(rodape || rodapeEsquerda) && (
          <div className={`modal__rodape ${rodapeEsquerda ? 'modal__rodape--espaco' : ''}`}>
            {rodapeEsquerda}
            <div className="linha">{rodape}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Aviso ------------------------------------- */
export function Aviso({
  tom = 'info', titulo, children,
}: { tom?: 'info' | 'atencao' | 'perigo' | 'sucesso'; titulo?: string; children: React.ReactNode }) {
  const Icone = tom === 'perigo' ? AlertOctagon : tom === 'atencao' ? AlertTriangle : tom === 'sucesso' ? Check : Info;
  return (
    <div className={`aviso aviso--${tom}`}>
      <Icone size={15} />
      <div>
        {titulo && <strong className="aviso__titulo">{titulo}</strong>}
        {children}
      </div>
    </div>
  );
}

/* ---------------- Estados não-felizes (seção 11) ------------ */
export function EstadoVazio({
  titulo, texto, acao, icone,
}: { titulo: string; texto: string; acao?: React.ReactNode; icone?: React.ReactNode }) {
  return (
    <div className="estado-vazio">
      <div className="estado-vazio__icone">{icone ?? <Inbox size={20} />}</div>
      <div className="estado-vazio__titulo">{titulo}</div>
      <p className="estado-vazio__texto">{texto}</p>
      {acao && <div className="estado-vazio__acao">{acao}</div>}
    </div>
  );
}

export function EstadoErro({ onTentar }: { onTentar: () => void }) {
  return (
    <EstadoVazio
      icone={<AlertOctagon size={20} />}
      titulo="Não foi possível carregar as transferências"
      texto="A conexão com o servidor falhou. Os dados podem estar desatualizados — nenhuma movimentação foi perdida."
      acao={<button className="btn btn--primario" onClick={onTentar}>Tentar de novo</button>}
    />
  );
}

export function Skeleton({ altura = 12, largura = '100%' }: { altura?: number; largura?: number | string }) {
  return <div className="skeleton" style={{ height: altura, width: largura }} />;
}

export function ListaCarregando({ linhas = 4 }: { linhas?: number }) {
  return (
    <div className="lista-transf" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="item-transf" style={{ borderLeftColor: 'var(--border)' }}>
          <div style={{ flex: 1 }}>
            <Skeleton altura={13} largura={190} />
            <div style={{ height: 8 }} />
            <Skeleton altura={11} largura="65%" />
          </div>
          <Skeleton altura={22} largura={104} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Switch ------------------------------------ */
export function Switch({
  ligado, onMudar, rotulo,
}: { ligado: boolean; onMudar: (v: boolean) => void; rotulo: string }) {
  return (
    <span className="switch">
      <button
        type="button" role="switch" aria-checked={ligado} aria-label={rotulo}
        className="switch__trilho" onClick={() => onMudar(!ligado)}
      >
        <span className="switch__bola" />
      </button>
    </span>
  );
}

/* ---------------- Segmentado -------------------------------- */
export function Segmentado<T extends string>({
  valor, opcoes, onMudar,
}: { valor: T; opcoes: { valor: T; rotulo: string }[]; onMudar: (v: T) => void }) {
  return (
    <div className="segmentado">
      {opcoes.map((o) => (
        <button key={o.valor} aria-pressed={valor === o.valor} onClick={() => onMudar(o.valor)}>
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
