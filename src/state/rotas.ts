/* ============================================================
   Rotas.
   /                          site de apresentação do case
   /stocks, /stocks/transfers protótipo — caminhos citados no
                              fluxograma ("card em /stocks/transfers")
   /embed/mobile              protótipo mobile sem moldura, para
                              ser embutido no frame de celular do site
   ============================================================ */
export const ROTAS = {
  estoque: '/stocks',
  transferencias: '/stocks/transfers',
  mobile: '/stocks/transfers/receiving',
} as const;

export type Rota = keyof typeof ROTAS;

export const ROTA_SITE = '/';
export const ROTA_EMBED_MOBILE = '/embed/mobile';

export type Destino =
  | { tela: 'site' }
  | { tela: 'embed-mobile' }
  | { tela: 'prototipo'; rota: Rota; id: string | null };

export function resolver(pathname: string): Destino {
  if (pathname.startsWith(ROTA_EMBED_MOBILE)) return { tela: 'embed-mobile' };
  if (pathname.startsWith(ROTAS.mobile)) return { tela: 'prototipo', rota: 'mobile', id: null };
  if (pathname.startsWith(ROTAS.transferencias)) {
    const resto = pathname.slice(ROTAS.transferencias.length).replace(/^\//, '');
    return { tela: 'prototipo', rota: 'transferencias', id: resto || null };
  }
  if (pathname.startsWith(ROTAS.estoque)) return { tela: 'prototipo', rota: 'estoque', id: null };
  return { tela: 'site' };
}

export function caminhoDaTransferencia(id: string): string {
  return `${ROTAS.transferencias}/${id}`;
}
