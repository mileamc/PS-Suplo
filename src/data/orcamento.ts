/* ============================================================
   Linhas de orçamento — apropriação de custos.

   Restrição do time: "Material de pedido exige apropriação de
   custos: um select de linha de orçamento que mostra o disponível
   em cada canteiro. Material avulso não exige nada disso."

   Os códigos e saldos abaixo são placeholders de protótipo, no
   formato de EAP que a construção civil usa. Substituir pelos
   reais quando o time enviar a lista.
   ============================================================ */

export interface LinhaOrcamento {
  id: string;
  codigo: string;
  nome: string;
  /** Saldo de orçamento disponível por obra, em reais. */
  disponivelPorObra: Record<string, number>;
}

export const LINHAS_ORCAMENTO: LinhaOrcamento[] = [
  {
    id: 'lo-0201', codigo: '02.01.01', nome: 'Estrutura — concreto e formas',
    disponivelPorObra: { 'ob-002': 412_800, 'ob-001': 98_400, 'ob-003': 233_100, 'ob-004': 51_900, 'ob-005': 180_000, 'ob-006': 76_500, 'ob-007': 145_200 },
  },
  {
    id: 'lo-0302', codigo: '03.02.01', nome: 'Instalações elétricas — infraestrutura',
    disponivelPorObra: { 'ob-002': 128_450, 'ob-001': 44_900, 'ob-003': 88_300, 'ob-004': 12_700, 'ob-005': 63_400, 'ob-006': 29_800, 'ob-007': 71_050 },
  },
  {
    id: 'lo-0304', codigo: '03.04.02', nome: 'Instalações hidráulicas — esgoto',
    disponivelPorObra: { 'ob-002': 96_200, 'ob-001': 31_500, 'ob-003': 57_800, 'ob-004': 24_300, 'ob-005': 40_100, 'ob-006': 18_900, 'ob-007': 52_600 },
  },
  {
    id: 'lo-0501', codigo: '05.01.03', nome: 'Alvenaria de vedação',
    disponivelPorObra: { 'ob-002': 74_900, 'ob-001': 22_100, 'ob-003': 39_600, 'ob-004': 9_400, 'ob-005': 28_700, 'ob-006': 15_300, 'ob-007': 33_800 },
  },
  {
    id: 'lo-0702', codigo: '07.02.01', nome: 'Acabamento — pintura e tratamento',
    disponivelPorObra: { 'ob-002': 58_300, 'ob-001': 17_600, 'ob-003': 26_400, 'ob-004': 7_200, 'ob-005': 21_500, 'ob-006': 11_800, 'ob-007': 24_900 },
  },
];

export function rotuloLinha(l: LinhaOrcamento): string {
  return `${l.codigo} — ${l.nome}`;
}

export function linhaPorId(id: string | undefined): LinhaOrcamento | undefined {
  return id ? LINHAS_ORCAMENTO.find((l) => l.id === id) : undefined;
}
