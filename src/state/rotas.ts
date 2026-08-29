/* ============================================================
   Rotas — os caminhos citados no fluxograma:
   "card em /stocks/transfers (2 obras)", "aba /stocks/transfers
   atualizada", "via Stocks/Transfers ou via Delivery".
   ============================================================ */
export const ROTAS = {
  estoque: '/stocks',
  transferencias: '/stocks/transfers',
  mobile: '/stocks/transfers/receiving',
} as const;

export type Rota = keyof typeof ROTAS;

export function rotaAtual(pathname: string): { rota: Rota; id: string | null } {
  if (pathname.startsWith(ROTAS.mobile)) return { rota: 'mobile', id: null };
  if (pathname.startsWith(ROTAS.transferencias)) {
    const resto = pathname.slice(ROTAS.transferencias.length).replace(/^\//, '');
    return { rota: 'transferencias', id: resto || null };
  }
  if (pathname.startsWith(ROTAS.estoque)) return { rota: 'estoque', id: null };
  return { rota: 'transferencias', id: null };
}

export function caminhoDaTransferencia(id: string): string {
  return `${ROTAS.transferencias}/${id}`;
}
