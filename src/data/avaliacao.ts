/* ============================================================
   Fichas de avaliação de entrega (FVM).
   Cada ficha acrescenta critérios à avaliação — quais fichas
   existem é configuração do cliente, como o glossário indica.
   ============================================================ */

export type TipoCriterio = 'estrelas' | 'sim_nao';

export interface Criterio {
  id: string;
  nome: string;
  tipo: TipoCriterio;
  ajuda: string;
}

export interface Ficha {
  id: string;
  nome: string;
  criterios: Criterio[];
}

export const FICHAS: Ficha[] = [
  {
    id: 'fc-teste',
    nome: 'Ficha Teste',
    criterios: [
      { id: 'cr-pontualidade', nome: 'Pontualidade', tipo: 'estrelas', ajuda: 'O material chegou dentro da previsão de chegada?' },
      { id: 'cr-avaria', nome: 'Avaria', tipo: 'sim_nao', ajuda: 'Houve item danificado no trajeto?' },
      { id: 'cr-qualidade', nome: 'Qualidade', tipo: 'estrelas', ajuda: 'O material chegou em condição de uso?' },
    ],
  },
  {
    id: 'fc-alvenaria',
    nome: 'Ficha de alvenaria',
    criterios: [
      { id: 'cr-a', nome: 'A', tipo: 'estrelas', ajuda: 'Critério A da ficha de alvenaria.' },
      { id: 'cr-b', nome: 'B', tipo: 'estrelas', ajuda: 'Critério B da ficha de alvenaria.' },
      { id: 'cr-c', nome: 'C', tipo: 'sim_nao', ajuda: 'Critério C da ficha de alvenaria.' },
    ],
  },
];

export function criteriosDasFichas(fichas: string[]): Criterio[] {
  return FICHAS.filter((f) => fichas.includes(f.id)).flatMap((f) => f.criterios);
}

export function nomeCriterio(id: string): string {
  for (const f of FICHAS) {
    const c = f.criterios.find((x) => x.id === id);
    if (c) return c.nome;
  }
  return id;
}
