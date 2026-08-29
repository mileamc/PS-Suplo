import { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

/** Canvas de assinatura — reproduz o campo do modal atual. */
export function Assinatura({
  valor, onMudar, erro,
}: { valor: string; onMudar: (dataUrl: string) => void; erro?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const [vazio, setVazio] = useState(!valor);

  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
  }, []);

  function pos(e: React.PointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  return (
    <div className={`assinatura ${erro ? 'assinatura--erro' : ''}`}>
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
      <div className="assinatura__rodape">
        <span className="assinatura__dica">
          {vazio ? 'Assine com o dedo ou o mouse.' : 'Assinatura registrada.'}
        </span>
        <button
          type="button" className="btn btn--sm"
          onClick={() => {
            const c = ref.current!;
            c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
            setVazio(true);
            onMudar('');
          }}
        >
          <Eraser size={13} /> Limpar
        </button>
      </div>
    </div>
  );
}
