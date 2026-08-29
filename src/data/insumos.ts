import type { Insumo } from '../domain/types';
import { OBRA_ATUAL } from './obras';

/* Insumos reproduzidos da tabela "Estoque de Materiais" e do dropdown
   "Buscar insumo..." do modal de Saída. O mesmo código aparece duas vezes
   quando existe saldo avulso e saldo de pedido. */
export const INSUMOS: Insumo[] = [
  {
    id: 'in-12113-a', codigo: '12113', nome: 'Terminal de compressão 25mm',
    categoria: 'Materiais Eletricos', tipo: 'avulso', unidade: 'un',
    saldo: 31526, estoqueMin: 0, custoUnitario: 0.87,
    ultimoMovimento: 'Saída - 5un', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-12113-p', codigo: '12113', nome: 'Terminal de compressão 25mm',
    categoria: 'Materiais Eletricos', tipo: 'pedido', unidade: 'un',
    saldo: 1050, estoqueMin: 0, custoUnitario: 0.87,
    ultimoMovimento: 'Entrada - 1000un', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-897-p', codigo: '897 - 9', nome: 'Cimento Portland - Alto Forno - CP III 40',
    categoria: 'Materiais', tipo: 'pedido', unidade: 'kg',
    saldo: 1, estoqueMin: 0, custoUnitario: 0.67,
    ultimoMovimento: 'No movements', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-15347-a', codigo: '15347', nome: 'Curva 90° PVC rígido roscável longa para eletroduto Ø 2 - un',
    categoria: 'Tubos E Eletrodutos', tipo: 'avulso', unidade: 'un',
    saldo: 110, estoqueMin: 0, custoUnitario: 4.20,
    ultimoMovimento: 'Saída - 10un', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-15727-a', codigo: '15727', nome: 'Cabo telefônico CTP-APL com 400 pares Ø 0,50 mm',
    categoria: 'Fios E Cabos', tipo: 'avulso', unidade: 'm',
    saldo: 150, estoqueMin: 0, custoUnitario: 5.00,
    ultimoMovimento: 'Entrada - 50m', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-15348-a', codigo: '15348', nome: 'Disjuntor tripolar padrão europeu curva C 200 A - un',
    categoria: 'Caixas, Passagem E Disjuntores', tipo: 'avulso', unidade: 'un',
    saldo: 50, estoqueMin: 0, custoUnitario: 189.90,
    ultimoMovimento: 'Entrada - 50un', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-11654-p', codigo: '11654', nome: 'Lona plástica preta leve 4 × 100m - 15kg',
    categoria: 'Materiais Diversos', tipo: 'pedido', unidade: 'm',
    saldo: 150, estoqueMin: 18, custoUnitario: 3.10,
    ultimoMovimento: 'Entrada - 150m', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-11654-a', codigo: '11654', nome: 'Lona plástica preta leve 4 × 100m - 15kg',
    categoria: 'Materiais Diversos', tipo: 'avulso', unidade: 'm',
    saldo: 13816, estoqueMin: 18, custoUnitario: 3.10,
    ultimoMovimento: 'Saída - 18m', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-11843-p', codigo: '11843', nome: 'Tinta esmalte sintético antiferrugem',
    categoria: 'Materiais De Acabamento', tipo: 'pedido', unidade: 'l',
    saldo: 2480, estoqueMin: 18, custoUnitario: 62.40,
    ultimoMovimento: 'Entrada - 50l', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-2995-p', codigo: '2995', nome: 'Tê 90º PVC PBV para esgoto Ø 100 mm',
    categoria: 'Tubos E Eletrodutos', tipo: 'pedido', unidade: 'un',
    saldo: 15008, estoqueMin: 0, custoUnitario: 7.66,
    ultimoMovimento: 'Entrada - 15008un', obraId: OBRA_ATUAL,
  },
  {
    id: 'in-9921-a', codigo: '9921', nome: 'Abraçadeira de nylon 2,5 × 150 mm',
    categoria: 'Materiais Diversos', tipo: 'avulso', unidade: 'un',
    saldo: 66, estoqueMin: 115, custoUnitario: 0.18,
    ultimoMovimento: 'Saída - 20un', obraId: OBRA_ATUAL,
  },
];

export function rotuloInsumo(i: Insumo): string {
  return `${i.codigo} | ${i.nome} | ${i.tipo === 'avulso' ? 'avulsa' : 'pedido'}`;
}
