# Suplos — Transferência de Material entre Obras

Protótipo funcional em React (web + mobile) do fluxo de transferência de material entre obras.
Fonte de verdade: `especificacao_transferencia_entre_obras.md` (estados, quem decide, quem é
notificado, telas que mudam) + o fluxograma **Fluxo de transferência V1**.

```bash
npm install
npm run dev     # http://localhost:5173/stocks/transfers
```

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
| `/stocks` | Estoque de Materiais (cards + abas Estoque / Movimentações) |
| `/stocks/transfers` | Painel de visibilidade por obra — **A Enviar** e **A Receber** |
| `/stocks/transfers/:id` | Detalhe da transferência (drawer com estado, dados e histórico) |
| `/stocks/transfers/receiving` | Tela mobile de confirmação de recebimento (almoxarife) |

Os caminhos seguem os citados no fluxograma (*"card em /stocks/transfers (2 obras)"*,
*"aba /stocks/transfers atualizada"*).

---

## Barra de demonstração (topo)

Três controles que existem para tornar a especificação verificável na tela:

- **Ver como** — alterna o papel ativo (Obra de origem · Aprovador · Obra de destino). Muda quais
  ações ficam habilitadas no detalhe e quais notificações aparecem no sino. É a seção 3 e a seção 4
  ficando visíveis.
- **Aprovação obrigatória** — o parâmetro por cliente da seção 2. Desligado, o fluxo pula
  "Aguardando aprovação" e vai de Reservado direto para o despacho. O parâmetro só decide se o
  estado existe, sem duplicar a árvore de decisão.
- **Estado da tela** — Normal / Carregando / Vazio / Erro (seção 11).

---

## Conformidade com o fluxograma V1

| Fluxograma | Onde está no protótipo |
|---|---|
| Entrada **Requisição de material** (pedido interno da obra) | Campo "Origem da transferência" → *Requisição de material*, com seletor que puxa insumos e quantidades da requisição |
| Entrada **Estoque (saída direta)** | Campo "Origem da transferência" → *Saída direta* |
| **Reservado** — quantidade travada · *Modal: Registrar Saída de Estoque* | Estado `reservado`; o modal cria a reserva em vez de executar a movimentação |
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
4. **Mobile de confirmação de recebimento** — para o almoxarife no canteiro: alvos de 54 px,
   "Chegou tudo certo" resolve o caso comum em um toque, divergência é o caminho alternativo.

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
