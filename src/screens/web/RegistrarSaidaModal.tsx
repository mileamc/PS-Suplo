import { useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Pencil, Check, Lock, ShieldCheck, ClipboardList, PackageOpen } from 'lucide-react';
import { Dropdown } from '../../components/Dropdown';
import { Modal, Rotulo, Aviso } from '../../components/ui';
import { Assinatura } from '../../components/Assinatura';
import { INSUMOS, rotuloInsumo } from '../../data/insumos';
import { REQUISICOES } from '../../data/requisicoes';
import { OBRAS, OBRA_ATUAL } from '../../data/obras';
import { useStore } from '../../state/store';
import type { TransferItem } from '../../domain/types';

type TipoSaida = 'baixa' | 'kit' | 'apropriacao' | 'transferencia';

const TIPOS = [
  { valor: 'baixa' as const, rotulo: 'Baixa de material' },
  { valor: 'kit' as const, rotulo: 'Kit' },
  { valor: 'apropriacao' as const, rotulo: 'Baixa com apropriação' },
  { valor: 'transferencia' as const, rotulo: 'Transferência de Estoque', etiqueta: 'Novo' },
];

interface Rascunho {
  insumoId: string;
  quantidade: string;
}

export function RegistrarSaidaModal({ onFechar }: { onFechar: () => void }) {
  const { state, dispatch, saldo } = useStore();
  const [tipo, setTipo] = useState<TipoSaida>('transferencia');
  const [entrada, setEntrada] = useState<'saida_direta' | 'requisicao'>('saida_direta');
  const [requisicaoId, setRequisicaoId] = useState('');
  const [obraDestino, setObraDestino] = useState('');
  const [observacao, setObservacao] = useState('');
  const [assinatura, setAssinatura] = useState('');
  const [itens, setItens] = useState<TransferItem[]>([]);
  const [rascunho, setRascunho] = useState<Rascunho | null>({ insumoId: '', quantidade: '' });
  const [erros, setErros] = useState<string[]>([]);

  const ehTransferencia = tipo === 'transferencia';
  const destinos = useMemo(() => OBRAS.filter((o) => o.id !== OBRA_ATUAL), []);

  function confirmarRascunho() {
    if (!rascunho?.insumoId) return;
    const insumo = INSUMOS.find((i) => i.id === rascunho.insumoId)!;
    const qtd = Number(rascunho.quantidade);
    const disponivel = saldo(insumo.id).disponivel;
    if (!qtd || qtd <= 0) { setErros(['Informe uma quantidade maior que zero.']); return; }
    if (qtd > disponivel) {
      setErros([`Quantidade acima do estoque disponível (${disponivel.toLocaleString('pt-BR')} ${insumo.unidade}).`]);
      return;
    }
    setErros([]);
    setItens((v) => [
      ...v.filter((i) => i.insumoId !== insumo.id),
      {
        insumoId: insumo.id, codigo: insumo.codigo, nome: insumo.nome, unidade: insumo.unidade,
        tipo: insumo.tipo, custoUnitario: insumo.custoUnitario,
        qtdEnviada: qtd, qtdRecebida: null,
      },
    ]);
    setRascunho(null);
  }

  function salvar() {
    const faltando: string[] = [];
    if (ehTransferencia && !obraDestino) faltando.push('Obra de transferência');
    if (ehTransferencia && entrada === 'requisicao' && !requisicaoId) faltando.push('Requisição de material');
    if (!observacao.trim()) faltando.push('Observação');
    if (!assinatura) faltando.push('Assinatura');
    if (itens.length === 0) faltando.push('Ao menos um insumo');
    if (faltando.length) {
      setErros(faltando);
      dispatch({
        type: 'toast', toast: {
          tom: 'erro', titulo: 'Campos obrigatórios', descricao: faltando.join(', '),
        },
      });
      return;
    }
    dispatch({
      type: 'criar', itens, obraDestinoId: obraDestino, observacao, assinatura,
      entrada,
      requisicaoCodigo: entrada === 'requisicao'
        ? REQUISICOES.find((r) => r.id === requisicaoId)?.codigo
        : undefined,
    });
    onFechar();
  }

  const custoTotal = itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);

  return (
    <Modal
      titulo="Registrar Saída de Estoque"
      onFechar={onFechar}
      rodapeEsquerda={
        ehTransferencia && itens.length > 0 ? (
          <div className="txt-12 txt-muted">
            Custo total apropriado:{' '}
            <strong style={{ color: 'var(--text)' }}>
              {custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </strong>
          </div>
        ) : <span />
      }
      rodape={
        <>
          <button className="btn" onClick={onFechar}>Cancelar</button>
          <button className="btn btn--salvar" onClick={salvar}>Salvar Saída</button>
        </>
      }
    >
      <div className="saida-grid">
        {/* ---------------- Coluna esquerda ---------------- */}
        <div className="saida-grid__col">
          <div className="secao-rotulo">Informações da saída</div>

          <div className="campo">
            <Rotulo obrigatorio ajuda="Define o comportamento da saída e quais campos aparecem.">
              Tipo de Saída
            </Rotulo>
            <Dropdown<TipoSaida> valor={tipo} opcoes={TIPOS} onMudar={setTipo} />
          </div>

          {ehTransferencia && (
            <div className="campo">
              <Rotulo obrigatorio ajuda="A transferência nasce de uma saída direta do estoque ou de uma requisição interna desta obra.">
                Origem da transferência
              </Rotulo>
              <div className="opcoes-entrada">
                <button
                  type="button"
                  className={`opcao-entrada ${entrada === 'saida_direta' ? 'opcao-entrada--ativa' : ''}`}
                  onClick={() => { setEntrada('saida_direta'); setRequisicaoId(''); }}
                >
                  <PackageOpen size={16} />
                  <span>
                    <strong>Saída direta</strong>
                    <em>Sobra de material identificada no estoque</em>
                  </span>
                </button>
                <button
                  type="button"
                  className={`opcao-entrada ${entrada === 'requisicao' ? 'opcao-entrada--ativa' : ''}`}
                  onClick={() => setEntrada('requisicao')}
                >
                  <ClipboardList size={16} />
                  <span>
                    <strong>Requisição de material</strong>
                    <em>Pedido interno já aberto nesta obra</em>
                  </span>
                </button>
              </div>
            </div>
          )}

          {ehTransferencia && entrada === 'requisicao' && (
            <div className="campo">
              <Rotulo obrigatorio ajuda="Os insumos e as quantidades da requisição preenchem a lista à direita.">
                Requisição
              </Rotulo>
              <Dropdown
                valor={requisicaoId}
                placeholder="Selecione a requisição"
                erro={erros.includes('Requisição de material')}
                opcoes={REQUISICOES.map((r) => ({
                  valor: r.id,
                  rotulo: `${r.codigo} · ${r.solicitante} · ${r.localAplicacao}`,
                }))}
                onMudar={(id) => {
                  setRequisicaoId(id);
                  const req = REQUISICOES.find((r) => r.id === id);
                  if (!req) return;
                  setRascunho(null);
                  setItens(req.itens.map((ri) => {
                    const insumo = INSUMOS.find((i) => i.id === ri.insumoId)!;
                    return {
                      insumoId: insumo.id, codigo: insumo.codigo, nome: insumo.nome,
                      unidade: insumo.unidade, tipo: insumo.tipo, custoUnitario: insumo.custoUnitario,
                      qtdEnviada: ri.quantidade, qtdRecebida: null,
                    };
                  }));
                }}
              />
              {requisicaoId && (
                <div className="campo__dica">
                  Insumos e quantidades vieram da requisição. Você ainda pode ajustar antes de reservar.
                </div>
              )}
            </div>
          )}

          {ehTransferencia ? (
            <div className="campo">
              <Rotulo obrigatorio ajuda="Obra que vai receber o material. A movimentação só acontece quando ela confirmar o recebimento.">
                Obra de transferência
              </Rotulo>
              <Dropdown
                valor={obraDestino}
                placeholder="Selecione a obra destino"
                erro={erros.includes('Obra de transferência')}
                opcoes={destinos.map((o) => ({ valor: o.id, rotulo: o.nome }))}
                onMudar={setObraDestino}
              />
            </div>
          ) : (
            <>
              <div className="campo">
                <Rotulo obrigatorio ajuda="Onde o material será aplicado.">Local de aplicação</Rotulo>
                <input className="input" placeholder="Buscar e selecionar local..." />
              </div>
              <div className="campo">
                <Rotulo obrigatorio ajuda="Quem solicitou a retirada.">Solicitante</Rotulo>
                <input className="input" placeholder="Buscar solicitante..." />
              </div>
            </>
          )}

          <div className="campo">
            <Rotulo obrigatorio={ehTransferencia} ajuda="Contexto da saída, visível para a obra de destino e para o Aprovador.">
              Observação
            </Rotulo>
            <textarea
              className={`textarea ${erros.includes('Observação') ? 'textarea--erro' : ''}`}
              placeholder="Adicione observações sobre a saída..."
              value={observacao} onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <div className="campo">
            <Rotulo obrigatorio={ehTransferencia} ajuda="Assinatura de quem entrega o material.">
              Assinatura
            </Rotulo>
            <Assinatura valor={assinatura} onMudar={setAssinatura} erro={erros.includes('Assinatura')} />
          </div>

          {/* ---- Novo: o que vai acontecer ao salvar ---- */}
          {ehTransferencia && (
            state.aprovacaoAtiva ? (
              <Aviso tom="info" titulo="Esta saída não movimenta o estoque agora">
                Ao salvar, a quantidade fica <strong>Reservada</strong> na obra de origem e a transferência segue
                para <strong>aprovação da obra de destino</strong>. O material só sai do saldo quando você
                registrar o despacho.
              </Aviso>
            ) : (
              <Aviso tom="atencao" titulo="Aprovação está desligada para este cliente">
                Ao salvar, a quantidade fica <strong>Reservada</strong> e a transferência vai direto para
                despacho, sem passar por aprovação.
              </Aviso>
            )
          )}
        </div>

        {/* ---------------- Coluna direita ---------------- */}
        <div className="saida-grid__col">
          <div className="linha linha--entre">
            <div className="secao-rotulo">
              {ehTransferencia ? 'Insumos a transferir' : 'Materiais'}
              <span className="secao-rotulo__contador">{itens.length + (rascunho ? 1 : 0)}/20</span>
            </div>
            <button
              className="btn btn--sm"
              onClick={() => setRascunho({ insumoId: '', quantidade: '' })}
              disabled={Boolean(rascunho) || itens.length >= 20}
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {itens.map((it) => (
            <div className="insumo-resumo" key={it.insumoId}>
              <Check size={16} className="insumo-resumo__check" />
              <div className="insumo-resumo__txt">
                <div className="insumo-resumo__nome">
                  {it.codigo} | {it.nome} | {it.tipo === 'avulso' ? 'avulsa' : 'pedido'}
                </div>
                <div className="insumo-resumo__qtd">
                  Quantidade: {it.qtdEnviada.toLocaleString('pt-BR')} {it.unidade}
                  <span className="txt-muted">
                    {' · '}{(it.qtdEnviada * it.custoUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
              <div className="linha" style={{ gap: 2 }}>
                <button
                  className="icone-acao" title="Editar"
                  onClick={() => {
                    setItens((v) => v.filter((x) => x.insumoId !== it.insumoId));
                    setRascunho({ insumoId: it.insumoId, quantidade: String(it.qtdEnviada) });
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="icone-acao icone-acao--perigo" title="Remover"
                  onClick={() => setItens((v) => v.filter((x) => x.insumoId !== it.insumoId))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {rascunho && (
            <CartaoInsumo
              rascunho={rascunho}
              onMudar={setRascunho}
              onRemover={() => { setRascunho(null); setErros([]); }}
              onConfirmar={confirmarRascunho}
            />
          )}

          {itens.length === 0 && !rascunho && (
            <div className="estado-vazio" style={{ marginTop: 12, padding: '34px 20px' }}>
              <div className="estado-vazio__icone"><Plus size={18} /></div>
              <div className="estado-vazio__titulo" style={{ fontSize: 14 }}>Nenhum insumo adicionado</div>
              <p className="estado-vazio__texto">
                Adicione os insumos que vão sair desta obra. A quantidade de cada um trava no momento da reserva.
              </p>
            </div>
          )}

          {ehTransferencia && itens.length > 0 && (
            <div className="aviso aviso--info mt-16">
              <Lock size={15} />
              <div>
                <strong className="aviso__titulo">Quantidade travada na reserva</strong>
                A quantidade não muda depois de reservada. Qualquer diferença só pode aparecer na
                Avaliação de entrega, quando a obra de destino conferir o que chegou.
              </div>
            </div>
          )}
        </div>
      </div>

      {erros.length > 0 && (
        <div style={{ paddingBottom: 4 }}>
          <div className="aviso aviso--perigo">
            <ShieldCheck size={15} />
            <div>
              <strong className="aviso__titulo">Campos obrigatórios</strong>
              {erros.join(' · ')}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ============================================================
   Cartão de insumo em edição (combobox + quantidade)
   ============================================================ */
function CartaoInsumo({
  rascunho, onMudar, onRemover, onConfirmar,
}: {
  rascunho: Rascunho;
  onMudar: (r: Rascunho) => void;
  onRemover: () => void;
  onConfirmar: () => void;
}) {
  const { saldo } = useStore();
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const selecionado = INSUMOS.find((i) => i.id === rascunho.insumoId);
  const filtrados = INSUMOS.filter((i) =>
    rotuloInsumo(i).toLowerCase().includes(busca.toLowerCase()),
  );
  const disponivel = selecionado ? saldo(selecionado.id).disponivel : null;

  return (
    <div className="insumo-card">
      <div className="insumo-card__acoes">
        <button className="icone-acao icone-acao--perigo" onClick={onRemover} title="Remover"><Trash2 size={14} /></button>
      </div>

      <div className="campo" style={{ marginTop: 4 }}>
        <Rotulo obrigatorio ajuda="Busque pelo código ou pelo nome. Saldos avulsos e de pedido são itens separados.">
          Insumo
        </Rotulo>
        <div className="combo" ref={wrap}>
          <input
            className="input"
            placeholder="Buscar insumo..."
            value={aberto ? busca : (selecionado ? rotuloInsumo(selecionado) : '')}
            onFocus={() => { setAberto(true); setBusca(''); }}
            onChange={(e) => setBusca(e.target.value)}
            onBlur={() => window.setTimeout(() => setAberto(false), 120)}
          />
          {aberto && (
            <div className="combo__lista">
              {filtrados.length === 0 && <div className="combo__vazio">Nenhum insumo encontrado.</div>}
              {filtrados.map((i) => (
                <button
                  key={i.id} className="combo__item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onMudar({ ...rascunho, insumoId: i.id });
                    setAberto(false);
                  }}
                >
                  {rascunho.insumoId === i.id ? <Check size={14} /> : <span style={{ width: 14 }} />}
                  <span>{rotuloInsumo(i)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="campo-linha mt-16">
        <div>
          <Rotulo ajuda="Saldo livre depois de descontar o que já está reservado em outras transferências.">
            Estoque disponível
          </Rotulo>
          <input
            className="input" readOnly
            value={disponivel === null ? '-' : `${disponivel.toLocaleString('pt-BR')} ${selecionado?.unidade ?? ''}`}
          />
        </div>
        <div>
          <Rotulo obrigatorio ajuda="Trava no momento da reserva e não muda depois.">
            Quantidade para transferir
          </Rotulo>
          <input
            className="input" type="number" min={0} placeholder="0"
            value={rascunho.quantidade}
            onChange={(e) => onMudar({ ...rascunho, quantidade: e.target.value })}
          />
        </div>
      </div>

      {selecionado && (
        <div className="campo__dica">
          {selecionado.tipo === 'avulso'
            ? 'Item avulso, sem apropriação necessária.'
            : 'Item de pedido — a apropriação de custos acompanha a transferência.'}
        </div>
      )}

      <div className="linha linha--fim mt-16">
        <button className="btn btn--confirmar" onClick={onConfirmar} disabled={!rascunho.insumoId}>
          <Check size={14} /> Confirmar
        </button>
      </div>
    </div>
  );
}
