export type ProdutoExemplo = {
  slug: string
  sku: string
  nome: string
  clube: string
  categoria: 'premium' | 'standard' | 'mascotes'
  categoriaNome: string
  pecas: number
  dimensoes: string
  escala?: string
  listaEspera: boolean
}

// Dados de referência do catálogo ICONYX, apenas para a prévia da loja.
export const produtosExemplo: ProdutoExemplo[] = [
  { slug: 'neo-quimica-arena-premium', sku: 'ICFUT0020', nome: 'Neo Química Arena Premium', clube: 'Corinthians', categoria: 'premium', categoriaNome: 'Estádio Premium', pecas: 1800, dimensoes: '35,2 × 30,7 × 19,6 cm', escala: '1:800', listaEspera: true },
  { slug: 'neo-quimica-arena-standard', sku: 'ICFUT0019', nome: 'Neo Química Arena Standard', clube: 'Corinthians', categoria: 'standard', categoriaNome: 'Estádio Standard', pecas: 961, dimensoes: '23,2 × 21,9 × 8,9 cm', escala: '1:1400', listaEspera: false },
  { slug: 'palestra-italia-premium', sku: 'ICFUT0076', nome: 'Palestra Italia Premium', clube: 'Palmeiras', categoria: 'premium', categoriaNome: 'Estádio Premium', pecas: 1630, dimensoes: '29,4 × 40 × 14,4 cm', escala: '1:800', listaEspera: true },
  { slug: 'palestra-italia-standard', sku: 'ICFUT0075', nome: 'Palestra Italia Standard', clube: 'Palmeiras', categoria: 'standard', categoriaNome: 'Estádio Standard', pecas: 623, dimensoes: '16,7 × 27 × 9,3 cm', escala: '1:1400', listaEspera: false },
  { slug: 'morumbi-premium', sku: 'ICFUT0010', nome: 'Morumbi Premium', clube: 'São Paulo', categoria: 'premium', categoriaNome: 'Estádio Premium', pecas: 1868, dimensoes: '32,8 × 40,5 × 13,4 cm', escala: '1:800', listaEspera: true },
  { slug: 'vila-belmiro-standard', sku: 'ICFUT0004', nome: 'Vila Belmiro Standard', clube: 'Santos', categoria: 'standard', categoriaNome: 'Estádio Standard', pecas: 686, dimensoes: '19,2 × 21,1 × 6,3 cm', escala: '1:1000', listaEspera: false },
  { slug: 'mascote-corinthians', sku: 'ICFUT0018', nome: 'Mascote Corinthians', clube: 'Corinthians', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 322, dimensoes: '10,8 × 9,6 × 21,4 cm', listaEspera: true },
  { slug: 'mascote-palmeiras', sku: 'ICFUT0013', nome: 'Mascote Palmeiras', clube: 'Palmeiras', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 296, dimensoes: '9,8 × 8,5 × 18 cm', listaEspera: false },
]
