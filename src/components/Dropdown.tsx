import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface OpcaoDropdown<T extends string> {
  valor: T;
  rotulo: string;
  /** Pílula verde exibida ao lado do rótulo, como o "Novo" do produto. */
  etiqueta?: string;
}

/**
 * Dropdown do padrão Suplos: o rótulo selecionado aparece dentro do campo
 * junto com a etiqueta, o que um <select> nativo não permite.
 */
export function Dropdown<T extends string>({
  valor, opcoes, onMudar, placeholder = 'Selecione', erro,
}: {
  valor: T | '';
  opcoes: OpcaoDropdown<T>[];
  onMudar: (v: T) => void;
  placeholder?: string;
  erro?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const atual = opcoes.find((o) => o.valor === valor);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  return (
    <div className="combo" ref={ref}>
      <button
        type="button"
        className={`input dropdown__gatilho ${erro ? 'input--erro' : ''}`}
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
      >
        <span className={atual ? '' : 'txt-muted'}>
          {atual?.rotulo ?? placeholder}
        </span>
        {atual?.etiqueta && <span className="badge badge--novo">{atual.etiqueta}</span>}
        <ChevronDown size={15} className="dropdown__chevron" />
      </button>

      {aberto && (
        <div className="combo__lista">
          {opcoes.map((o) => (
            <button
              type="button" key={o.valor} className="combo__item"
              onClick={() => { onMudar(o.valor); setAberto(false); }}
            >
              {valor === o.valor ? <Check size={14} /> : <span style={{ width: 14 }} />}
              <span style={{ flex: 1 }}>{o.rotulo}</span>
              {o.etiqueta && <span className="badge badge--novo">{o.etiqueta}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
