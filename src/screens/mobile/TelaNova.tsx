import { useMemo, useState } from 'react';
import {
  Check, ChevronRight, Plus, Trash2, PackageOpen, ClipboardList, Lock, Search, Wallet,
} from 'lucide-react';
import { useStore } from '../../state/store';
import { OBRAS, OBRA_ATUAL, nomeObra } from '../../data/obras';
import { INSUMOS, rotuloInsumo } from '../../data/insumos';
import { REQUISICOES } from '../../data/requisicoes';
import { LINHAS_ORCAMENTO, rotuloLinha, linhaPorId } from '../../data/orcamento';
import type { TransferItem } from '../../domain/types';
import { MobTop, MobAviso, MobAssinatura, Sheet, brl, num } from './comuns';

/* ============================================================
   "Registrar Saída de Estoque" em formato mobile: o modal de
   duas colunas do web vira um passo a passo de 3 etapas.
   ============================================================ */
export function TelaNova({ onSair }: { onSair: () => void }) {
  const { state, dispatch, saldo } = useStore();
  const [passo, setPasso] = useState(0);

  const [entrada, setEntrada] = useState<'saida_direta' | 'requisicao'>('saida_direta');
  const [requisicaoId, setRequisicaoId] = useState('');
  const [obraDestino, setObraDestino] = useState('');
  const [itens, setItens] = useState<TransferItem[]>([]);
  const [observacao, setObservacao] = useState('');
  const [assinatura, setAssinatura] = useState('');
  const [erros, setErros] = useState<string[]>([]);
  const [sheetInsumo, setSheetInsumo] = useState(false);

  const destinos = useMemo(() => OBRAS.filter((o) => o.id !== OBRA_ATUAL), []);
  const custo = itens.reduce((s, i) => s + i.qtdEnviada * i.custoUnitario, 0);

  const titulos = ['Origem e destino', 'Insumos a transferir', 'Observação e assinatura'];

  function avancar() {
    const faltando: string[] = [];
    if (passo === 0) {
      if (entrada === 'requisicao' && !requisicaoId) faltando.push('Requisição de material');
      if (!obraDestino) faltando.push('Obra de transferência');
    }
    if (passo === 1 && itens.length === 0) faltando.push('Ao menos um insumo');
    if (passo === 2) {
      if (!observacao.trim()) faltando.push('Observação');
      if (!assinatura) faltando.push('Assinatura');
    }
    if (faltando.length) {
      setErros(faltando);
      dispatch({ type: 'toast', toast: { tom: 'erro', titulo: 'Campos obrigatórios', descricao: faltando.join(', ') } });
      return;
    }
    setErros([]);
    if (passo < 2) { setPasso(passo + 1); return; }
    dispatch({
      type: 'criar', itens, obraDestinoId: obraDestino, observacao, assinatura, entrada,
      requisicaoCodigo: entrada === 'requisicao'
        ? REQUISICOES.find((r) => r.id === requisicaoId)?.codigo
        : undefined,
    });
    onSair();
  }

  return (
    <>
      <MobTop
        eyebrow={`Passo ${passo + 1} de 3 · Saída de estoque`}
        titulo={titulos[passo]}
        onVoltar={() => (passo === 0 ? onSair() : setPasso(passo - 1))}
      />

      <div className="mob-passos" style={{ paddingTop: 12, background: 'var(--bg)' }}>
        {[0, 1, 2].map((i) => <i key={i} className={i <= passo ? 'feito' : ''} />)}
      </div>

      <div className="mob-corpo">
        <div className="mob-pad" style={{ paddingTop: 0 }}>
          {/* -------- Passo 1 -------- */}
          {passo === 0 && (
            <>
              <div className="mob-campo">
                <label className="mob-rot">Tipo de saída</label>
                <div className="mob-opcao" aria-pressed="true" style={{ pointerEvents: 'none' }}>
                  <Check size={18} className="mob-opcao__check" />
                  <div className="mob-opcao__txt">
                    <div className="mob-opcao__nome">Transferência de Estoque</div>
                    <div className="mob-opcao__meta">Único tipo que gera reserva e aprovação</div>
                  </div>
                </div>
              </div>

              <div className="mob-campo">
                <label className="mob-rot">Origem da transferência <i>*</i></label>
                <button
                  className="mob-opcao" aria-pressed={entrada === 'saida_direta'}
                  onClick={() => { setEntrada('saida_direta'); setRequisicaoId(''); }}
                >
                  <PackageOpen size={18} color={entrada === 'saida_direta' ? 'var(--brand-700)' : 'var(--text-faint)'} />
                  <div className="mob-opcao__txt">
                    <div className="mob-opcao__nome">Saída direta</div>
                    <div className="mob-opcao__meta">Sobra identificada no estoque</div>
                  </div>
                  {entrada === 'saida_direta' && <Check size={18} className="mob-opcao__check" />}
                </button>
                <button
                  className="mob-opcao" aria-pressed={entrada === 'requisicao'}
                  onClick={() => setEntrada('requisicao')}
                >
                  <ClipboardList size={18} color={entrada === 'requisicao' ? 'var(--brand-700)' : 'var(--text-faint)'} />
                  <div className="mob-opcao__txt">
                    <div className="mob-opcao__nome">Requisição de material</div>
                    <div className="mob-opcao__meta">Pedido interno já aberto nesta obra</div>
                  </div>
                  {entrada === 'requisicao' && <Check size={18} className="mob-opcao__check" />}
                </button>
              </div>

              {entrada === 'requisicao' && (
                <div className="mob-campo">
                  <label className="mob-rot">Requisição <i>*</i></label>
                  {REQUISICOES.map((r) => (
                    <button
                      key={r.id} className="mob-opcao" aria-pressed={requisicaoId === r.id}
                      onClick={() => {
                        setRequisicaoId(r.id);
                        setItens(r.itens.map((ri) => {
                          const insumo = INSUMOS.find((i) => i.id === ri.insumoId)!;
                          return {
                            insumoId: insumo.id, codigo: insumo.codigo, nome: insumo.nome,
                            unidade: insumo.unidade, tipo: insumo.tipo, custoUnitario: insumo.custoUnitario,
                            qtdEnviada: ri.quantidade, qtdRecebida: null,
                          };
                        }));
                      }}
                    >
                      <div className="mob-opcao__txt">
                        <div className="mob-opcao__nome">{r.codigo}</div>
                        <div className="mob-opcao__meta">{r.solicitante} · {r.localAplicacao}</div>
                      </div>
                      {requisicaoId === r.id && <Check size={18} className="mob-opcao__check" />}
                    </button>
                  ))}
                  {requisicaoId && (
                    <p className="mob-dica">Insumos e quantidades vêm da requisição. Dá para ajustar no passo 2.</p>
                  )}
                </div>
              )}

              <div className="mob-campo">
                <label className="mob-rot">Obra de transferência <i>*</i></label>
                {destinos.map((o) => (
                  <button
                    key={o.id} className="mob-opcao" aria-pressed={obraDestino === o.id}
                    onClick={() => setObraDestino(o.id)}
                  >
                    <div className="mob-opcao__txt">
                      <div className="mob-opcao__nome">{o.nome}</div>
                    </div>
                    {obraDestino === o.id && <Check size={18} className="mob-opcao__check" />}
                  </button>
                ))}
                {erros.includes('Obra de transferência') && (
                  <div className="mob-erro">Escolha a obra de destino.</div>
                )}
              </div>
            </>
          )}

          {/* -------- Passo 2 -------- */}
          {passo === 1 && (
            <>
              {itens.map((it) => (
                <div className="mob-item" key={it.insumoId}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Check size={17} color="var(--brand-600)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mob-item__nome">{it.nome}</div>
                      <div className="mob-item__meta">
                        {it.codigo} · {it.tipo === 'avulso' ? 'avulsa' : 'pedido'}
                      </div>
                    </div>
                    <button
                      className="mob-icone"
                      style={{ background: 'var(--red-bg)', borderColor: 'transparent', color: 'var(--red-fg)', width: 38, height: 38 }}
                      onClick={() => setItens((v) => v.filter((x) => x.insumoId !== it.insumoId))}
                      aria-label="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mob-item__par">
                    <div className="mob-item__qtd">
                      <span>Disponível</span>
                      <b>{num(saldo(it.insumoId).disponivel)} {it.unidade}</b>
                    </div>
                    <div className="mob-item__qtd">
                      <span>A transferir</span>
                      <b>{num(it.qtdEnviada)} {it.unidade}</b>
                    </div>
                  </div>
                  <p className="mob-dica" style={{ marginTop: 8 }}>
                    {brl(it.qtdEnviada * it.custoUnitario)}
                    {it.linhaOrcamento && (
                      <span style={{ display: 'block', color: 'var(--blue-fg)', fontWeight: 600, marginTop: 3 }}>
                        <Wallet size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                        {linhaPorId(it.linhaOrcamento)?.codigo} — {linhaPorId(it.linhaOrcamento)?.nome}
                      </span>
                    )}
                  </p>
                </div>
              ))}

              <button className="mob-btn" onClick={() => setSheetInsumo(true)} disabled={itens.length >= 20}>
                <Plus size={19} /> Adicionar insumo
              </button>

              {itens.length === 0 && (
                <p className="mob-dica" style={{ textAlign: 'center', marginTop: 16 }}>
                  Nenhum insumo ainda. A quantidade de cada um trava no momento da reserva.
                </p>
              )}

              {itens.length > 0 && (
                <>
                  <div className="mob-cartao" style={{ marginTop: 14 }}>
                    <div className="mob-linha">
                      <span className="mob-linha__r">Insumos</span>
                      <span className="mob-linha__v">{itens.length}/20</span>
                    </div>
                    <div className="mob-linha">
                      <span className="mob-linha__r">Custo apropriado</span>
                      <span className="mob-linha__v">{brl(custo)}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <MobAviso tom="info" titulo="Quantidade travada na reserva">
                      Ela não muda depois. Qualquer diferença só aparece na Avaliação de entrega,
                      quando o destino conferir o que chegou.
                    </MobAviso>
                  </div>
                </>
              )}
            </>
          )}

          {/* -------- Passo 3 -------- */}
          {passo === 2 && (
            <>
              <div className="mob-campo">
                <label className="mob-rot">Observação <i>*</i></label>
                <textarea
                  className="mob-textarea" placeholder="Contexto da saída, visível para o destino e o Aprovador."
                  value={observacao} onChange={(e) => setObservacao(e.target.value)}
                />
                {erros.includes('Observação') && <div className="mob-erro">A observação é obrigatória.</div>}
              </div>

              <div className="mob-campo">
                <label className="mob-rot">Assinatura <i>*</i></label>
                <MobAssinatura onMudar={setAssinatura} erro={erros.includes('Assinatura')} />
                {erros.includes('Assinatura') && <div className="mob-erro">Assine para registrar a saída.</div>}
              </div>

              <div className="mob-bloco">
                <div className="mob-bloco__t">Resumo</div>
                <div className="mob-cartao">
                  <div className="mob-linha">
                    <span className="mob-linha__r">Destino</span>
                    <span className="mob-linha__v">{obraDestino ? nomeObra(obraDestino) : '—'}</span>
                  </div>
                  <div className="mob-linha">
                    <span className="mob-linha__r">Insumos</span>
                    <span className="mob-linha__v">{itens.length}</span>
                  </div>
                  <div className="mob-linha">
                    <span className="mob-linha__r">Custo</span>
                    <span className="mob-linha__v">{brl(custo)}</span>
                  </div>
                </div>
              </div>

              {state.aprovacaoAtiva ? (
                <MobAviso tom="info" titulo="Esta saída não movimenta o estoque agora">
                  Ao salvar, a quantidade fica <strong>Reservada</strong> e a transferência segue para
                  aprovação da obra de destino. O material só sai do saldo no despacho.
                </MobAviso>
              ) : (
                <MobAviso tom="atencao" titulo="Aprovação desligada para este cliente">
                  A quantidade fica <strong>Reservada</strong> e a transferência vai direto para despacho.
                </MobAviso>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button className="mob-btn mob-btn--primario" onClick={avancar}>
          {passo < 2 ? <>Continuar <ChevronRight size={19} /></> : <><Lock size={18} /> Salvar saída e reservar</>}
        </button>
      </div>

      {sheetInsumo && (
        <SheetInsumo
          jaEscolhidos={itens.map((i) => i.insumoId)}
          obraDestino={obraDestino}
          onFechar={() => setSheetInsumo(false)}
          onAdicionar={(item) => { setItens((v) => [...v, item]); setSheetInsumo(false); }}
        />
      )}
    </>
  );
}

/* ---------------- Sheet de seleção de insumo ------------------ */
function SheetInsumo({
  jaEscolhidos, obraDestino, onFechar, onAdicionar,
}: {
  jaEscolhidos: string[];
  obraDestino: string;
  onFechar: () => void;
  onAdicionar: (i: TransferItem) => void;
}) {
  const { saldo } = useStore();
  const [busca, setBusca] = useState('');
  const [escolhido, setEscolhido] = useState('');
  const [qtd, setQtd] = useState('');
  const [linha, setLinha] = useState('');
  const [erro, setErro] = useState('');

  const insumo = INSUMOS.find((i) => i.id === escolhido);
  const disponivel = insumo ? saldo(insumo.id).disponivel : 0;
  const lista = INSUMOS
    .filter((i) => !jaEscolhidos.includes(i.id))
    .filter((i) => rotuloInsumo(i).toLowerCase().includes(busca.toLowerCase()));

  return (
    <Sheet
      titulo={insumo ? 'Quantidade a transferir' : 'Escolher insumo'}
      sub={insumo ? rotuloInsumo(insumo) : 'Saldos avulsos e de pedido são itens separados'}
      onFechar={onFechar}
      rodape={insumo ? (
        <>
          <button
            className="mob-btn mob-btn--primario"
            onClick={() => {
              const q = Number(qtd);
              if (!q || q <= 0) { setErro('Informe uma quantidade maior que zero.'); return; }
              if (q > disponivel) { setErro(`Acima do disponível (${num(disponivel)} ${insumo.unidade}).`); return; }
              if (insumo.tipo === 'pedido' && !linha) {
                setErro('Escolha a linha de orçamento para apropriar o custo.');
                return;
              }
              onAdicionar({
                insumoId: insumo.id, codigo: insumo.codigo, nome: insumo.nome, unidade: insumo.unidade,
                tipo: insumo.tipo, custoUnitario: insumo.custoUnitario,
                linhaOrcamento: insumo.tipo === 'pedido' ? linha : undefined,
                qtdEnviada: q, qtdRecebida: null,
              });
            }}
          >
            <Check size={19} /> Confirmar insumo
          </button>
          <button className="mob-btn mob-btn--sm" onClick={() => { setEscolhido(''); setQtd(''); setLinha(''); setErro(''); }}>
            Trocar insumo
          </button>
        </>
      ) : undefined}
    >
      {!insumo ? (
        <>
          <div className="mob-busca">
            <Search size={17} />
            <input placeholder="Buscar por código ou nome..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          {lista.length === 0 && <p className="mob-dica">Nenhum insumo encontrado.</p>}
          {lista.map((i) => (
            <button key={i.id} className="mob-opcao" onClick={() => setEscolhido(i.id)}>
              <div className="mob-opcao__txt">
                <div className="mob-opcao__nome">{i.nome}</div>
                <div className="mob-opcao__meta">
                  {i.codigo} · {i.tipo === 'avulso' ? 'avulsa' : 'pedido'} ·
                  {' '}{num(saldo(i.id).disponivel)} {i.unidade} disponível
                </div>
              </div>
              <ChevronRight size={17} color="var(--text-faint)" />
            </button>
          ))}
          <div style={{ height: 12 }} />
        </>
      ) : (
        <>
          <div className="mob-cartao" style={{ marginBottom: 16 }}>
            <div className="mob-linha">
              <span className="mob-linha__r">Estoque disponível</span>
              <span className="mob-linha__v">{num(disponivel)} {insumo.unidade}</span>
            </div>
            <div className="mob-linha">
              <span className="mob-linha__r">Custo unitário</span>
              <span className="mob-linha__v">{brl(insumo.custoUnitario)}</span>
            </div>
          </div>
          <div className="mob-campo">
            <label className="mob-rot">Quantidade para transferir <i>*</i></label>
            <input
              className="mob-input" type="number" inputMode="numeric" min={0} placeholder="0"
              value={qtd} onChange={(e) => { setQtd(e.target.value); setErro(''); }}
            />
            {erro && <div className="mob-erro">{erro}</div>}
            {insumo.tipo === 'avulso' && (
              <p className="mob-dica">Item avulso, sem apropriação necessária.</p>
            )}
          </div>

          {/* Apropriação de custos: só para item de pedido. */}
          {insumo.tipo === 'pedido' && (
            <div className="mob-campo">
              <label className="mob-rot"><Wallet size={15} /> Apropriação de custos <i>*</i></label>
              {LINHAS_ORCAMENTO.map((l) => (
                <button
                  key={l.id} className="mob-opcao" aria-pressed={linha === l.id}
                  onClick={() => { setLinha(l.id); setErro(''); }}
                >
                  <div className="mob-opcao__txt">
                    <div className="mob-opcao__nome">{rotuloLinha(l)}</div>
                    <div className="mob-opcao__meta">
                      Aqui {brl(l.disponivelPorObra[OBRA_ATUAL] ?? 0)}
                      {obraDestino && ` · ${nomeObra(obraDestino)} ${brl(l.disponivelPorObra[obraDestino] ?? 0)}`}
                    </div>
                  </div>
                  {linha === l.id && <Check size={18} className="mob-opcao__check" />}
                </button>
              ))}
              <p className="mob-dica">
                Item de pedido exige linha de orçamento. O saldo aparece para esta obra e para a de destino.
              </p>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
