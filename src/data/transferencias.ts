import type { Role, Transferencia, TransferEvento, TransferItem, EventoTipo } from '../domain/types';
import { INSUMOS } from './insumos';

let evSeq = 0;
function ev(
  tipo: EventoTipo, em: string, porNome: string,
  porPapel: Role | 'sistema', obra: string, detalhe?: string,
): TransferEvento {
  return { id: `evt-${++evSeq}`, tipo, em, porNome, porPapel, obra, detalhe };
}

function item(insumoId: string, qtdEnviada: number, qtdRecebida: number | null = null, motivo?: string): TransferItem {
  const i = INSUMOS.find((x) => x.id === insumoId)!;
  return {
    insumoId: i.id, codigo: i.codigo, nome: i.nome, unidade: i.unidade,
    tipo: i.tipo, custoUnitario: i.custoUnitario,
    qtdEnviada, qtdRecebida, motivoDivergencia: motivo,
  };
}

const ASSINATURA_MOCK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="90"><path d="M20 62 C60 20, 90 78, 128 46 S196 18, 232 58" fill="none" stroke="#111827" stroke-width="2.4" stroke-linecap="round"/><path d="M40 72 h190" stroke="#111827" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  );

/* ============================================================
   Seed — cobre TODOS os estados do MVP, nas duas direções
   (A Enviar a partir de Suplos Tower II e A Receber nela).
   ============================================================ */
export const TRANSFERENCIAS_SEED: Transferencia[] = [
  /* ---------- ⭐ O caso central do problema: divergência --------- */
  {
    id: 'tr-136', codigo: 'TR-000136', status: 'recebido_divergencia',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-004',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-08-14T09:12:00',
    entrada: 'saida_direta',
    observacao: 'Sobra da laje do 4º pavimento, liberada para a Tower IV.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [
      item('in-15347-a', 120, 92, 'Volume não conferia na descarga — 28 peças não vieram no caminhão.'),
      item('in-12113-a', 500, 500),
    ],
    aprovadaPor: 'Kaio Ambrosio', aprovadaEm: '2026-08-14T15:40:00',
    despachadaEm: '2026-08-15T07:30:00', previsaoChegada: '2026-08-19T00:00:00',
    chegadaEm: '2026-08-20T08:05:00',
    recebidaPor: 'Josué Barbosa', recebidaEm: '2026-08-20T08:41:00',
    eventos: [
      ev('criada', '2026-08-14T09:12:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('enviada_aprovacao', '2026-08-14T09:13:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('aprovada', '2026-08-14T15:40:00', 'Kaio Ambrosio', 'aprovador', 'Suplos Tower IV'),
      ev('despachada', '2026-08-15T07:30:00', 'Rafael Menezes', 'origem', 'Suplos Tower II', 'Previsão de chegada: 19/08/2026'),
      ev('chegada_registrada', '2026-08-20T08:05:00', 'Josué Barbosa', 'destino', 'Suplos Tower IV', 'Chegou 1 dia após a previsão'),
      ev('recebida_divergencia', '2026-08-20T08:41:00', 'Josué Barbosa', 'destino', 'Suplos Tower IV', 'Faltaram 28 un de Curva 90° PVC'),
    ],
  },

  /* ---------- A Enviar (origem = Suplos Tower II) ---------------- */
  {
    id: 'tr-141', codigo: 'TR-000141', status: 'reservado',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-001',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-08-28T16:20:00',
    entrada: 'saida_direta',
    observacao: 'Excedente de tubulação do bloco B.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-2995-p', 300)],
    eventos: [ev('criada', '2026-08-28T16:20:00', 'Rafael Menezes', 'origem', 'Suplos Tower II')],
  },
  {
    id: 'tr-140', codigo: 'TR-000140', status: 'aguardando_aprovacao',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-007',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-08-27T11:05:00',
    entrada: 'requisicao', requisicaoCodigo: 'REQ-4471',
    observacao: 'Atende a requisição interna 4471 da Tower VII.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-12113-a', 2000)],
    eventos: [
      ev('criada', '2026-08-27T11:05:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('enviada_aprovacao', '2026-08-27T11:06:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
    ],
  },
  {
    id: 'tr-142', codigo: 'TR-000142', status: 'aprovado',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-003',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-08-26T08:44:00',
    entrada: 'saida_direta',
    observacao: 'Disjuntores reservados para o quadro geral da Tower III.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-15348-a', 12)],
    aprovadaPor: 'Marina Coelho', aprovadaEm: '2026-08-26T14:02:00',
    eventos: [
      ev('criada', '2026-08-26T08:44:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('enviada_aprovacao', '2026-08-26T08:45:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('aprovada', '2026-08-26T14:02:00', 'Marina Coelho', 'aprovador', 'Suplos Tower III'),
    ],
  },
  {
    id: 'tr-138', codigo: 'TR-000138', status: 'em_transito',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-003',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-08-25T10:10:00',
    entrada: 'saida_direta',
    observacao: 'Tinta e terminais para o acabamento da Tower III.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-11843-p', 40), item('in-12113-p', 800)],
    aprovadaPor: 'Marina Coelho', aprovadaEm: '2026-08-25T17:22:00',
    despachadaEm: '2026-08-27T06:50:00', previsaoChegada: '2026-09-01T00:00:00',
    eventos: [
      ev('criada', '2026-08-25T10:10:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('enviada_aprovacao', '2026-08-25T10:11:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('aprovada', '2026-08-25T17:22:00', 'Marina Coelho', 'aprovador', 'Suplos Tower III'),
      ev('despachada', '2026-08-27T06:50:00', 'Rafael Menezes', 'origem', 'Suplos Tower II', 'Previsão de chegada: 01/09/2026'),
    ],
  },
  {
    id: 'tr-131', codigo: 'TR-000131', status: 'recebido_ok',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-003',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-08-10T13:00:00',
    entrada: 'saida_direta',
    observacao: 'Cabo excedente da infra provisória.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-15727-a', 50, 50)],
    aprovadaPor: 'Marina Coelho', aprovadaEm: '2026-08-10T16:30:00',
    despachadaEm: '2026-08-11T07:15:00', previsaoChegada: '2026-08-14T00:00:00',
    chegadaEm: '2026-08-14T09:20:00',
    recebidaPor: 'Tiago Lemos', recebidaEm: '2026-08-14T09:35:00',
    eventos: [
      ev('criada', '2026-08-10T13:00:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('enviada_aprovacao', '2026-08-10T13:01:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('aprovada', '2026-08-10T16:30:00', 'Marina Coelho', 'aprovador', 'Suplos Tower III'),
      ev('despachada', '2026-08-11T07:15:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('chegada_registrada', '2026-08-14T09:20:00', 'Tiago Lemos', 'destino', 'Suplos Tower III'),
      ev('recebida_ok', '2026-08-14T09:35:00', 'Tiago Lemos', 'destino', 'Suplos Tower III'),
    ],
  },
  {
    id: 'tr-133', codigo: 'TR-000133', status: 'reprovado',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-005',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-08-18T09:00:00',
    entrada: 'saida_direta',
    observacao: 'Disjuntores para a subestação da Tower V.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-15348-a', 10)],
    motivoReprovacao: 'A Tower V já recebeu carga equivalente no pedido 800075.',
    eventos: [
      ev('criada', '2026-08-18T09:00:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('enviada_aprovacao', '2026-08-18T09:01:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('reprovada', '2026-08-18T11:47:00', 'AnaPrado', 'aprovador', 'Suplos Tower V', 'A Tower V já recebeu carga equivalente no pedido 800075.'),
    ],
  },
  {
    id: 'tr-134', codigo: 'TR-000134', status: 'cancelado',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-006',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-08-19T14:30:00',
    entrada: 'saida_direta',
    observacao: 'Lona para proteção da fachada.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-11654-a', 200)],
    eventos: [
      ev('criada', '2026-08-19T14:30:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('cancelada', '2026-08-19T15:02:00', 'Rafael Menezes', 'origem', 'Suplos Tower II', 'A própria obra passou a precisar do material.'),
    ],
  },

  /* ---------- A Receber (destino = Suplos Tower II) -------------- */
  {
    id: 'tr-139', codigo: 'TR-000139', status: 'avaliacao_entrega',
    obraOrigemId: 'ob-005', obraDestinoId: 'ob-002',
    criadaPor: 'Ana Prado', criadaEm: '2026-08-24T08:00:00',
    entrada: 'saida_direta',
    observacao: 'Cimento e lona liberados pela Tower V.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-897-p', 500), item('in-11654-a', 300)],
    aprovadaPor: 'Kaio Ambrosio', aprovadaEm: '2026-08-24T10:12:00',
    despachadaEm: '2026-08-25T06:40:00', previsaoChegada: '2026-08-29T00:00:00',
    chegadaEm: '2026-08-29T07:50:00',
    eventos: [
      ev('criada', '2026-08-24T08:00:00', 'Ana Prado', 'origem', 'Suplos Tower V'),
      ev('enviada_aprovacao', '2026-08-24T08:01:00', 'Ana Prado', 'origem', 'Suplos Tower V'),
      ev('aprovada', '2026-08-24T10:12:00', 'Kaio Ambrosio', 'aprovador', 'Suplos Tower II'),
      ev('despachada', '2026-08-25T06:40:00', 'Ana Prado', 'origem', 'Suplos Tower V', 'Previsão de chegada: 29/08/2026'),
      ev('chegada_registrada', '2026-08-29T07:50:00', 'Rafael Menezes', 'destino', 'Suplos Tower II'),
    ],
  },
  {
    id: 'tr-143', codigo: 'TR-000143', status: 'aguardando_aprovacao',
    obraOrigemId: 'ob-006', obraDestinoId: 'ob-002',
    criadaPor: 'Bruno Sales', criadaEm: '2026-08-28T09:30:00',
    entrada: 'saida_direta',
    observacao: 'Cabo telefônico excedente da Tower VI.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-15727-a', 200)],
    eventos: [
      ev('criada', '2026-08-28T09:30:00', 'Bruno Sales', 'origem', 'Suplos Tower VI'),
      ev('enviada_aprovacao', '2026-08-28T09:31:00', 'Bruno Sales', 'origem', 'Suplos Tower VI'),
    ],
  },
  {
    id: 'tr-144', codigo: 'TR-000144', status: 'em_transito',
    obraOrigemId: 'ob-001', obraDestinoId: 'ob-002',
    criadaPor: 'Helena Duarte', criadaEm: '2026-08-26T15:00:00',
    entrada: 'saida_direta',
    observacao: 'Terminais para o quadro de força.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-12113-a', 1500)],
    aprovadaPor: 'Kaio Ambrosio', aprovadaEm: '2026-08-26T18:10:00',
    despachadaEm: '2026-08-28T06:20:00', previsaoChegada: '2026-08-30T00:00:00',
    eventos: [
      ev('criada', '2026-08-26T15:00:00', 'Helena Duarte', 'origem', 'Suplos Tower'),
      ev('enviada_aprovacao', '2026-08-26T15:01:00', 'Helena Duarte', 'origem', 'Suplos Tower'),
      ev('aprovada', '2026-08-26T18:10:00', 'Kaio Ambrosio', 'aprovador', 'Suplos Tower II'),
      ev('despachada', '2026-08-28T06:20:00', 'Helena Duarte', 'origem', 'Suplos Tower', 'Previsão de chegada: 30/08/2026'),
    ],
  },
];
