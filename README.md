# Suplos — Transferência de Material entre Obras

Protótipo funcional em React (web + mobile) do fluxo de transferência de material entre obras.
Fonte de verdade: `especificacao_transferencia_entre_obras.md` (estados, quem decide, quem é
notificado, telas que mudam) + o fluxograma **Fluxo de transferência V1**.

```bash
npm install
npm run dev       # http://localhost:5173/  → site do case
npm run build && npm run preview
```

O repositório entrega duas coisas: o **site de apresentação do case** (`/`) e o
**protótipo funcional** (`/stocks/...`), que o site embute em frames de navegador e de celular.

---

## O que o protótipo resolve

Hoje a transferência é uma ação única e instantânea: ao salvar a Saída de Estoque do tipo
Transferência, o saldo sai da origem e entra no destino no mesmo clique. Na realidade o material
leva de 3 a 7 dias no caminhão e a quantidade que sai pode não ser a que chega.

Este protótipo modela esse intervalo e essa divergência.

---

## Rotas

| Caminho | Tela |
|---|---|
| `/` | Site de apresentação do case — 9 seções, do diagnóstico ao mapa de telas |
| `/embed/mobile` | Protótipo mobile sem moldura, para o frame de celular do site |
| `/stocks` | Estoque de Materiais (cards + abas Estoque / Movimentações) |
| `/stocks/transfers` | Painel de visibilidade por obra — **A Enviar** e **A Receber** |
| `/stocks/transfers/:id` | Detalhe da transferência (drawer com estado, dados e histórico) |
| `/stocks/transfers/receiving` | Tela mobile de confirmação de recebimento (almoxarife) |

Os caminhos seguem os citados no fluxograma (*"card em /stocks/transfers (2 obras)"*,
*"aba /stocks/transfers atualizada"*).

---

## Barra de demonstração (topo)

O protótipo é o painel de **uma empresa só** — a obra atual. Ela é a origem no que sai daqui e o
destino no que chega, e como o Aprovador é sempre da obra que recebe, ela também aprova o que chega
até ela. Não há troca de persona: em qualquer tela, quem age é ela.

Sobra um único papel que ela não tem: o **Aprovador da outra empresa**, que precisa dar o ok no que
sai daqui. Sem ele o fluxo não fecha dentro de um painel único — e é só isso que a barra do topo
ainda faz:

- **Aprovador da outra empresa** — o protótipo abre com a fila vazia e o botão apagado: nada nasce
  esperando o ok de fora. Quando o próprio usuário cria uma transferência e ela para na aprovação, o
  botão acende, pulsa e se anuncia num balão. Ao entrar, a tela continua sendo um painel completo —
  quem aprova precisa ver o que já mandou, o que está na estrada e o que chegou para decidir bem — e
  ganha uma **seção a mais no topo**, "Aguardando sua aprovação", onde a decisão acontece com as duas
  ações à mão, sem abrir a transferência. Uma faixa lembra o tempo todo que aquilo não é o painel da
  própria obra. Aprovado o que havia, um aviso traz o usuário de volta e o botão apaga de novo. No
  modo apagado, o hover explica que ele só liga quando alguma transferência espera o ok de quem vai
  receber.
- **Estado da tela** — Normal / Carregando / Vazio / Erro (seção 11).

A aprovação obrigatória (o parâmetro por cliente da seção 2) deixou de ser um interruptor na barra e
passou a ficar sempre ligada: é ela que cria a única pendência da outra empresa, e sem ela o modo de
simulação não teria o que resolver.

---

## Conformidade com o fluxograma V1

| Fluxograma | Onde está no protótipo |
|---|---|
| Entrada **Requisição de material** (pedido interno da obra) | Campo "Origem da transferência" → *Requisição de material*, com seletor que puxa insumos e quantidades da requisição |
| Entrada **Estoque (saída direta)** | Campo "Origem da transferência" → *Saída direta* |
| **Reservado** — quantidade travada · *Modal: Registrar Saída de Estoque* | A transferência nasce já reservada e entra direto em "Reservado · aprovação pendente", porque a aprovação está obrigatória no protótipo atual |
| **Aprovado?** | Estados `aguardando_aprovacao` → `aprovado`/`reprovado`, condicionados ao parâmetro |
| **Reprovado** — volta ao estoque · *mensagem de recusa + observação* | Modal de reprovação com motivo obrigatório; devolve ao disponível e notifica a origem |
| **Cancelado** — volta ao estoque · *mensagem de cancelamento* | Ação de cancelar, disponível em toda a fase pré-despacho |
| **Em trânsito** — material despachado · *card em /stocks/transfers (2 obras)* | Estado `em_transito`; o mesmo registro aparece em "A Enviar" da origem e "A Receber" do destino |
| **Avaliação de entrega (FVM)** — confere qtd. recebida · *Modal: Confirmar Entrega* · *notifica origem e destino* | Modal de Avaliação de entrega com enviado × recebido; notifica origem, Aprovador **e** destino |
| **Divergência?** | Calculada por item na FVM; a diferença aparece em quantidade e em valor |
| **Recebido ok** · *mensagem de conclusão* | Estado `recebido_ok` + toast e notificação tripla |
| **Recebido com divergência** — notifica remetente · *aba /stocks/transfers atualizada* | Estado `recebido_divergencia`, com motivo por item guardado para auditoria |
| **Vai reenviar?** → sim: volta para Reservado (passa pela aprovação de novo) | Ação "Reenviar corrigido (V1)": recalcula só o saldo faltante, zera aprovação e volta a `reservado` com contador de ciclo |
| **Divergência final** — registrada para auditoria · *card fecha* | Ação "Manter registro e encerrar" |

### Uma diferença deliberada em relação ao fluxograma

No fluxograma, **Aprovado?** é um losango de decisão que leva direto a *Em trânsito*. No protótipo
existe um estado `aprovado` entre a aprovação e o despacho, com a ação **Registrar despacho**.

Motivo: a seção 8 exige registrar *quando saiu* e *previsão de chegada*, e não há outro momento no
fluxo em que esses dois campos possam ser capturados — aprovar não é despachar, e entre uma coisa e
outra normalmente passam horas ou dias. O estado também é o que dá sentido ao cancelamento: sem ele,
a janela de "cancelar antes do despacho" seria de um clique.

Se a intenção for mesmo colapsar, é uma linha: aprovar passaria a mover direto para `em_transito`,
com a previsão de chegada preenchida dentro do próprio modal de aprovação.

### Duas diferenças herdadas da especificação (seção 9)

- **FVM obrigatória.** No material original a Avaliação de entrega é opcional; aqui não existe
  caminho que a pule. Se ela pode ser pulada, a divergência nunca é capturada.
- **Notificação da confirmação de recebimento é tripla.** O fluxograma diz "notifica origem e
  destino"; a seção 4 da especificação inclui também o Aprovador, e é o único evento com três
  destinatários em todo o fluxo — por isso ganha destaque visual no sino.

---

## Telas existentes que mudaram (seção 6)

**Estoque de Materiais**
- O card "Materiais Reservados" passou a somar as reservas de transferência entre obras, marcadas
  com o badge *Transferência* e o código do registro.
- A coluna de quantidade deixou de ser um número único: mostra o **disponível** e, abaixo, chips de
  *reservado*, *em trânsito* e *a receber*.

**Modal Registrar Saída de Estoque**
- Com "Tipo de Saída = Transferência de Estoque", salvar **cria uma reserva**, não uma movimentação.
- Aviso explícito do que vai acontecer ao salvar, que muda conforme o parâmetro de aprovação.
- Campos originais preservados: obra de transferência, observação, assinatura, seleção de insumo com
  estoque disponível e quantidade.

**Aba Movimentações**
- Ganhou coluna e filtro de **status da transferência**. Deixou de mostrar só histórico fechado:
  transferências aparecem desde a reserva, e a linha abre o detalhe.

**Entregas: Calendário / Detalhes do Pedido**
- Serviram de referência, não foram alteradas. Os cards de status, o calendário, o painel de
  atrasos e o par "Qtd. enviada × Qtd. recebida" foram reaproveitados nas telas novas.

---

## Telas novas (seção 7)

1. **Painel por obra** — A Enviar / A Receber, com cards de status, lista, calendário, chegadas
   atrasadas e próximas chegadas.
2. **Detalhe da transferência** — stepper do estado atual, os campos obrigatórios da seção 8,
   enviado × recebido e histórico de quem fez o quê e quando.
3. **Modal de Avaliação de entrega (FVM)** — comparação enviado × recebido com diferença em
   quantidade e em valor, motivo obrigatório por item divergente.
4. **App mobile completo** — cobre o mesmo fluxo da versão web, com navegação de aplicativo.

---

## Estrutura

```
src/
  domain/         tipos, metadados de status, máquina de estados, regras de notificação
  data/           obras, insumos, requisições e transferências (mock a partir dos prints)
  state/          store (reducer + selectors de saldo) e rotas
  components/     shell, primitivos de UI, dropdown, canvas de assinatura
  screens/web/    Estoque, Transferências, drawer de detalhe, modais de ação
  screens/mobile/ tela do almoxarife
  styles/         tokens extraídos dos prints + folhas de estilo
```

A máquina de estados fica isolada em `src/domain/machine.ts`: quem pode fazer o quê em cada estado
é uma tabela, não `if` espalhado pelas telas.

---

## Fora do escopo deste recorte

- **V2** — sugestão automática de destino cruzando com o card "Estoque Baixo".
- **V3** — transportador confirma carregamento; SLA de trânsito com alerta de atraso; indicador de
  confiabilidade por obra; modo offline no mobile.

O **V1** (loop de reenvio após divergência) foi incluído, já que a especificação permitia caso
sobrasse tempo. Está marcado como `(V1)` no botão.


---

## Site de apresentação do case

Em `/`, um site único em ordem cronológica com o processo inteiro: overview,
protótipo interativo, etapas, os três fluxogramas originais digitalizados e comentados, fluxo de
estados, fluxo enriquecido com tabelas de atores e notificações, mapa completo de telas e
priorização MVP/V.1/V.2/V.3, além do encerramento. Os blocos de introdução e prints anotados foram
removidos.

**Sistema visual.** O site segue o design system "warm paper notebook": canvas quente `#f6f5f4`,
cards brancos com fio de 1px e nenhuma sombra, um único azul (`#0075de`) reservado para a ação
primária, e um elenco de acentos (marigold, coral, sky-wash, midnight) que pinta os blocos de
destaque como post-its. Tipografia Inter para tudo, com um serif usado só nos momentos editoriais
— subtítulo do hero, intros de seção e o texto de encerramento.

**Diagramas.** Os três fluxos originais foram redesenhados digitalmente sem alterar caixas,
caminhos, rótulos ou a duplicação ON/OFF recebida. As perguntas ficam em uma faixa externa ao
desenho, sem contaminar o original. Os diagramas derivados seguem a paleta do site e são gerados
em `public/case/`.

**Separação visual.** O protótipo mantém a identidade da Suplos, sem recolorir nada. Ele entra
na seção 02 dentro de iframes — um frame de navegador para a versão web e um frame de celular
para a mobile — sobre um fundo escuro que o isola do resto do site. O iframe também garante que
o CSS do site não vaze para dentro do protótipo.

**Fonte não-bloqueante.** O `<link>` do Google Fonts usa `rel="preload"` com troca para
`stylesheet` no `onload`. Uma folha de estilo pendente bloqueia a execução dos scripts que vêm
depois dela, e isso deixava os iframes do protótipo em branco em redes que não alcançam o
`fonts.googleapis.com`. Com o preload, a página e o protótipo carregam mesmo sem a fonte, caindo
nos fallbacks (Georgia para o display, system sans para o corpo).

**Publicação.** As rotas do protótipo são caminhos reais, então o host precisa de fallback de
SPA (servir `index.html` para qualquer rota). `npm run preview` já faz isso localmente, e o
`vercel.json` na raiz configura o mesmo comportamento no Vercel.


---

## Protótipo mobile

Não é um recorte da versão web: é o mesmo fluxo inteiro — reserva, aprovação, despacho,
conferência e divergência — com a navegação refeita para o polegar. Dimensões de iPhone 17
(402 × 874 pt).

**Navegação**
- Quatro abas na base: Transferências, Estoque, Movimentações e Alertas — as mesmas áreas da
  versão web.
- Pilha para os fluxos longos (detalhe, criação, conferência): ocupam a tela inteira e escondem
  as abas, para não competir com a tarefa.
- Bottom sheets para as decisões curtas: despachar, reprovar, cancelar, registrar chegada,
  escolher insumo e os controles do protótipo.

**Adaptações de conteúdo**
- A tela de Estoque mantém as ações **Entrada** e **Saída**; Saída abre o passo a passo real da transferência.
- O modal de duas colunas do "Registrar Saída de Estoque" virou um passo a passo de três etapas:
  origem e destino, insumos, observação e assinatura — com barra de progresso.
- As tabelas do web viraram cards: o saldo tripartido do estoque virou chips, o histórico virou
  timeline, e o enviado × recebido virou um par de blocos lado a lado.
- A conferência usa contadores de 56 px em vez de campo numérico, e "Chegou tudo certo" fecha o
  caso comum em um toque. A divergência só aparece quando alguma quantidade muda.


---

## Ajustes da última rodada

**Cards de status seguem o vocabulário de Entregas.** Total, Reservados, Em trânsito, Atrasados,
FVM pendente, Aguardando NF, Com divergência, Completos e Cancelados — cada card agrupa os estados
do fluxo em vez de expor um estado por card. Quem é Aprovador ganha mais um, **Aprovações
pendentes**, ao lado de Reservados: é a fila de trabalho dele. Para os outros papéis esse card não
existe — a pendência aparece só como tag na linha da transferência.

**A divergência não morre num registro: ela vira pendência de quem mandou.**
Antes, a conferência com falta gerava um estado e parava ali. Agora abre duas
pendências em paralelo. O destino confirma a nota fiscal — e anexá-la **não** finaliza
nada. A origem recebe o único aviso crítico do fluxo (vermelho, marcado como "exige
decisão") e a transferência volta para os **Reservados** dela com tag vermelha de
divergência pendente. Só a decisão da origem fecha o caso: **enviar o que faltou**,
que reserva de novo apenas o saldo e passa pela aprovação outra vez, ou **encerrar
assumindo a falta**, que leva a transferência para **Finalizadas c/ divergência** com
a perda registrada e o motivo no histórico.

**A sidebar ficou com os dois ícones que existem.** O rail do produto tem mais de uma
dezena de módulos; o protótipo tem duas telas. Ícone que não leva a lugar nenhum só
convida ao clique morto. O acesso à versão mobile passou para o botão do header, que
até então era decorativo.

**A cor da tag vem do estado, nunca do card.** Dois estados que dizem a mesma coisa na lista —
"Reservado · envio pendente" e "Aprovado · envio pendente" — compartilham a mesma família visual e
saem sempre na mesma cor, em qualquer tela. O card reusa a cor da família que agrupa; nunca o
contrário. `STATUS_META[...].token` é a única fonte dessa cor.

**Alegar o recebimento não fecha a entrega.** Tirar a carga do trânsito e fazer o material entrar
no estoque são dois atos distintos: quem faz o segundo é a FVM. Ao alegar o recebimento, a
conferência abre na hora — o material está no pátio. Quem não puder conferir agora escolhe "faço a
FVM depois", e a transferência cai no card **FVM pendente** até alguém fechá-la, em vez de sumir
dentro de "Em trânsito".

**Total é só visualização.** Mostra o que está entrando e saindo e em que estado está. Os atalhos
de ação somem dos cards e o detalhe abre em modo leitura; para agir, a pessoa escolhe o card do
estado. Criar transferência continua disponível ali, porque não é uma ação sobre um registro
existente.

**A criação não espera um segundo clique.** Ao salvar, a quantidade trava e a transferência já
entra em aprovação pendente. O passo "Enviar para aprovação" deixou de existir; no protótipo
atual, a aprovação está sempre ligada.

**Despacho pede as duas datas.** Data efetiva de saída e previsão de chegada, no mesmo modal, com
validação de que a previsão não é anterior à saída.

**Avaliação de entrega em duas etapas.** Primeiro a conferência de quantidade (enviado × recebido,
sempre obrigatória); depois a avaliação por critérios — fichas selecionáveis, estrelas e sim/não,
observação e anexos. As fichas são configuração do cliente: com ficha selecionada, todos os
critérios travam a conclusão; sem ficha, a conferência sozinha conclui.

**Aguardando NF.** Depois da conferência o material já entra no estoque do destino, mas a
transferência fica Aguardando NF até alguém confirmar o número da nota e anexar o arquivo. Só então
ela vira Completa ou Com divergência.

**Apropriação de custos.** Item de pedido exige linha de orçamento, num select que mostra o saldo
na obra de origem e na de destino. Item avulso não pede o campo — o mesmo modal atende os dois.
As linhas em `src/data/orcamento.ts` são placeholders no formato de EAP.

**Estoque manteve todas as colunas originais.** ID, Nome, Categoria, Tipo, Quantidade, Estoque mín
e Último movimento seguem iguais; Quantidade mostra o saldo do item com o disponível logo abaixo, e
uma coluna nova, Situação da transferência, acrescenta reservado, em trânsito e a receber.


## Diagramas do fluxo

`src/site/` consome seis SVGs gerados em `public/case/`: os três originais digitalizados,
`fluxo_transferencia_v1_linha_unica.svg` (estados demonstrados), `fluxo_v1_enriquecido.svg`
(touchpoints de UI) e `fluxo_telas_prototipo.svg` (rotas e interações web/mobile). Todos saem de
`scripts/gerar-diagramas-fluxo.py` — rode o script depois de qualquer mudança no fluxo ou na
navegação para os diagramas não descolarem do protótipo:

```bash
python scripts/gerar-diagramas-fluxo.py
```
