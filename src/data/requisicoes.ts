/* ============================================================
   Requisição de material — a segunda entrada do fluxo.
   Seção 9: é sempre um pedido interno da PRÓPRIA obra de origem
   (nunca um pedido feito pela obra de destino).
   ============================================================ */
export interface RequisicaoItem {
  insumoId: string;
  quantidade: number;
}

export interface Requisicao {
  id: string;
  codigo: string;
  solicitante: string;
  localAplicacao: string;
  criadaEm: string;
  itens: RequisicaoItem[];
}

export const REQUISICOES: Requisicao[] = [
  {
    id: 'rq-4471', codigo: 'REQ-4471', solicitante: 'Equipe Elétrica · Bruno Sales',
    localAplicacao: 'PAV03', criadaEm: '2026-08-27T08:40:00',
    itens: [{ insumoId: 'in-12113-a', quantidade: 2000 }],
  },
  {
    id: 'rq-4488', codigo: 'REQ-4488', solicitante: 'Equipe Hidráulica · Marcos Vinícius',
    localAplicacao: 'PAV01;PAV02', criadaEm: '2026-08-28T10:15:00',
    itens: [
      { insumoId: 'in-2995-p', quantidade: 300 },
      { insumoId: 'in-15347-a', quantidade: 40 },
    ],
  },
  {
    id: 'rq-4502', codigo: 'REQ-4502', solicitante: 'Acabamento · Priscila Nunes',
    localAplicacao: 'Fachada', criadaEm: '2026-08-28T16:02:00',
    itens: [{ insumoId: 'in-11843-p', quantidade: 60 }],
  },
];
