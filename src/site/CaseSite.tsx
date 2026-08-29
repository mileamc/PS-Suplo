import { useEffect, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Mail, Monitor, Smartphone, Info, CornerDownRight,
  MoveHorizontal, ArrowUp,
} from 'lucide-react';
import {
  AUTOR, SECOES, ETAPAS, FLUXOGRAMAS, PRINTS, ATORES, ATOR_LEGENDA,
  NOTIFICACOES, FONTE_NOTIFICACOES, VERSOES, FORA_DE_ESCOPO,
} from './conteudo';
import { ROTAS } from '../state/rotas';

/* ============================================================
   Site de apresentação do case.
   Sistema visual "warm paper notebook": canvas #f6f5f4, cards
   brancos com fio de 1px, azul único para a ação primária e um
   elenco de acentos que pinta os blocos de destaque.
   O protótipo (seção 09) entra por iframe, sem alteração.
   ============================================================ */
export function CaseSite() {
  return (
    <div className="site">
      <NavSite />
      <Hero />
      <Introducao />
      <Overview />
      <Processo />
      <Fluxogramas />
      <Prints />
      <FluxoV1 />
      <FluxoEnriquecido />
      <Priorizacao />
      <Prototipo />
      <Encerramento />
      <Rodape />
    </div>
  );
}

const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

/* ---------------- Navegação --------------------------------- */
function NavSite() {
  const [ativa, setAtiva] = useState(SECOES[0].id);
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const aoRolar = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      setProgresso(total > 0 ? (doc.scrollTop / total) * 100 : 0);

      let atual = SECOES[0].id;
      for (const s of SECOES) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 140) atual = s.id;
      }
      if (total > 0 && doc.scrollTop >= total - 2) atual = SECOES[SECOES.length - 1].id;
      setAtiva(atual);
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  return (
    <nav className="site-nav">
      <div className="site-nav__barra">
        <div className="site-nav__marca">{AUTOR.nome} <span>· Case Suplos</span></div>
        <div className="site-nav__links">
          {SECOES.map((s) => (
            <button
              key={s.id} className="site-nav__link"
              aria-current={ativa === s.id} onClick={() => irPara(s.id)}
            >
              {s.curto}
            </button>
          ))}
        </div>
      </div>
      <div className="site-nav__progresso" style={{ width: `${progresso}%` }} />
    </nav>
  );
}

/* ---------------- Cabeçalho de seção ------------------------ */
function Cabecalho({
  id, centro, children,
}: { id: string; centro?: boolean; children?: React.ReactNode }) {
  const s = SECOES.find((x) => x.id === id)!;
  return (
    <div className={`secao__cabecalho ${centro ? 'secao__cabecalho--centro' : ''}`}>
      <span className="secao__numero">{s.numero} — {s.curto}</span>
      <h2 className="secao__titulo">{s.titulo}</h2>
      {children && <div className="secao__intro">{children}</div>}
    </div>
  );
}

/* ---------------- Diagrama ---------------------------------- */
function Diagrama({
  arquivo, legenda, minLargura = 900,
}: { arquivo: string; legenda: string; minLargura?: number }) {
  return (
    <figure className="diagrama">
      <div className="diagrama__janela">
        <img src={`/case/${arquivo}`} alt={legenda} style={{ minWidth: minLargura, width: '100%' }} />
      </div>
      <figcaption className="diagrama__legenda">
        <span>{legenda}</span>
        <span className="diagrama__dica">
          <MoveHorizontal size={13} style={{ verticalAlign: -2 }} /> arraste para ver
        </span>
      </figcaption>
    </figure>
  );
}

/* ---------------- Hero -------------------------------------- */
const MARCAS = [
  { emoji: '📦', cor: 'var(--signal-blue)' },
  { emoji: '🏗️', cor: 'var(--coral)' },
  { emoji: '🚚', cor: 'var(--marigold)' },
  { emoji: '📋', cor: 'var(--sky-wash)' },
  { emoji: '✅', cor: 'var(--signal-blue)' },
  { emoji: '⚠️', cor: 'var(--coral)' },
  { emoji: '🧱', cor: 'var(--marigold)' },
];

function Hero() {
  return (
    <header className="hero">
      <div className="site__larg">
        <div className="hero__marcas" aria-hidden="true">
          {MARCAS.map((m, i) => (
            <span className="marca-avatar" key={i} style={{ ['--c' as string]: m.cor }}>{m.emoji}</span>
          ))}
        </div>

        <h1 className="hero__titulo">
          Transferência de material <span className="pill-destaque">entre obras</span>
        </h1>

        <p className="hero__sub">
          Do diagnóstico do problema até um protótipo funcional. Este site apresenta o processo
          inteiro na ordem em que ele aconteceu — incluindo os pontos em que discordei do material
          recebido, e por quê.
        </p>

        <div className="hero__ctas">
          <button className="btn-primario" onClick={() => irPara('prototipo')}>
            Ver o protótipo <ArrowRight size={16} />
          </button>
          <button className="btn-fantasma" onClick={() => irPara('overview')}>
            Começar pelo processo
          </button>
        </div>

        <div className="hero__meta">
          <div>
            <span className="hero__meta-rot">Produto</span>
            <span className="hero__meta-val">Suplos · gestão de suprimentos</span>
          </div>
          <div>
            <span className="hero__meta-rot">Recorte</span>
            <span className="hero__meta-val">MVP + protótipo web e mobile</span>
          </div>
          <div>
            <span className="hero__meta-rot">Seções</span>
            <span className="hero__meta-val">10 · em ordem cronológica</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- 01 · Introdução --------------------------- */
function Introducao() {
  return (
    <section className="secao" id="introducao">
      <div className="site__larg">
        <Cabecalho id="introducao" />
        <div className="secao__corpo">
          <div className="card-acento" style={{ ['--bg-acento' as string]: 'var(--marigold)', padding: 40 }}>
            <div style={{ display: 'grid', gap: 20, maxWidth: '62ch', fontFamily: 'var(--serif)', fontSize: 18, lineHeight: 1.56 }}>
              <p>
                Oi! Antes de qualquer coisa, obrigada pela oportunidade de chegar até essa etapa — sei
                que o volume de candidaturas foi grande, e fico feliz de estar aqui.
              </p>
              <p>
                Esse case foi desenhado com lacunas de propósito, e decidi tratar isso como parte do
                desafio, não como um obstáculo. Em vez de desenhar telas direto, segui um processo:
                primeiro entendi a marca e o produto, depois analisei as telas que já existem,
                destrinchei as dores e os objetivos por trás do pedido, mapeei os pontos de fricção do
                fluxo atual, modelei os estados que resolvem esses pontos, e só então parti para a
                produção das telas.
              </p>
              <p>
                Esse site apresenta esse processo do início ao fim, na ordem em que ele aconteceu —
                incluindo os pontos em que discordei do material que vocês me deram, e por quê.
              </p>
            </div>
          </div>
          <p className="nota-rodape">Material bônus, complementar à apresentação ao vivo.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 02 · Overview ----------------------------- */
function Overview() {
  return (
    <section className="secao" id="overview">
      <div className="site__larg">
        <Cabecalho id="overview" />
        <div className="secao__corpo" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <article className="card">
            <h3 className="card__titulo">O problema, resumido</h3>
            <p className="card__corpo">
              Hoje, transferir material entre obras é uma ação instantânea — o saldo sai da origem e
              entra no destino no mesmo clique, sem aprovação, sem reserva, sem confirmação de que o
              material chegou. Na prática, o caminhão leva de 3 a 7 dias, e a quantidade que sai pode
              não ser igual à que chega. O sistema atual não modela esse intervalo nem essa divergência.
            </p>
          </article>
          <article className="card-acento" style={{ ['--bg-acento' as string]: 'var(--sky-tint)' }}>
            <h3 className="card__titulo">Minha abordagem</h3>
            <p className="card__corpo" style={{ color: 'var(--graphite)' }}>
              Em vez de ir direto para o desenho de telas, tratei isso primeiro como um problema de{' '}
              <strong>modelagem de estados</strong> — o que a transferência "é" em cada momento do
              tempo — e só depois decidi como isso aparece na interface. Acredito que essa ordem
              produz uma solução mais sólida, porque separa "o que o sistema faz" de "como isso é
              mostrado", e evita que decisões de UI escondam buracos de lógica.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 03 · Processo ----------------------------- */
const CORES_ETAPA = [
  ['var(--sky-tint)', 'var(--notion-blue)'],
  ['#ffeccc', '#8a5a00'],
  ['#fde3df', '#b3230f'],
  ['var(--sky-tint)', 'var(--notion-blue)'],
  ['#ffeccc', '#8a5a00'],
  ['#fde3df', '#b3230f'],
  ['var(--sky-tint)', 'var(--notion-blue)'],
];

function Processo() {
  return (
    <section className="secao" id="processo">
      <div className="site__larg">
        <Cabecalho id="processo" />
        <div className="secao__corpo">
          <ol className="etapas">
            {ETAPAS.map((e, i) => (
              <li className="card etapa" key={e.titulo}>
                <span
                  className="etapa__num"
                  style={{ ['--bg-n' as string]: CORES_ETAPA[i][0], ['--fg-n' as string]: CORES_ETAPA[i][1] }}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="etapa__titulo">{e.titulo}</h3>
                  <p className="etapa__texto">{e.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 04 · Fluxogramas -------------------------- */
function Fluxogramas() {
  return (
    <section className="secao" id="fluxogramas">
      <div className="site__larg">
        <Cabecalho id="fluxogramas">
          <p>
            Os três fluxogramas que vocês forneceram (Criação, Aprovação, Recebimento) vieram com uma
            instrução explícita: questionar o que não fizesse sentido. Encontrei três pontos que
            valem discussão — um deles, inclusive, uma contradição real dentro do próprio material.
          </p>
        </Cabecalho>

        <div className="secao__corpo">
          <div className="discordancias">
            {FLUXOGRAMAS.map((f) => (
              <article className={`disc disc--${f.tom}`} key={f.fluxo}>
                <div className="disc__topo">
                  <h3 className="disc__fluxo">{f.fluxo}</h3>
                  <span className={`selo selo--${f.tom}`}>
                    {f.tom === 'discordancia' ? 'discordância' : 'premissa'}
                  </span>
                </div>
                <p className="disc__texto">{f.texto}</p>
              </article>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <div className="legenda-cores">
              <span><i style={{ background: '#0b3a6f' }} /> no diagrama: discordância / proposta</span>
              <span><i style={{ background: '#5b9fe0' }} /> pergunta / premissa confirmada</span>
            </div>
            <Diagrama
              arquivo="fluxogramas_originais_comentados.svg"
              legenda="Os três fluxogramas originais com os comentários e as propostas sobrepostos."
              minLargura={860}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 05 · Prints ------------------------------- */
function Prints() {
  return (
    <section className="secao" id="prints">
      <div className="site__larg">
        <Cabecalho id="prints">
          <p>
            Antes de desenhar qualquer coisa nova, fiz um diagnóstico visual em cima do produto como
            ele existe hoje. Cada marcação abaixo liga um ponto específico da interface a uma dor
            real (dos prints e do vídeo de apresentação) e, quando aplicável, ao estado do fluxo novo
            que resolve aquilo.
          </p>
          <p>
            O achado que mais gostei: o modal de "Detalhes do Pedido" (para pedidos de compra) já
            tem, hoje, uma comparação lado a lado entre quantidade pedida e quantidade recebida. Isso
            não é um recurso que estou inventando — é um padrão que a Suplos já usa em outro lugar do
            produto. Meu trabalho foi reconhecer esse padrão e propor que ele seja reaproveitado para
            transferências entre obras, em vez de criar algo do zero.
          </p>
        </Cabecalho>

        <div className="secao__corpo">
          <div className="prints">
            {PRINTS.map((p, i) => (
              <article className="print" key={p.arquivo}>
                <div className="print__cabecalho">
                  <h3 className="print__titulo">Print {i + 1} — {p.titulo}</h3>
                  {p.legenda && <span className="print__legenda">{p.legenda}</span>}
                </div>
                <div className="print__janela">
                  <img
                    src={`/case/${p.arquivo}`} alt={`Print anotado: ${p.titulo}`}
                    style={{ minWidth: 780, width: '100%' }}
                  />
                </div>
                <div className="print__achados">
                  {p.achados.map((a) => (
                    <div className="achado" key={a.n}>
                      <span className="achado__n">{a.n}</span>
                      <div>
                        <h4 className="achado__titulo">{a.titulo}</h4>
                        {a.texto && <p className="achado__texto">{a.texto}</p>}
                        {a.resolucao && (
                          <div className="achado__resolucao">
                            <CornerDownRight size={15} />
                            <span>{a.resolucao}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 06 · Fluxo V1 ----------------------------- */
function FluxoV1() {
  return (
    <section className="secao" id="fluxo-v1">
      <div className="site__larg">
        <Cabecalho id="fluxo-v1">
          <p>
            Esse é o resultado da etapa de modelagem: a transferência deixa de ser uma ação única e
            passa a ter um ciclo de vida — reservada, aguardando aprovação, em trânsito, avaliada na
            entrega, e recebida (com ou sem divergência), com os devidos caminhos de reprovação e
            cancelamento.
          </p>
        </Cabecalho>

        <div className="secao__corpo">
          <Diagrama
            arquivo="fluxo_transferencia_v1_linha_unica.svg"
            legenda="Fluxo de transferência V1 — o ciclo de vida completo, só de estados."
            minLargura={1100}
          />

          <div className="card-acento" style={{ ['--bg-acento' as string]: 'var(--coral)', color: '#fff', marginTop: 16 }}>
            <h3 className="card__titulo" style={{ color: '#fff' }}>Uma decisão que assumo e defendo</h3>
            <p className="card__corpo" style={{ color: 'rgba(255,255,255,.92)' }}>
              Quando há divergência e o remetente decide reenviar o material faltante, o fluxo volta
              para o estado <strong>Reservado</strong>, não direto para "Em trânsito" — e passa pela
              aprovação de novo, do zero. Isso custa mais fricção para quem já errou uma vez, mas
              evita reabrir exatamente a brecha que esse case pede para fechar: material saindo do
              estoque sem nenhuma validação.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 07 · Fluxo enriquecido -------------------- */
function FluxoEnriquecido() {
  return (
    <section className="secao" id="fluxo-enriquecido">
      <div className="site__larg">
        <Cabecalho id="fluxo-enriquecido">
          <p>
            Aqui eu pego o mesmo fluxo de estados e acrescento a camada que estava faltando: em qual
            modal, mensagem ou aba cada transição aparece — no mesmo nível de detalhe que os
            fluxogramas originais de vocês tinham.
          </p>
          <p>
            Ao lado, a tabela de atores responde a uma exigência específica do material (<em>"cada
            estado permite ações diferentes para pessoas diferentes"</em>): quem decide o quê, em cada
            estado. Simplifiquei para dois papéis — Origem e Destino — porque, como o próprio
            glossário de vocês confirma, o papel de aprovador é configurável por cliente; não faz
            sentido eu fixar um cargo específico.
          </p>
          <p>
            Um detalhe que só descobri ouvindo o vídeo de apresentação com atenção (não estava em
            nenhum slide): a confirmação de recebimento é o único evento do fluxo inteiro que notifica
            as três partes ao mesmo tempo — origem, aprovador e destino. Isso está registrado na
            tabela de notificações, separada da tabela de decisão, porque nem sempre quem decide é
            quem precisa saber.
          </p>
        </Cabecalho>

        <div className="secao__corpo">
          <Diagrama
            arquivo="fluxo_v1_enriquecido.svg"
            legenda="O mesmo fluxo, agora com os touchpoints de UI — modal, mensagem e aba — em cada transição."
            minLargura={1200}
          />
          <div style={{ marginTop: 16 }}><TabelaAtores /></div>
          <div style={{ marginTop: 16 }}><TabelaNotificacoes /></div>
        </div>
      </div>
    </section>
  );
}

function TabelaAtores() {
  return (
    <div className="tabela-bloco">
      <div className="tabela-bloco__cabecalho">
        <h3 className="tabela-bloco__titulo">Quem age em cada estado</h3>
        <p className="tabela-bloco__sub">
          Dois papéis: origem (obra que envia) e destino (obra que recebe — quem exatamente, o
          cliente configura).
        </p>
      </div>
      <div className="tabela-rolagem">
        <table className="tabela-site">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Estado</th>
              <th style={{ width: '22%' }}>Quem age</th>
              <th>Ação possível</th>
            </tr>
          </thead>
          <tbody>
            {ATORES.map((a) => (
              <tr key={a.estado}>
                <td className="estado">{a.estado}</td>
                <td>
                  <span className={`pilula pilula--${a.ator}`}>{ATOR_LEGENDA[a.ator]}</span>
                  {a.atorNota && <span className="pilula-nota">{a.atorNota}</span>}
                  {a.ator === 'nenhum' && <span className="pilula-nota">nenhum ator ativo</span>}
                </td>
                <td>{a.acao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabelaNotificacoes() {
  return (
    <div className="tabela-bloco">
      <div className="tabela-bloco__cabecalho">
        <h3 className="tabela-bloco__titulo">Quem é notificado em cada transição</h3>
        <p className="tabela-bloco__sub">
          Complementa a tabela de atores: aquela responde "quem decide", esta responde "quem é
          avisado" — podem ser pessoas diferentes.
        </p>
      </div>
      <div className="tabela-rolagem">
        <table className="tabela-site">
          <thead>
            <tr>
              <th style={{ width: '30%' }}>Transição / evento</th>
              <th className="cel-centro">Origem</th>
              <th className="cel-centro">Aprovador</th>
              <th className="cel-centro">Destino</th>
              <th>Por quê</th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICACOES.map((n) => (
              <tr key={n.transicao} className={n.tripla ? 'destaque' : undefined}>
                <td className="estado">
                  {n.transicao}
                  {n.tripla && <span className="selo-tripla">notificação tripla</span>}
                </td>
                {[n.origem, n.aprovador, n.destino].map((v, i) => (
                  <td className="cel-centro" key={i}>
                    {v ? <span className="ponto" title="notificado" />
                      : <span className="ponto ponto--vazio" title="não é notificado" />}
                  </td>
                ))}
                <td>{n.nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="nota-rodape" style={{ margin: '0 24px 24px' }}>{FONTE_NOTIFICACOES}</p>
    </div>
  );
}

/* ---------------- 08 · Priorização -------------------------- */
const ESTILO_VERSAO: Record<string, React.CSSProperties> = {
  mvp: { ['--bg-v' as string]: 'var(--marigold)', ['--bd-v' as string]: 'transparent', ['--bd-nota' as string]: 'rgba(0,0,0,.16)' },
  v1: { ['--bg-v' as string]: 'var(--sky-wash)', ['--bd-v' as string]: 'transparent', ['--bd-nota' as string]: 'rgba(0,0,0,.16)' },
  v2: { ['--bg-v' as string]: 'var(--white)' },
  v3: { ['--bg-v' as string]: 'var(--midnight)', ['--fg-v' as string]: 'var(--white)', ['--bd-v' as string]: 'transparent', ['--bd-nota' as string]: 'rgba(255,255,255,.2)' },
};

function Priorizacao() {
  return (
    <section className="secao" id="priorizacao">
      <div className="site__larg">
        <Cabecalho id="priorizacao">
          <p>
            Eu não escolhi o que construir primeiro por preferência pessoal — ancorei a priorização
            nos quatro pedidos explícitos que o time de CS trouxe (aprovação obrigatória, reserva,
            confirmação de recebimento, visibilidade por obra). Os quatro têm o mesmo peso no
            material, então os quatro entram no MVP.
          </p>
        </Cabecalho>

        <div className="secao__corpo">
          <div className="versoes">
            {VERSOES.map((v) => (
              <article className="versao" key={v.chave} style={ESTILO_VERSAO[v.chave]}>
                <div className="versao__rotulo">{v.rotulo}</div>
                <p className="versao__chamada">{v.chamada}</p>
                <div className="versao__rot">Inclui</div>
                <ul className="versao__lista">
                  {v.inclui.map((i) => (
                    <li className="versao__item" key={i.titulo}>
                      {i.titulo}
                      {i.detalhe && <em>{i.detalhe}</em>}
                    </li>
                  ))}
                </ul>
                {v.nota && (
                  <div className="versao__nota">
                    <div className="versao__nota-caixa">
                      <span className="versao__nota-titulo">{v.notaTitulo}</span>
                      {v.nota}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>

          <p className="fora-escopo">{FORA_DE_ESCOPO}</p>

          <div style={{ marginTop: 16 }}>
            <Diagrama
              arquivo="mvp_v1_v2_v3.svg"
              legenda="A priorização completa, com o raciocínio de cada versão."
              minLargura={1000}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 09 · Protótipo ---------------------------- */
function Prototipo() {
  const base = window.location.origin.replace(/^https?:\/\//, '');
  return (
    <section id="prototipo" style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div className="proto">
        <div className="proto__interno">
          <Cabecalho id="prototipo">
            <p>
              Depois de validar o modelo de estados, o próximo passo foi trazer isso para telas de
              verdade — reaproveitando a identidade visual da Suplos e os padrões que já existem no
              produto (como a comparação "pedido x recebido"), em vez de propor um visual do zero.
            </p>
            <p>
              Abaixo está o protótipo funcional, navegável tanto na versão web (fluxo de criação e
              aprovação, pensado para quem trabalha no escritório) quanto na versão mobile (fluxo de
              recebimento, pensado para quem está no canteiro). Ele cobre o recorte do MVP descrito
              acima, incluindo o estado de recebimento com divergência — o caminho "não-feliz" que o
              case pede que apareça no recorte de alta-fidelidade.
            </p>
          </Cabecalho>

          <div className="proto__aviso">
            <Info size={17} />
            <span>
              O protótipo abaixo é uma peça funcional à parte, com a identidade visual da Suplos — por
              isso ele não segue a paleta deste site. Ele é interativo de verdade: pode clicar, criar
              uma transferência, aprovar, despachar e registrar divergência.
            </span>
          </div>

          <div className="proto__web">
            <div className="proto__rot"><Monitor size={14} /> Versão web · criação e aprovação</div>
            <div className="frame-nav">
              <div className="frame-nav__barra">
                <div className="frame-nav__bolas"><i /><i /><i /></div>
                <div className="frame-nav__url">{base}{ROTAS.transferencias}</div>
              </div>
              <div className="frame-nav__viewport">
                <iframe src={ROTAS.transferencias} title="Protótipo — versão web" />
              </div>
            </div>
            <div className="proto__acoes">
              <a className="btn-proto btn-proto--primario" href={ROTAS.transferencias} target="_blank" rel="noreferrer">
                Abrir em tela cheia <ArrowUpRight size={15} />
              </a>
              <a className="btn-proto" href={ROTAS.estoque} target="_blank" rel="noreferrer">
                Ver a tela de Estoque <ArrowRight size={15} />
              </a>
            </div>
          </div>

          <div className="proto__mobile">
            <div>
              <div className="proto__rot"><Smartphone size={14} /> Versão mobile · o mesmo fluxo no canteiro</div>
              <div className="frame-cel">
                <div className="frame-cel__tela">
                  <iframe src="/embed/mobile" title="Protótipo — versão mobile" />
                </div>
              </div>
              <div className="proto__acoes" style={{ justifyContent: 'center' }}>
                <a className="btn-proto" href={ROTAS.mobile} target="_blank" rel="noreferrer">
                  Abrir em tela cheia <ArrowUpRight size={15} />
                </a>
              </div>
            </div>

            <div className="proto__mobile-texto">
              <p style={{ marginBottom: 16 }}>
                A versão mobile cobre o mesmo fluxo da web — reserva, aprovação, despacho, conferência
                e divergência — com a navegação reorganizada para uma mão só: quatro abas na base,
                pilha para os fluxos longos, e bottom sheets para as decisões curtas.
              </p>
              <p>
                O modal de duas colunas do web virou um passo a passo de três etapas. Os alvos têm
                54&nbsp;px e não existe tabela em lugar nenhum, porque quem confirma o recebimento
                está no canteiro, no sol, de luva, com conexão ruim. "Chegou tudo certo" resolve o
                caso comum em um toque; a divergência só aparece quando alguma quantidade muda.
              </p>
            </div>
          </div>

          <div className="proto__dicas">
            <div className="proto__dica" style={{ ['--bg-d' as string]: 'var(--marigold)', ['--fg-d' as string]: 'var(--ink)' }}>
              <strong>Troque de papel</strong>
              <span>
                Alterna entre Origem, Aprovador e Destino — e as ações disponíveis mudam junto,
                seguindo a tabela de atores da seção 07. No web fica na barra do topo; no mobile, no
                ícone de controles.
              </span>
            </div>
            <div className="proto__dica" style={{ ['--bg-d' as string]: 'var(--sky-wash)', ['--fg-d' as string]: 'var(--ink)' }}>
              <strong>Desligue a aprovação</strong>
              <span>
                O parâmetro por cliente da seção 04 é um interruptor real: desligado, o estado
                "Aguardando aprovação" some do fluxo, sem duplicar nenhuma lógica.
              </span>
            </div>
            <div className="proto__dica" style={{ ['--bg-d' as string]: 'var(--coral)', ['--fg-d' as string]: 'var(--white)' }}>
              <strong>Veja a divergência</strong>
              <span>
                A transferência TR-000136 já está no estado "Recebido com divergência" — saíram 120,
                chegaram 92, com o motivo registrado para auditoria.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 10 · Encerramento ------------------------- */
function Encerramento() {
  return (
    <section className="secao fim" id="encerramento">
      <div className="site__larg">
        <Cabecalho id="encerramento" />
        <div className="secao__corpo">
          <p className="fim__texto">
            Esse foi meu processo do início ao fim: entender antes de desenhar, questionar o que não
            fazia sentido, e tomar decisões que eu conseguisse defender — inclusive as que
            envolveram dizer não a alguma coisa. Obrigada por chegarem até aqui comigo, e fico à
            disposição para detalhar qualquer ponto na apresentação.
          </p>
          <div className="fim__contato">
            <a className="btn-primario" href={`mailto:${AUTOR.email}`}>
              <Mail size={16} /> {AUTOR.email}
            </a>
            <button className="btn-texto" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Voltar ao início <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="rodape">
      <div className="site__larg">
        <div className="rodape__linha">
          <span><span className="rodape__nome">{AUTOR.nome}</span> · {AUTOR.papel}</span>
          <span>Case Suplos · transferência de material entre obras</span>
        </div>
      </div>
    </footer>
  );
}
