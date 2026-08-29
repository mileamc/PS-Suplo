# Especificação — Transferência de Material entre Obras (Suplos)

Documento de handoff para prototipagem. Contém o modelo de estados, quem decide o quê, quem é notificado, o escopo do recorte atual (MVP), e o mapeamento de quais telas existentes precisam mudar. Baseado no case da Suplos: contexto, prints do produto atual, três fluxogramas originais, glossário e vídeo de apresentação.

---

## 1. O problema, resumido

Hoje, transferir material entre obras é uma ação única e instantânea: ao salvar uma "Saída de Estoque" do tipo Transferência, o saldo sai da obra de origem e entra na obra de destino no mesmo clique — sem aprovação, sem reserva, sem confirmação de chegada. Na realidade física, o material leva de 3 a 7 dias no caminhão, e a quantidade que sai pode não ser igual à que chega (perda, roubo, quebra no trajeto). O sistema hoje não modela esse intervalo nem essa divergência.

---

## 2. Modelo de estados (fluxo completo)

```
Requisição de material ⟍
                         ⟩→ Reservado (qtd. travada) → Aguardando aprovação →┬→ Aprovado → Em trânsito → Avaliação de entrega (FVM) →┬→ Recebido ok [FIM]
Estoque (saída direta)  ⟋                                                    └→ Reprovado → volta ao estoque [FIM]                    └→ Recebido com divergência → Vai reenviar? →┬→ Sim: volta para Reservado (passa pela aprovação de novo)
                                                                                                                                                                                └→ Não: Divergência final, registrada para auditoria [FIM]

Reservado → Cancelado (pelo criador, só antes do despacho) → volta ao estoque [FIM]
```

**Premissas fixadas nesta especificação (decisões conscientes, não lacunas):**
- A quantidade trava no momento da reserva e não muda depois — qualquer divergência só pode se originar durante o trânsito físico, nunca de erro de digitação anterior.
- Cancelamento só é possível enquanto o material não foi despachado (estado Reservado). Depois de "Em trânsito" não há cancelamento — só o ciclo normal de avaliação/divergência.
- Reenvio após divergência volta ao estado Reservado (não direto para Em trânsito), porque o remetente precisa fisicamente re-separar o material — e passa pela aprovação de novo, sem exceção, pelo mesmo controle do envio original.
- Aprovação é condicionada a um parâmetro por cliente (pode estar ligado ou desligado) — quando desligado, o fluxo pula direto de Reservado para Em trânsito.
- "Avaliação de entrega" (conferência de quantidade) é tratada como **obrigatória** nesta proposta — diferente do fluxograma original deles, onde a FVM aparece como opcional (ver seção 9, discordância registrada).

---

## 3. Quem decide em cada estado

| Estado | Quem age | Ação possível |
|---|---|---|
| Reservado | Origem (criador da saída) | Pode cancelar a transferência |
| Aguardando aprovação | Destino (papel de aprovador, definido por cliente — pode ser o gestor da obra) | Aprova ou reprova |
| Reprovado | Sistema | Devolve a quantidade ao disponível da origem |
| Em trânsito | — | Nenhuma ação, aguarda chegada |
| Avaliação de entrega (FVM) | Destino (pode ou não ser a mesma pessoa que aprovou — configurável por cliente) | Confirma recebimento ou registra divergência |
| Recebido com divergência | Origem | Reenvia corrigido ou mantém o registro |
| Cancelado | Origem | Devolve ao disponível, antes do despacho |

---

## 4. Quem é notificado em cada transição

Diferente da tabela acima (que responde "quem decide"), esta responde "quem fica sabendo" — confirmado explicitamente no vídeo de apresentação da Suplos (min 3:13–3:30: *"tanto a obra que enviou recebe essa confirmação, mas também o gestor, mas também essa obra aparecer que esse material foi recebido"*).

| Transição | Origem | Aprovador | Destino |
|---|:---:|:---:|:---:|
| Entra em Aguardando aprovação | — | ✔ | — |
| Aprovado | ✔ | — | ✔ (vê "a receber") |
| Reprovado | ✔ | — | — |
| Em trânsito | — | — | ✔ (previsão de chegada) |
| **Confirmação de recebimento (ok ou divergente)** | **✔** | **✔** | **✔** |
| Recebido com divergência → precisa reenviar | ✔ | — | — |
| Cancelado | ✔ | — | — |

A confirmação de recebimento é o único evento com notificação tripla em todo o fluxo — merece destaque na interface (não é uma notificação igual às outras).

---

## 5. Escopo do recorte atual — MVP

**Está dentro do MVP (construir agora):**
- Estado Reservado, com quantidade travada
- Aguardando aprovação / Aprovado / Reprovado, condicionado a parâmetro por cliente
- Em trânsito
- Avaliação de entrega (FVM): confirma ok ou registra divergência (comparação enviado x recebido)
- Cancelado
- Painel de visibilidade por obra: "A Enviar" e "A Receber" (pedido explícito do time de CS, mesmo peso que aprovação e reserva)

**Fora do MVP (não construir agora — fica para V1/V2/V3):**
- V1: loop de reenvio após divergência (o "Vai reenviar?" com volta ao Reservado)
- V2: sugestão automática de destino cruzando com o card "Estoque Baixo" já existente
- V3: transportador confirma carregamento; SLA de trânsito com alerta de atraso; indicador de confiabilidade por obra; modo offline no mobile

Se o tempo permitir, o loop de reenvio (V1) pode ser incluído no protótipo como estado adicional, mas não é prioridade sobre o MVP.

---

## 6. Telas existentes da Suplos que precisam mudar

Baseado nos prints fornecidos no case.

**Tela "Estoque de Materiais" (listagem + cards de resumo)**
- O card "Materiais Reservados" hoje só reflete reserva de requisição interna. Precisa passar a incluir também reserva de transferência entre obras.
- A coluna de quantidade mostra saldo único. Precisa distinguir: disponível / reservado / em trânsito.

**Modal "Registrar Saída de Estoque"**
- Ao selecionar "Tipo de Saída = Transferência de Estoque", o comportamento hoje é idêntico a qualquer outra saída (clique único, saldo sai na hora). Precisa passar a criar o registro no estado Reservado, não executar a movimentação direto.
- Falta campo para o modal indicar que, dependendo do parâmetro do cliente, a transferência seguirá para aprovação antes de qualquer movimentação física.
- Manter os campos existentes: obra de transferência (destino), observação, assinatura, seleção de insumo com estoque disponível e quantidade a transferir.

**Aba "Movimentações"**
- Hoje mostra transferência só como histórico já concluído (subtipo "Transferência"). Precisa de um filtro/indicador de status (pendente, aguardando aprovação, em trânsito, recebido, com divergência) — não só entrada/saída já fechadas.

**Tela "Entregas: Calendário"**
- Hoje é exclusiva para pedidos de compra. É a referência de padrão a reaproveitar (cards de status, calendário, "Entregas Atrasadas") para criar o equivalente em transferências entre obras — inclusive citada como necessidade pela própria pessoa da Suplos no vídeo.

**Modal "Detalhes do Pedido" (confirmação de entrega de pedidos de compra)**
- O padrão "Qtd. Pedido" vs "Qtd. Recebida" lado a lado já existe aqui. Deve ser reaproveitado no novo modal de Avaliação de entrega (FVM) de transferências — é a prova de que o padrão de comparação enviado x recebido já é usado pela Suplos em outro lugar do produto.

---

## 7. Telas novas necessárias

1. **Painel de visibilidade por obra** — "A Enviar" e "A Receber", nos moldes de "Entregas: Calendário" (cards de status + lista/calendário).
2. **Card/detalhe de transferência em andamento** — mostrando estado atual (Reservado, Aguardando aprovação, Em trânsito, etc.), histórico de quem aprovou e quando.
3. **Modal de Avaliação de entrega (FVM) para transferências** — comparação enviado x recebido, adaptado do padrão do "Detalhes do Pedido", com campo de confirmação e registro de divergência.
4. **Tela mobile de confirmação de recebimento** — para o almoxarife no canteiro (contexto: sol, luva, conexão ruim — slide 17.6 do material da Suplos). Precisa ser rápida de preencher, com poucos toques.

---

## 8. Campos que a transferência precisa registrar (obrigatório em algum lugar do desenho)

Itens e quantidades · Custo dos itens · Origem e destino · Quem aprovou · Quando saiu · Previsão de chegada · Quando chegou · Enviado x recebido (lado a lado) · Avaliação de entrega (critério configurável por cliente)

---

## 9. Discordâncias registradas em relação ao material original (para citar na apresentação)

- **FVM opcional no fluxograma original:** se a avaliação de entrega pode ser pulada, a divergência ("saem 10, chegam 8") nunca é capturada — contradiz a própria necessidade de auditoria citada no material. Nesta especificação, a conferência de quantidade é obrigatória; apenas os critérios de qualidade da avaliação (não a conferência de quantidade em si) podem ser configuráveis por cliente.
- **Duplicação de lógica no Fluxo 2 (Aprovação)** para parâmetro ON/OFF no original — aqui, o parâmetro apenas decide se o estado "Aguardando aprovação" existe no fluxo ou é pulado, sem duplicar toda a árvore de decisão.
- **Requisição de Material** é tratada como pedido interno da própria obra de origem (não um pedido feito pela obra de destino) — a transferência é sempre iniciada por quem tem sobra, nunca por quem tem falta.

---

## 10. Terminologia oficial (usar exatamente estes termos, conforme glossário da Suplos)

Obra · Avaliação de entrega (FVM) · Apropriação de custos · Avulso / Pedido · Requisição · Saída de estoque · Aprovador

---

## 11. Estados "não-felizes" obrigatórios no recorte de alta-fidelidade

Pelo menos um dos seguintes precisa aparecer nas telas de alta-fi (exigência explícita do case): vazio (nenhuma transferência pendente), carregando, erro, ou recebimento parcial/com divergência. Recomenda-se priorizar **recebimento com divergência**, por ser o cerne do problema do case.

---

## 12. Sugestão de prompt para o Claude Code

> "Tenho um protótipo funcional para construir em React, web e mobile, do fluxo de transferência de material entre obras de um produto de gestão de suprimentos para construção civil (Suplos). Anexei prints das telas atuais do produto. Use a especificação em anexo (especificacao_transferencia_entre_obras.md) como fonte de verdade para os estados, quem decide o quê, quem é notificado, e quais telas existentes precisam mudar. Comece pelo MVP descrito na seção 5. Mantenha a identidade visual dos prints anexados (cores, tipografia, componentes) tanto quanto possível."
