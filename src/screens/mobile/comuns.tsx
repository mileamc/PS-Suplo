import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Info, AlertTriangle, AlertOctagon, Inbox } from 'lucide-react';
import { useStore } from '../../state/store';

/* ---------------- Cabeçalho ---------------------------------- */
export function MobTop({
  eyebrow, titulo, onVoltar, acoes,
}: {
  eyebrow?: string;
  titulo: string;
  onVoltar?: () => void;
  acoes?: React.ReactNode;
}) {
  return (
    <header className="mob-top">
      <div className="mob-top__linha">
        {onVoltar && (
          <button className="mob-icone" onClick={onVoltar} aria-label="Voltar">
            <ArrowLeft size={19} />
          </button>
        )}
        <div className="mob-top__txt">
          {eyebrow && <div className="mob-top__eyebrow">{eyebrow}</div>}
          <div className="mob-top__titulo">{titulo}</div>
        </div>
        {acoes}
      </div>
    </header>
  );
}

/* ---------------- Bottom sheet -------------------------------- */
export function Sheet({
  titulo, sub, onFechar, children, rodape,
}: {
  titulo: string;
  sub?: string;
  onFechar: () => void;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  return (
    <div
      className="mob-sheet-fundo"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="mob-sheet" role="dialog" aria-label={titulo}>
        <div className="mob-sheet__alca" />
        <div className="mob-sheet__topo">
          <div className="mob-sheet__titulo">{titulo}</div>
          {sub && <div className="mob-sheet__sub">{sub}</div>}
        </div>
        <div className="mob-sheet__corpo">{children}</div>
        {rodape && <div className="mob-sheet__rodape">{rodape}</div>}
      </div>
    </div>
  );
}

/* ---------------- Avisos e estados ---------------------------- */
export function MobAviso({
  tom = 'info', titulo, children,
}: { tom?: 'info' | 'atencao' | 'perigo' | 'ok'; titulo?: string; children: React.ReactNode }) {
  const Ic = tom === 'perigo' ? AlertOctagon : tom === 'atencao' ? AlertTriangle : tom === 'ok' ? Check : Info;
  return (
    <div className={`mob-aviso mob-aviso--${tom}`}>
      <Ic size={16} />
      <div>{titulo && <b>{titulo}</b>}{children}</div>
    </div>
  );
}

export function MobVazio({
  titulo, texto, icone, acao,
}: { titulo: string; texto: string; icone?: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="mob-vazio">
      <div className="mob-vazio__ic">{icone ?? <Inbox size={26} />}</div>
      <div className="mob-vazio__t">{titulo}</div>
      <p className="mob-vazio__x">{texto}</p>
      {acao && <div style={{ marginTop: 18 }}>{acao}</div>}
    </div>
  );
}

export function MobCarregando() {
  return (
    <div className="mob-pad" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="mob-tcard" style={{ borderLeftColor: 'var(--border)' }}>
          <div className="mob-sk" style={{ height: 15, width: '48%' }} />
          <div className="mob-sk" style={{ height: 12, width: '72%', marginTop: 12 }} />
          <div className="mob-sk" style={{ height: 12, width: '60%', marginTop: 9 }} />
        </div>
      ))}
    </div>
  );
}

/* ---------------- Toasts dentro do frame ---------------------- */
export function MobToasts() {
  const { state, dispatch } = useStore();
  const visiveis = state.toasts.slice(-2);

  useEffect(() => {
    if (visiveis.length === 0) return;
    const t = window.setTimeout(
      () => dispatch({ type: 'fechar_toast', id: visiveis[0].id }),
      4200,
    );
    return () => window.clearTimeout(t);
  }, [visiveis, dispatch]);

  if (visiveis.length === 0) return null;
  return (
    <div className="mob-toasts">
      {visiveis.map((t) => (
        <div className="mob-toast" key={t.id}>
          <Check
            size={15}
            style={{ marginTop: 2, flexShrink: 0 }}
            color={t.tom === 'erro' ? 'var(--red)' : 'var(--brand-500)'}
          />
          <div>
            <b>{t.titulo}</b>
            {t.descricao && <span>{t.descricao}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Assinatura ---------------------------------- */
export function MobAssinatura({
  onMudar, erro,
}: { onMudar: (dataUrl: string) => void; erro?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const [vazio, setVazio] = useState(true);

  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className={`mob-assin ${erro ? 'mob-assin--erro' : ''}`}>
      <canvas
        ref={ref}
        onPointerDown={(e) => {
          desenhando.current = true;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          const ctx = ref.current!.getContext('2d')!;
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!desenhando.current) return;
          const ctx = ref.current!.getContext('2d')!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          if (!desenhando.current) return;
          desenhando.current = false;
          setVazio(false);
          onMudar(ref.current!.toDataURL());
        }}
      />
      <div className="mob-assin__pe">
        <span>{vazio ? 'Assine com o dedo.' : 'Assinatura registrada.'}</span>
        <button
          type="button" className="mob-assin__limpar"
          onClick={() => {
            const c = ref.current!;
            c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
            setVazio(true);
            onMudar('');
          }}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

/* ---------------- Formatadores -------------------------------- */
export const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const num = (v: number) => v.toLocaleString('pt-BR');
