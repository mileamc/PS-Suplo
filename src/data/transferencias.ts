import type { Role, Transferencia, TransferEvento, TransferItem, EventoTipo } from '../domain/types';
import { INSUMOS } from './insumos';

let evSeq = 0;
function ev(
  tipo: EventoTipo, em: string, porNome: string,
  porPapel: Role | 'sistema', obra: string, detalhe?: string,
): TransferEvento {
  return { id: `evt-${++evSeq}`, tipo, em, porNome, porPapel, obra, detalhe };
}

/* Item de pedido sempre carrega a linha de orçamento onde o custo é
   apropriado; item avulso não exige esse campo. */
const LINHA_POR_INSUMO: Record<string, string> = {
  'in-12113-p': 'lo-0302',
  'in-897-p': 'lo-0201',
  'in-11654-p': 'lo-0501',
  'in-11843-p': 'lo-0702',
  'in-2995-p': 'lo-0304',
};

function item(insumoId: string, qtdEnviada: number, qtdRecebida: number | null = null, motivo?: string): TransferItem {
  const i = INSUMOS.find((x) => x.id === insumoId)!;
  return {
    insumoId: i.id, codigo: i.codigo, nome: i.nome, unidade: i.unidade,
    tipo: i.tipo, custoUnitario: i.custoUnitario,
    linhaOrcamento: i.tipo === 'pedido' ? LINHA_POR_INSUMO[i.id] : undefined,
    qtdEnviada, qtdRecebida, motivoDivergencia: motivo,
  };
}

const AVALIACAO_OK = {
  fichas: ['fc-teste', 'fc-alvenaria'],
  respostas: { 'cr-pontualidade': 5, 'cr-avaria': false, 'cr-qualidade': 5, 'cr-a': 4, 'cr-b': 5, 'cr-c': false },
  observacao: 'Carga conferida item a item na descarga, sem intercorrência.',
  anexos: ['canhoto-assinado.pdf'],
};

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
  /* ---------- ⭐ O caso central do problema: divergência ---------
     O destino já conferiu e já anexou a nota fiscal — e mesmo assim a
     transferência não fechou: falta a obra de origem decidir se manda as
     28 peças que faltaram ou se encerra assumindo a perda. É esse gancho
     que mantém o caso vivo em vez de virar um registro morto. ---------- */
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
    dataSaida: '2026-08-15', despachadaEm: '2026-08-15T07:30:00', previsaoChegada: '2026-08-19T00:00:00',
    chegadaEm: '2026-08-20T08:05:00',
    recebidaPor: 'Josué Barbosa', recebidaEm: '2026-08-20T08:41:00',
    avaliacao: {
      fichas: ['fc-teste', 'fc-alvenaria'],
      respostas: { 'cr-pontualidade': 2, 'cr-avaria': true, 'cr-qualidade': 3, 'cr-a': 3, 'cr-b': 3, 'cr-c': true },
      observacao: 'Volume não conferia já na chegada. Motorista não soube informar onde as peças ficaram.',
      anexos: ['foto-descarga-1.jpg', 'foto-descarga-2.jpg'],
      avaliadaPor: 'Josué Barbosa', avaliadaEm: '2026-08-20T08:41:00',
    },
    nf: {
      numero: '000.398.771', anexo: 'nf-tr-000136.pdf',
      confirmadaPor: 'Josué Barbosa', confirmadaEm: '2026-08-21T10:12:00',
    },
    eventos: [
      ev('criada', '2026-08-14T09:12:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('aprovada', '2026-08-14T15:40:00', 'Kaio Ambrosio', 'aprovador', 'Suplos Tower IV'),
      ev('despachada', '2026-08-15T07:30:00', 'Rafael Menezes', 'origem', 'Suplos Tower II', 'Previsão de chegada: 19/08/2026'),
      ev('chegada_registrada', '2026-08-20T08:05:00', 'Josué Barbosa', 'destino', 'Suplos Tower IV', 'Chegou 1 dia após a previsão'),
      ev('recebida_divergencia', '2026-08-20T08:41:00', 'Josué Barbosa', 'destino', 'Suplos Tower IV', 'Faltaram 28 un de Curva 90° PVC'),
      ev('nf_confirmada', '2026-08-21T10:12:00', 'Josué Barbosa', 'destino', 'Suplos Tower IV', 'NF 000.398.771'),
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
    dataSaida: '2026-08-27', despachadaEm: '2026-08-27T06:50:00', previsaoChegada: '2026-09-01T00:00:00',
    eventos: [
      ev('criada', '2026-08-25T10:10:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
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
    dataSaida: '2026-08-11', despachadaEm: '2026-08-11T07:15:00', previsaoChegada: '2026-08-14T00:00:00',
    chegadaEm: '2026-08-14T09:20:00',
    recebidaPor: 'Tiago Lemos', recebidaEm: '2026-08-14T09:35:00',
    avaliacao: { ...AVALIACAO_OK, avaliadaPor: 'Tiago Lemos', avaliadaEm: '2026-08-14T09:35:00' },
    nf: {
      numero: '000.377.104', anexo: 'nf-tr-000131.pdf',
      confirmadaPor: 'Tiago Lemos', confirmadaEm: '2026-08-14T15:02:00',
    },
    eventos: [
      ev('criada', '2026-08-10T13:00:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('aprovada', '2026-08-10T16:30:00', 'Marina Coelho', 'aprovador', 'Suplos Tower III'),
      ev('despachada', '2026-08-11T07:15:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('chegada_registrada', '2026-08-14T09:20:00', 'Tiago Lemos', 'destino', 'Suplos Tower III'),
      ev('recebida_ok', '2026-08-14T09:35:00', 'Tiago Lemos', 'destino', 'Suplos Tower III'),
      ev('nf_confirmada', '2026-08-14T15:02:00', 'Tiago Lemos', 'destino', 'Suplos Tower III', 'NF 000.377.104'),
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
    dataSaida: '2026-08-25', despachadaEm: '2026-08-25T06:40:00', previsaoChegada: '2026-08-29T00:00:00',
    chegadaEm: '2026-08-29T07:50:00',
    eventos: [
      ev('criada', '2026-08-24T08:00:00', 'Ana Prado', 'origem', 'Suplos Tower V'),
      ev('aprovada', '2026-08-24T10:12:00', 'Kaio Ambrosio', 'aprovador', 'Suplos Tower II'),
      ev('despachada', '2026-08-25T06:40:00', 'Ana Prado', 'origem', 'Suplos Tower V', 'Previsão de chegada: 29/08/2026'),
      ev('chegada_registrada', '2026-08-29T07:50:00', 'Rafael Menezes', 'destino', 'Suplos Tower II'),
    ],
  },
  {
    id: 'tr-137', codigo: 'TR-000137', status: 'aguardando_nf',
    obraOrigemId: 'ob-003', obraDestinoId: 'ob-002',
    criadaPor: 'Marina Coelho', criadaEm: '2026-08-21T09:15:00',
    entrada: 'saida_direta',
    observacao: 'Disjuntores excedentes do quadro provisório da Tower III.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-15348-a', 18, 18)],
    aprovadaPor: 'Kaio Ambrosio', aprovadaEm: '2026-08-21T11:40:00',
    dataSaida: '2026-08-22', despachadaEm: '2026-08-22T07:10:00',
    previsaoChegada: '2026-08-26T00:00:00',
    chegadaEm: '2026-08-26T09:05:00',
    recebidaPor: 'Rafael Menezes', recebidaEm: '2026-08-26T09:30:00',
    avaliacao: { ...AVALIACAO_OK, avaliadaPor: 'Rafael Menezes', avaliadaEm: '2026-08-26T09:30:00' },
    eventos: [
      ev('criada', '2026-08-21T09:15:00', 'Marina Coelho', 'origem', 'Suplos Tower III'),
      ev('aprovada', '2026-08-21T11:40:00', 'Kaio Ambrosio', 'aprovador', 'Suplos Tower II'),
      ev('despachada', '2026-08-22T07:10:00', 'Marina Coelho', 'origem', 'Suplos Tower III', 'Saiu em 22/08/2026 · previsão de chegada 26/08/2026'),
      ev('chegada_registrada', '2026-08-26T09:05:00', 'Rafael Menezes', 'destino', 'Suplos Tower II'),
      ev('recebida_ok', '2026-08-26T09:30:00', 'Rafael Menezes', 'destino', 'Suplos Tower II'),
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
    ],
  },
  /* ---------- Divergência já encerrada pela origem ---------------
     O outro desfecho possível do mesmo caso: a origem olhou a falta,
     decidiu que não valia um novo frete e encerrou assumindo a perda. --- */
  {
    id: 'tr-131', codigo: 'TR-000131', status: 'encerrado_divergencia',
    obraOrigemId: 'ob-002', obraDestinoId: 'ob-005',
    criadaPor: 'Rafael Menezes', criadaEm: '2026-07-28T10:05:00',
    entrada: 'requisicao', requisicaoCodigo: 'RQ-004411',
    observacao: 'Saldo de abraçadeiras da fachada.',
    assinatura: ASSINATURA_MOCK, ciclo: 0,
    itens: [item('in-11654-p', 400, 355, 'Duas caixas chegaram rasgadas; 45 peças perdidas no trajeto.')],
    aprovadaPor: 'Kaio Ambrosio', aprovadaEm: '2026-07-28T14:20:00',
    dataSaida: '2026-07-29', despachadaEm: '2026-07-29T07:10:00', previsaoChegada: '2026-08-01T00:00:00',
    chegadaEm: '2026-08-01T09:30:00',
    recebidaPor: 'Josué Barbosa', recebidaEm: '2026-08-01T10:02:00',
    nf: {
      numero: '000.391.204', anexo: 'nf-tr-000131.pdf',
      confirmadaPor: 'Josué Barbosa', confirmadaEm: '2026-08-02T11:40:00',
    },
    encerramento: {
      por: 'Rafael Menezes', em: '2026-08-04T08:15:00',
      observacao: 'Perda apurada com a transportadora. Não compensa um frete novo por 45 peças.',
    },
    eventos: [
      ev('criada', '2026-07-28T10:05:00', 'Rafael Menezes', 'origem', 'Suplos Tower II'),
      ev('aprovada', '2026-07-28T14:20:00', 'Kaio Ambrosio', 'aprovador', 'Suplos Tower V'),
      ev('despachada', '2026-07-29T07:10:00', 'Rafael Menezes', 'origem', 'Suplos Tower II', 'Previsão de chegada: 01/08/2026'),
      ev('chegada_registrada', '2026-08-01T09:30:00', 'Josué Barbosa', 'destino', 'Suplos Tower V'),
      ev('recebida_divergencia', '2026-08-01T10:02:00', 'Josué Barbosa', 'destino', 'Suplos Tower V', 'Faltaram 45 un de Abraçadeira de nylon'),
      ev('nf_confirmada', '2026-08-02T11:40:00', 'Josué Barbosa', 'destino', 'Suplos Tower V', 'NF 000.391.204'),
      ev('divergencia_encerrada', '2026-08-04T08:15:00', 'Rafael Menezes', 'origem', 'Suplos Tower II', 'Perda de 45 un assumida pela origem'),
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
    dataSaida: '2026-08-28', despachadaEm: '2026-08-28T06:20:00', previsaoChegada: '2026-08-30T00:00:00',
    eventos: [
      ev('criada', '2026-08-26T15:00:00', 'Helena Duarte', 'origem', 'Suplos Tower'),
      ev('aprovada', '2026-08-26T18:10:00', 'Kaio Ambrosio', 'aprovador', 'Suplos Tower II'),
      ev('despachada', '2026-08-28T06:20:00', 'Helena Duarte', 'origem', 'Suplos Tower', 'Previsão de chegada: 30/08/2026'),
    ],
  },
];
