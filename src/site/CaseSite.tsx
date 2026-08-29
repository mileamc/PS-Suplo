import { useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowRight, ArrowUpRight, Mail, Monitor, Smartphone, Info,
  MoveHorizontal, ArrowUp,
} from 'lucide-react';
import {
  AUTOR, SECOES, ETAPAS, FLUXOGRAMAS, ATORES, ATOR_LEGENDA,
  NOTIFICACOES, FONTE_NOTIFICACOES, VERSOES, FORA_DE_ESCOPO,
} from './conteudo';
import { ROTAS } from '../state/rotas';

/* ============================================================
   Site de apresentação do case.
   Sistema visual "warm paper notebook": canvas #f6f5f4, cards
   brancos com fio de 1px, azul único para a ação primária e um
   elenco de acentos que pinta os blocos de destaque.
   O protótipo entra por iframe e mantém a identidade da Suplos.
   ============================================================ */
export function CaseSite() {
  return (
    <div className="site">
      <NavSite />
      <Hero />
      <Overview />
      <Prototipo />
      <Processo />
      <Fluxogramas />
      <FluxoV1 />
      <FluxoEnriquecido />
      <FluxoTelas />
      <Priorizacao />
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
            <span className="hero__meta-val">Fluxo completo + protótipo web e mobile</span>
          </div>
          <div>
            <span className="hero__meta-rot">Seções</span>
            <span className="hero__meta-val">9 · protótipo logo no começo</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- 01 · Overview ----------------------------- */
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

          <div className="fluxos-digitalizados">
            <div className="legenda-cores">
              <span><i style={{ background: '#0b3a6f' }} /> no diagrama: discordância / proposta</span>
              <span><i style={{ background: '#5b9fe0' }} /> pergunta / premissa confirmada</span>
            </div>
            <Diagrama
              arquivo="fluxo_original_1_criacao.svg"
              legenda="Fluxo 1 — Criação. Redesenhado digitalmente sem mudar caixas, caminhos ou conteúdo; as perguntas ficam fora do fluxo."
              minLargura={1300}
            />
            <Diagrama
              arquivo="fluxo_original_2_aprovacao.svg"
              legenda="Fluxo 2 — Aprovação. As árvores ON e OFF foram preservadas exatamente como no original, inclusive a repetição questionada."
              minLargura={1900}
            />
            <Diagrama
              arquivo="fluxo_original_3_recebimento.svg"
              legenda="Fluxo 3 — Recebimento. Os dois pontos de entrada e a FVM opcional permanecem como enviados; a anotação registra o que foi revisto no meu fluxo."
              minLargura={1600}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 05 · Fluxo V1 ----------------------------- */
function FluxoV1() {
  return (
    <section className="secao" id="fluxo-v1">
      <div className="site__larg">
        <Cabecalho id="fluxo-v1">
          <p>
            Esse fluxo foi revisado olhando somente para o que o protótipo faz hoje. Ao salvar, a
            transferência já nasce como <strong>Reservado · aprovação pendente</strong>; depois passa
            por decisão do aprovador, despacho, trânsito, chegada, FVM e confirmação da nota fiscal.
            Não há atalhos ou parâmetros que não possam ser demonstrados na interface.
          </p>
          <p>
            A chegada e a entrada no estoque continuam separadas: alegar recebimento tira o material
            da estrada, mas só a FVM confere enviado × recebido e dá entrada no destino. Com
            divergência, NF e decisão da origem viram pendências paralelas; confirmar a NF não fecha
            o caso. A origem encerra assumindo a falta ou reserva apenas o saldo faltante e reinicia a
            aprovação.
          </p>
        </Cabecalho>

        <div className="secao__corpo">
          <Diagrama
            arquivo="fluxo_transferencia_v1_linha_unica.svg"
            legenda="Fluxo de transferência V1 — o ciclo de vida completo, só de estados."
            minLargura={2000}
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

/* ---------------- 06 · Fluxo enriquecido -------------------- */
function FluxoEnriquecido() {
  return (
    <section className="secao" id="fluxo-enriquecido">
      <div className="site__larg">
        <Cabecalho id="fluxo-enriquecido">
          <p>
            Aqui eu pego o mesmo fluxo de estados e acrescento a camada que estava faltando: em qual
            modal, mensagem ou aba cada transição aparece — no mesmo nível de detalhe que os
            fluxogramas originais de vocês tinham. O diagrama agora acompanha o protótipo: inclui o
            drawer de detalhe, a seção de aprovação, os modais de despacho, chegada, FVM, NF,
            cancelamento e a decisão da origem diante da divergência.
          </p>
          <p>
            Ao lado, a tabela de atores responde a uma exigência específica do material (<em>"cada
            estado permite ações diferentes para pessoas diferentes"</em>): quem decide o quê, em cada
            estado. Simplifiquei para dois papéis — Origem e Destino — porque, como o próprio
            glossário de vocês confirma, o papel de aprovador é configurável por cliente; no
            protótipo, a própria empresa aprova o que chega e a outra ponta é simulada apenas quando
            precisa aprovar o que sai.
          </p>
          <p>
            Um detalhe que só descobri ouvindo o vídeo de apresentação com atenção (não estava em
            nenhum slide): a confirmação de recebimento precisa notificar as três partes ao mesmo
            tempo — origem, aprovador e destino. No protótipo, esse mesmo alcance é repetido quando a
            divergência é encerrada, para fechar o ciclo com todos cientes. A tabela de notificações
            fica separada da tabela de decisão porque nem sempre quem decide é quem precisa saber.
          </p>
        </Cabecalho>

        <div className="secao__corpo">
          <Diagrama
            arquivo="fluxo_v1_enriquecido.svg"
            legenda="O mesmo fluxo, agora com os touchpoints de UI — modal, mensagem e aba — em cada transição."
            minLargura={2000}
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

/* ---------------- 07 · Fluxo de telas ----------------------- */
function FluxoTelas() {
  return (
    <section className="secao" id="fluxo-telas">
      <div className="site__larg">
        <Cabecalho id="fluxo-telas">
          <p>
            O modelo de estados explica o que acontece com a transferência; este mapa mostra onde
            cada ação acontece. Ele conecta rotas, abas, drawer, modais e bottom sheets das versões
            web e mobile, deixando explícito que as duas experiências escrevem na mesma entidade e
            compartilham saldos, histórico, notificações e regras de permissão.
          </p>
        </Cabecalho>

        <div className="secao__corpo">
          <Diagrama
            arquivo="fluxo_telas_prototipo.svg"
            legenda="Mapa completo das telas e sobreposições do protótipo, com as conexões entre web, mobile e a máquina de estados compartilhada."
            minLargura={2000}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------------- 08 · Priorização -------------------------- */
const ESTILO_VERSAO: Record<string, CSSProperties> = {
  mvp: {
    ['--bg-v' as string]: 'var(--marigold)',
    ['--bd-v' as string]: 'transparent',
    ['--bd-nota' as string]: 'rgba(0,0,0,.16)',
  },
  v1: {
    ['--bg-v' as string]: 'var(--sky-wash)',
    ['--bd-v' as string]: 'transparent',
    ['--bd-nota' as string]: 'rgba(0,0,0,.16)',
  },
  v2: { ['--bg-v' as string]: 'var(--white)' },
  v3: {
    ['--bg-v' as string]: 'var(--midnight)',
    ['--fg-v' as string]: 'var(--white)',
    ['--bd-v' as string]: 'transparent',
    ['--bd-nota' as string]: 'rgba(255,255,255,.2)',
  },
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
        </div>
      </div>
    </section>
  );
}

/* ---------------- 02 · Protótipo ---------------------------- */
function Prototipo() {
  const base = window.location.origin.replace(/^https?:\/\//, '');
  return (
    <section id="prototipo" style={{ paddingTop: 8, paddingBottom: 8 }}>
      <div className="proto">
        <div className="proto__interno">
          <div className="proto__topo">
            <div className="proto__apresentacao">
              <Cabecalho id="prototipo">
                <p>
                  Este é o resultado, antes do percurso: um protótipo funcional, navegável tanto na
                  versão web quanto na mobile. Ele reaproveita a identidade visual da Suplos e padrões
                  que já existem no produto — como a comparação "pedido × recebido" — em vez de propor
                  um visual desconectado do produto atual.
                </p>
                <p>
                  O fluxo completo pode ser percorrido: criar, aprovar, despachar, alegar chegada,
                  conferir, anexar a NF e resolver uma divergência. As seções seguintes mostram os
                  três originais digitalizados, o que foi questionado e como cada decisão aparece no
                  modelo de estados e nas telas.
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
            </div>

            {/* TODO(case): revisar esta lista sempre que uma ação ou estado novo entrar no protótipo. */}
            <aside className="proto__resumo" aria-label="O que o protótipo acrescenta ao fluxo original">
              <span className="proto__resumo-rot">Em relação ao fluxo original</span>
              <h3>O que foi acrescentado ao protótipo</h3>
              <ul>
                <li><strong>Separação por obra e direção:</strong> o mesmo registro aparece como “Saindo” na origem e “Chegando” no destino.</li>
                <li><strong>Reserva real:</strong> o saldo fica travado, mas não sai do estoque antes do despacho.</li>
                <li><strong>Aprovação explícita:</strong> a obra que recebe aprova ou reprova; a outra empresa pode ser simulada.</li>
                <li><strong>Despacho rastreável:</strong> data efetiva de saída e previsão de chegada ficam no histórico.</li>
                <li><strong>Chegada separada da conferência:</strong> alegar recebimento não dá entrada no estoque; a FVM faz isso.</li>
                <li><strong>Divergência acionável:</strong> a origem recebe aviso crítico e decide entre reenviar o saldo ou assumir a falta.</li>
                <li><strong>NF como pendência própria:</strong> confirmar a nota não apaga uma divergência ainda aberta.</li>
                <li><strong>Auditoria e visibilidade:</strong> status, timeline, notificações, atrasos e saldos são compartilhados por web e mobile.</li>
              </ul>
            </aside>
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
              <strong>Crie uma transferência</strong>
              <span>
                Ao salvar, a quantidade já fica reservada e a transferência entra na aprovação — sem
                um segundo clique e sem movimentar o estoque antes do despacho.
              </span>
            </div>
            <div className="proto__dica" style={{ ['--bg-d' as string]: 'var(--sky-wash)', ['--fg-d' as string]: 'var(--ink)' }}>
              <strong>Simule a outra empresa</strong>
              <span>
                Depois de criar, o botão do aprovador externo acende. A seção adicional permite
                aprovar ou reprovar o que saiu desta obra e então voltar ao painel da própria empresa.
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

/* ---------------- 09 · Encerramento ------------------------- */
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
