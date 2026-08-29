import type { Obra } from '../domain/types';

/* Obras conforme o dropdown "Obra de transferência" do produto atual. */
export const OBRAS: Obra[] = [
  { id: 'ob-002', nome: 'Suplos Tower II' },   // obra em que o usuário está logado
  { id: 'ob-001', nome: 'Suplos Tower' },
  { id: 'ob-003', nome: 'Suplos Tower III' },
  { id: 'ob-004', nome: 'Suplos Tower IV' },
  { id: 'ob-005', nome: 'Suplos Tower V' },
  { id: 'ob-006', nome: 'Suplos Tower VI' },
  { id: 'ob-007', nome: 'Suplos Tower VII' },
];

export const OBRA_ATUAL = 'ob-002';

export function nomeObra(id: string): string {
  return OBRAS.find((o) => o.id === id)?.nome ?? id;
}
