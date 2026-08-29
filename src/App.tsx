import { useCallback, useEffect, useState } from 'react';
import { StoreProvider, useStore } from './state/store';
import { ROTAS, caminhoDaTransferencia, rotaAtual, type Rota } from './state/rotas';
import { Sidebar, DemoBar, Toasts } from './components/Shell';
import { EstoqueScreen } from './screens/web/EstoqueScreen';
import { TransferenciasScreen } from './screens/web/TransferenciasScreen';
import { TransferenciaDrawer } from './screens/web/TransferenciaDrawer';
import { MobileScreen } from './screens/mobile/MobileScreen';

export default function App() {
  return (
    <StoreProvider>
      <Conteudo />
    </StoreProvider>
  );
}

function Conteudo() {
  const { state } = useStore();
  const [caminho, setCaminho] = useState(() => window.location.pathname);

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState({}, '', ROTAS.transferencias);
      setCaminho(ROTAS.transferencias);
    }
    const voltar = () => setCaminho(window.location.pathname);
    window.addEventListener('popstate', voltar);
    return () => window.removeEventListener('popstate', voltar);
  }, []);

  const navegar = useCallback((destino: string) => {
    window.history.pushState({}, '', destino);
    setCaminho(destino);
  }, []);

  const { rota, id } = rotaAtual(caminho);
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
        <TransferenciaDrawer t={transferencia} onFechar={() => navegar(ROTAS.transferencias)} />
      )}
      <Toasts />
    </div>
  );
}
