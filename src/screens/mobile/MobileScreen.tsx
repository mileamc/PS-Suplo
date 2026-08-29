import { MobileApp } from './MobileApp';
import { MobToasts } from './comuns';

/* Rota /stocks/transfers/receiving — o app mobile dentro de um
   aparelho, com as notas de decisão ao lado. */
export function MobileScreen({ semMoldura = false }: { semMoldura?: boolean } = {}) {
  if (semMoldura) {
    return (
      <>
        <MobileApp semMoldura />
        <MobToasts />
      </>
    );
  }

  return (
    <div className="mob-palco">
      <div className="mob-frame">
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <MobileApp />
          <MobToasts />
        </div>
      </div>

      <div className="mob-notas">
        <h3>Navegação mobile</h3>
        <p>
          O app cobre o mesmo fluxo da versão web — reserva, aprovação, despacho, conferência e
          divergência — com a navegação reorganizada para uma mão só.
        </p>
        <ul>
          <li><strong>Quatro abas na base</strong>: Transferências, Estoque, Movimentações e Alertas — o alcance do polegar.</li>
          <li><strong>Pilha para os fluxos longos</strong>: detalhe, criação e conferência ocupam a tela inteira e escondem as abas, para não competir com a tarefa.</li>
          <li><strong>O modal de duas colunas do web virou um passo a passo</strong> de três etapas: origem e destino, insumos, observação e assinatura.</li>
          <li><strong>Bottom sheets</strong> para as decisões curtas: despachar, aprovar, reprovar, cancelar, registrar chegada.</li>
          <li><strong>Alvos de 54&nbsp;px e nenhuma tabela</strong> — o contexto é sol, luva e conexão ruim.</li>
          <li><strong>"Chegou tudo certo" resolve em um toque</strong>; a divergência só aparece quando alguma quantidade muda.</li>
        </ul>
      </div>
    </div>
  );
}
