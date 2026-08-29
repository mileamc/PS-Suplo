# Handoff — protótipo de Transferência entre Obras

Documento para quem chega sem nenhum contexto. Leia junto com o `README.md`,
que descreve o protótipo em detalhe; aqui está o **porquê**, o **estado atual** e
as **armadilhas**.

---

## 1. O que é isto e para quê

Milena Caldas está fazendo um **case para um processo seletivo de Product
Designer na Suplos** — uma plataforma de gestão de suprimentos para construção
civil. O tema do case é o fluxo de **transferência de material entre obras**: uma
obra tem sobra de material, outra precisa dele, e hoje esse trânsito não é
rastreado direito no produto.

A entrega tem duas partes, e **as duas vivem no mesmo app React**:

1. **O site do case** (rota `/`) — a apresentação: overview,
   protótipo, etapas do processo, os três fluxogramas originais digitalizados e
   comentados, o modelo de estados, o fluxo enriquecido, um mapa de telas,
   priorização em MVP/V.1/V.2/V.3 e encerramento. É o que a banca lê.
2. **O protótipo funcional** (rotas `/stocks*`) — telas navegáveis de verdade,
   web e mobile, com a identidade visual da Suplos. É embutido dentro do site,
   num frame de navegador e num frame de celular.

**O objetivo final dela:** entregar um case que não só descreva a solução, mas
deixe a pessoa da banca *usar* o fluxo — criar uma transferência, aprovar,
despachar, receber, conferir, registrar divergência — e ver que o modelo de
estados proposto se sustenta na prática.

### Em que fase estamos

A fase de **descoberta e desenho está fechada**. O site está pronto e o layout
dele **não deve ser mexido**. O que está em aberto é o **comportamento do
protótipo**: nas últimas sessões ela vem ajustando funcionalidades, vocabulário e
hierarquia das telas de transferência. Todo pedido novo tende a ser sobre isso.

> **Regra prática:** mexa no protótipo (`src/screens/`, `src/domain/`,
> `src/state/`, `src/components/`). Só encoste em `src/site/` quando o pedido for
> explicitamente sobre o site, e mesmo assim sem reorganizar o layout.

---

## 2. Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build — precisa passar antes de qualquer commit
npm run lint     # tsc --noEmit
```

Não há suíte de testes. **A verificação é visual**: suba o dev server e dirija a
tela com Playwright (Chromium já vem instalado em
`/opt/pw-browsers/chromium`; não rode `playwright install`). Foi assim que todas
as mudanças abaixo foram conferidas — vale manter o hábito, porque quase todo
pedido aqui é de interface.

`tsconfig` está com `strict`, `noUnusedLocals` e `noUnusedParameters`. Import
sobrando quebra o build.

### Rotas

| Rota | O que é |
|---|---|
| `/` | Site do case |
| `/stocks` | Protótipo web — Estoque de Materiais |
| `/stocks/transfers` | Protótipo web — Transferências entre Obras (a tela principal) |
| `/stocks/transfers/:id` | Abre o drawer de detalhe (sufixo `?leitura` abre sem ações) |
| `/stocks/transfers/receiving` | Protótipo mobile dentro de um frame de celular |
| `/embed/mobile` | Só o app mobile, sem moldura — é o que o site embute |

---

## 3. Arquitetura em 30 segundos

React + TypeScript + Vite. Sem router, sem lib de estado, sem lib de UI.

- `src/domain/` — **o modelo, sem UI**. `types.ts` (tipos), `status.ts` (estados,
  rótulos, cores e agrupamentos), `machine.ts` (quem pode fazer o quê em cada
  estado), `grupos.ts` (os cards/filtros da tela), `notificacoes.ts` (quem é
  avisado em cada transição).
- `src/state/store.tsx` — `useReducer` + Context. Toda ação do fluxo é um
  `dispatch`. `rotas.ts` resolve `window.location.pathname` na mão.
- `src/data/` — seed. Obras, insumos, orçamento, requisições e
  `transferencias.ts`, que cobre todos os estados do fluxo nas duas direções.
- `src/screens/web/` e `src/screens/mobile/` — as telas. **Web e mobile são
  implementações separadas** do mesmo domínio, de propósito: o mobile é um app
  de canteiro (abas na base, bottom sheets, alvos grandes), não uma versão
  responsiva do web.
- `src/styles/` — CSS puro com tokens. `tokens.css` é a fonte das cores.

---

## 4. O modelo de domínio (o que você precisa saber para não quebrar nada)

### Os estados

```
                      ┌→ reprovado
reservado / aguardando_aprovacao → aprovado → em_transito
                      └→ cancelado                  ↓
                                          avaliacao_entrega  (FVM pendente)
                                                    ↓
                                            aguardando_nf
                                            ↙            ↘
                                    recebido_ok      recebido_divergencia
                                                            ↓
                                              encerrado_divergencia | reenvio
```

Três invariantes que custaram caro e não devem ser desfeitas sem motivo:

**a) A cor da tag vem do estado, nunca do card que o agrupa.**
`STATUS_META[status].token` nomeia a *família visual*, e é a única fonte da cor —
tanto da tag quanto do card. Dois estados que dizem a mesma coisa na lista
("Reservado · envio pendente" e "Aprovado · envio pendente") compartilham a
família `reservado` e saem sempre na mesma cor. Se você adicionar um estado, dê a
ele uma família e crie os tokens `--st-<familia>-{fg,bg}` e a classe
`.badge-status--<familia>`.

**b) Alegar o recebimento não faz o material entrar no estoque.**
São dois atos: `registrar_chegada` tira do trânsito (vai para `avaliacao_entrega`,
rotulado "FVM pendente"), e a FVM — a conferência enviado × recebido — é que dá
entrada no estoque. Alegar a chegada emenda direto na conferência; quem não puder
fazer na hora reencontra o card em "FVM pendente".

**c) A divergência é pendência de quem MANDOU, e só ela fecha a transferência.**
Quando a conferência acha falta, abrem duas pendências em paralelo: o destino
confirma a NF (e **isso não finaliza nada**), e a origem decide entre *enviar o
que faltou* (reserva só o saldo e passa pela aprovação de novo) ou *encerrar
assumindo a falta* (estado terminal `encerrado_divergencia`). Enquanto a origem
não decidir, a transferência aparece nos **Reservados** dela com tag vermelha.
`divergenciaPendente()` em `status.ts` é o predicado que governa isso.

### Papéis — leia isto antes de mexer em ações

O protótipo é o **painel de UMA empresa**: a obra atual (`OBRA_ATUAL` em
`data/obras.ts`, "Suplos Tower II"). Ela é a **origem** no que sai daqui e o
**destino** no que chega — e como o Aprovador é sempre da obra que *recebe*, ela
também **aprova o que chega até ela**. Não existe seletor de persona.

O único papel que ela não tem é o **Aprovador da outra empresa**, que precisa dar
o ok no que sai daqui. Sem ele o fluxo não fecharia dentro de um painel único, e
por isso existe um **modo de simulação**:

- Botão na barra do topo, **apagado** enquanto nada depende da outra ponta (o
  hover explica por quê). O protótipo abre assim, de propósito.
- Quando o usuário cria uma transferência e ela para na aprovação, o botão
  **acende, pulsa e abre um balão** apontando para si mesmo.
- Dentro do modo, a tela continua sendo **um painel completo** (todos os cards,
  a lista, os painéis laterais) e ganha **uma seção a mais no topo** —
  "Aguardando sua aprovação" — com Aprovar/Reprovar à mão. Uma faixa âmbar
  lembra o tempo todo que aquilo não é o painel da própria obra.
- Zerada a fila, um aviso traz o usuário de volta e o botão apaga.

As funções que decidem tudo isso: `papeisDoUsuario()`, `acoesDoUsuario()` e
`pendentesDeAprovacaoExterna()` em `domain/machine.ts`. **Não volte a usar
`acoesDoPapel(t, papel)`** para o usuário — ela só sobrou como utilitário.

### Hierarquia da tela de Transferências

Nesta ordem, e a ordem importa:

1. **Direção** — "Saindo desta obra" / "Chegando nesta obra". É a primeira
   camada: a perspectiva a partir da qual todo o resto é lido, não um filtro. A
   opção ativa é escura, com mais peso visual que os cards.
2. **Cards de status** — Total, Reservados, [Aprovações pendentes], Em trânsito,
   Atrasados, FVM pendente, Aguardando NF, Finalizadas c/ divergência, Completos,
   Cancelados. Definidos uma vez só em `domain/grupos.ts`, compartilhados por web
   e mobile.
3. **Lista** da direção + card selecionados.

"Aprovações pendentes" só aparece para quem pode decidir naquele lado: a própria
obra no que chega, a empresa simulada no que sai.

---

## 5. O que foi feito nesta rodada (5 commits, branch `claude/transferencia-entre-obras-0qdjcd`)

| Commit | O quê |
|---|---|
| `bf22480` | Cor da tag passa a vir do estado; card "Pendentes" → "Reservados"; "FVM pendente" ganha card próprio; "Aprovações pendentes" só para quem aprova; grupos de web e mobile unificados em `domain/grupos.ts` |
| `93018a3` | Ciclo completo da divergência: aviso crítico, volta para os Reservados da origem, NF que não finaliza, encerramento pela origem |
| `b373a61` | Direção vira a primeira camada da tela; no site, o protótipo sobe para logo depois do overview (seção 03) |
| `afda279` | Painel de uma empresa só + modo de simulação da outra ponta; barra do topo reduzida |
| `7f23c00` | Fila de aprovação começa vazia; a tela do modo aprovador vira painel completo com seção a mais |

### Atualização de 29/08/2026 — alterações atuais do working tree

- Os três screenshots em `origem/fluxos/` foram redesenhados como SVGs separados,
  preservando caixas, rótulos, cores e caminhos; perguntas ficam fora do fluxo.
- Os diagramas próprios foram refeitos somente com estados, decisões e touchpoints
  demonstráveis no protótipo atual.
- Foi criado `fluxo_telas_prototipo.svg`, com as rotas, abas, drawer, modais e
  sheets das versões web e mobile.
- Os blocos “Introdução” e “Prints das telas atuais, anotados” saíram do site; a
  priorização foi organizada em quatro cards (MVP, V.1, V.2 e V.3) após o mapa de telas.
- O loop de reenvio já demonstrável no protótipo passou para o card de MVP; as
  melhorias futuras foram redistribuídas entre V.1, V.2 e V.3, e o SVG redundante saiu da página.
- O protótipo ganhou um resumo do que acrescenta ao original, e o estoque mobile
  voltou a mostrar Entrada e Saída; Saída abre a criação real.
- O toast global deixou de ser renderizado nas rotas mobile, eliminando a duplicação.

Bugs encontrados e corrigidos no caminho, para você não reintroduzi-los:

- O token `--st-nf` **nunca existiu** — a tag "Aguardando NF" saía sem cor.
- O reenvio caía em "Reservado pronto para despacho" mesmo com aprovação ligada,
  contrariando o próprio texto do toast. Agora volta para o Aprovador.
- "Atrasada" contava material que já tinha chegado; agora vale só para o que
  está na estrada (`STATUS_EM_ROTA`).
- Dois `useEffect` disputavam o filtro ativo e deixavam a lista errada dentro do
  modo de simulação. Hoje o efeito de reset cai em `cards[0]`, não em `'total'`
  fixo, e a lista de cards é memoizada.

---

## 6. Pontas soltas e decisões em aberto

Nada disso está quebrado — são escolhas que a Milena pode querer revisitar.

1. **TR-000143 abre em aprovação pendente.** É uma transferência *chegando* nesta
   obra, aprovada pela própria empresa, e por isso não acende o botão da outra
   empresa. Foi mantida porque é o único exemplo do card "Aprovações pendentes"
   no painel da própria obra. Ela foi avisada; se pedir "tela limpa dos dois
   lados", é mudar o status dessa seed.
2. **`aprovacaoAtiva` virou constante.** O switch "Aprovação obrigatória" saiu da
   barra do topo e o campo ficou fixo em `true` no `store`, porque é ele que cria
   a única pendência da outra empresa. O código que lê o parâmetro continua todo
   lá (`store.tsx`, `machine.ts:trilha()`), então religar é trivial. **Atenção:**
   o site agora descreve a aprovação como obrigatória no protótipo e registra que
   o original duplicava de forma inconsistente as árvores ON/OFF.
3. **Assinatura mockada** e anexos são strings de nome de arquivo — não há upload
   real. É protótipo.

---

## 7. Como trabalhar com ela

Observado ao longo da sessão, e vale seguir:

- Ela escreve rápido, em português, sem acentuação rigorosa e às vezes se corrige
  na mensagem seguinte ("aprovacao pendente*", "um agente*"). **Espere a
  correção antes de agir em cima de uma leitura duvidosa** quando ela vier logo
  em seguida.
- Ela pensa em **vocabulário de produto**, não em implementação: "o card não
  chama pendente, chama RESERVADO", "todas as tags do mesmo estado com a mesma
  cor". Traduza isso para o domínio — quase sempre o pedido revela uma
  inconsistência real no modelo, não só um rótulo.
- **Ela não quer o layout do site mexido.** Já disse isso explicitamente.
- Ela pede correções em lotes de duas ou três, às vezes no meio da execução.
- Commits em português, mensagem explicando o *porquê* e não só o *quê*. Ela
  nunca pediu PR — **não abra um sem pedido explícito**.
- Push sempre em `claude/transferencia-entre-obras-0qdjcd`.

---

## 8. Primeiro movimento sugerido

1. `npm install && npm run dev`.
2. Abra `/stocks/transfers` e percorra o fluxo inteiro uma vez: crie uma
   transferência → o botão do aprovador acende → simule a aprovação → volte →
   despache → troque para "Chegando nesta obra" → alegue o recebimento de algo em
   trânsito → faça a FVM com divergência → veja a transferência voltar para os
   Reservados → encerre ou reenvie.
3. Abra `/embed/mobile` e repita. O mobile tem as mesmas regras, telas
   diferentes.
4. Só então leia o código. O fluxo na tela explica o domínio melhor que os tipos.
