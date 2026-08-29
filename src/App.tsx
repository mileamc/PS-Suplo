import { useCallback, useEffect, useState } from 'react';
import { StoreProvider, useStore } from './state/store';
import { ROTAS, caminhoDaTransferencia, resolver, type Rota } from './state/rotas';
import { Sidebar, DemoBar, Toasts } from './components/Shell';
import { EstoqueScreen } from './screens/web/EstoqueScreen';
import { TransferenciasScreen } from './screens/web/TransferenciasScreen';
import { TransferenciaDrawer } from './screens/web/TransferenciaDrawer';
import { MobileScreen } from './screens/mobile/MobileScreen';
import { CaseSite } from './site/CaseSite';

export default function App() {
  const [caminho, setCaminho] = useState(() => window.location.pathname);

  useEffect(() => {
    const voltar = () => setCaminho(window.location.pathname);
    window.addEventListener('popstate', voltar);
    return () => window.removeEventListener('popstate', voltar);
  }, []);

  const navegar = useCallback((destino: string) => {
    window.history.pushState({}, '', destino);
    setCaminho(destino);
    window.scrollTo(0, 0);
  }, []);

  const destino = resolver(caminho);

  // O site do case não precisa do estado do protótipo.
  if (destino.tela === 'site') return <CaseSite />;

  return (
    <StoreProvider>
      {destino.tela === 'embed-mobile'
        ? <MobileScreen semMoldura />
        : <Prototipo
            rota={destino.rota} id={destino.id}
            somenteLeitura={destino.somenteLeitura} navegar={navegar}
          />}
      <Toasts />
    </StoreProvider>
  );
}

function Prototipo({
  rota, id, somenteLeitura, navegar,
}: { rota: Rota; id: string | null; somenteLeitura?: boolean; navegar: (destino: string) => void }) {
  const { state } = useStore();
  const transferencia = id ? state.transferencias.find((t) => t.id === id) ?? null : null;

  return (
    <div className="app">
      <Sidebar rota={rota} onNavegar={(r: Rota) => navegar(ROTAS[r])} />
      <div className="main">
        <DemoBar />
        <div className="conteudo">
          {rota === 'estoque' && (
            <EstoqueScreen onAbrirTransferencia={(tid) => navegar(caminhoDaTransferencia(tid))} />
          )}
          {rota === 'transferencias' && (
            <TransferenciasScreen onAbrir={(tid) => navegar(caminhoDaTransferencia(tid))} />
          )}
          {rota === 'mobile' && <MobileScreen />}
        </div>
      </div>

      {transferencia && (
        <TransferenciaDrawer
          t={transferencia} somenteLeitura={somenteLeitura}
          onFechar={() => navegar(ROTAS.transferencias)}
        />
      )}
    </div>
  );
}
