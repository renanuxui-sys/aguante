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
  disponivelSimulacao: boolean
  imagensExtras: number
  precoPdv: number
}

// Dados de referência do catálogo ICONYX, apenas para a prévia da loja.
export const produtosExemplo: ProdutoExemplo[] = [
  { slug: 'neo-quimica-arena-premium', sku: 'ICFUT0020', precoPdv: 1699, nome: 'Neo Química Arena Premium', clube: 'Corinthians', categoria: 'premium', categoriaNome: 'Estádio Premium', pecas: 1800, dimensoes: '35,2 × 30,7 × 19,6 cm', escala: '1:800', disponivelSimulacao: true, imagensExtras: 1 },
  { slug: 'neo-quimica-arena-standard', sku: 'ICFUT0019', precoPdv: 699, nome: 'Neo Química Arena Standard', clube: 'Corinthians', categoria: 'standard', categoriaNome: 'Estádio Standard', pecas: 961, dimensoes: '23,2 × 21,9 × 8,9 cm', escala: '1:1400', disponivelSimulacao: false, imagensExtras: 1 },
  { slug: 'palestra-italia-premium', sku: 'ICFUT0076', precoPdv: 1699, nome: 'Palestra Italia Premium', clube: 'Palmeiras', categoria: 'premium', categoriaNome: 'Estádio Premium', pecas: 1630, dimensoes: '29,4 × 40 × 14,4 cm', escala: '1:800', disponivelSimulacao: true, imagensExtras: 1 },
  { slug: 'palestra-italia-standard', sku: 'ICFUT0075', precoPdv: 699, nome: 'Palestra Italia Standard', clube: 'Palmeiras', categoria: 'standard', categoriaNome: 'Estádio Standard', pecas: 623, dimensoes: '16,7 × 27 × 9,3 cm', escala: '1:1400', disponivelSimulacao: false, imagensExtras: 1 },
  { slug: 'morumbi-premium', sku: 'ICFUT0010', precoPdv: 1699, nome: 'Morumbi Premium', clube: 'São Paulo', categoria: 'premium', categoriaNome: 'Estádio Premium', pecas: 1868, dimensoes: '32,8 × 40,5 × 13,4 cm', escala: '1:800', disponivelSimulacao: false, imagensExtras: 1 },
  { slug: 'vila-belmiro-standard', sku: 'ICFUT0004', precoPdv: 699, nome: 'Vila Belmiro Standard', clube: 'Santos', categoria: 'standard', categoriaNome: 'Estádio Standard', pecas: 686, dimensoes: '19,2 × 21,1 × 6,3 cm', escala: '1:1000', disponivelSimulacao: true, imagensExtras: 1 },
  { slug: 'mascote-corinthians', sku: 'ICFUT0018', precoPdv: 249, nome: 'Mascote Corinthians', clube: 'Corinthians', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 322, dimensoes: '10,8 × 9,6 × 21,4 cm', disponivelSimulacao: true, imagensExtras: 2 },
  { slug: 'mascote-palmeiras', sku: 'ICFUT0013', precoPdv: 249, nome: 'Mascote Palmeiras', clube: 'Palmeiras', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 296, dimensoes: '9,8 × 8,5 × 18 cm', disponivelSimulacao: true, imagensExtras: 2 },
  { slug: 'morumbi-standard', sku: 'ICFUT0009', precoPdv: 699, nome: 'Morumbi Standard', clube: 'São Paulo', categoria: 'standard', categoriaNome: 'Estádio Standard', pecas: 754, dimensoes: '24,8 × 21,3 × 9,9 cm', escala: '1:1400', disponivelSimulacao: true, imagensExtras: 1 },
  { slug: 'mascote-sao-paulo', sku: 'ICFUT0008', precoPdv: 249, nome: 'Mascote São Paulo', clube: 'São Paulo', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 314, dimensoes: '9,5 × 8,5 × 17,4 cm', disponivelSimulacao: false, imagensExtras: 2 },
  { slug: 'vila-belmiro-premium', sku: 'ICFUT0005', precoPdv: 1699, nome: 'Vila Belmiro Premium', clube: 'Santos', categoria: 'premium', categoriaNome: 'Estádio Premium', pecas: 1496, dimensoes: '33,9 × 33,6 × 8,7 cm', escala: '1:500', disponivelSimulacao: false, imagensExtras: 1 },
  { slug: 'mascote-santos', sku: 'ICFUT0003', precoPdv: 249, nome: 'Mascote Santos', clube: 'Santos', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 307, dimensoes: '9,1 × 8,5 × 16,4 cm', disponivelSimulacao: false, imagensExtras: 2 },
  { slug: 'couto-pereira-premium', sku: 'ICFUT0025', precoPdv: 999, nome: 'Couto Pereira Premium', clube: 'Coritiba', categoria: 'premium', categoriaNome: 'Estádio Premium', pecas: 1099, dimensoes: '25,8 × 28,8 × 14,2 cm', escala: '1:800', disponivelSimulacao: false, imagensExtras: 1 },
  { slug: 'couto-pereira-standard', sku: 'ICFUT0024', precoPdv: 599, nome: 'Couto Pereira Standard', clube: 'Coritiba', categoria: 'standard', categoriaNome: 'Estádio Standard', pecas: 670, dimensoes: '18,1 × 20 × 9,9 cm', escala: '1:1400', disponivelSimulacao: false, imagensExtras: 1 },
  { slug: 'mascote-coritiba', sku: 'ICFUT0023', precoPdv: 249, nome: 'Mascote Coritiba', clube: 'Coritiba', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 322, dimensoes: '9,8 × 8,5 × 17,7 cm', disponivelSimulacao: false, imagensExtras: 2 },
  { slug: 'mascote-botafogo', sku: 'ICFUT0052', precoPdv: 249, nome: 'Mascote Botafogo', clube: 'Botafogo', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 303, dimensoes: '9,6 × 8,5 × 18,2 cm', disponivelSimulacao: false, imagensExtras: 2 },
  { slug: 'mascote-fluminense', sku: 'ICFUT0037', precoPdv: 249, nome: 'Mascote Fluminense', clube: 'Fluminense', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 325, dimensoes: '9,5 × 10,9 × 17,8 cm', disponivelSimulacao: false, imagensExtras: 2 },
  { slug: 'mascote-atletico-mineiro', sku: 'ICFUT0055', precoPdv: 249, nome: 'Mascote Atlético Mineiro', clube: 'Atlético Mineiro', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 317, dimensoes: '10,1 × 8,5 × 18,3 cm', disponivelSimulacao: false, imagensExtras: 2 },
  { slug: 'mascote-cruzeiro', sku: 'ICFUT0043', precoPdv: 249, nome: 'Mascote Cruzeiro', clube: 'Cruzeiro', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 316, dimensoes: '9,6 × 8,5 × 18,8 cm', disponivelSimulacao: false, imagensExtras: 2 },
  { slug: 'mascote-ceara', sku: 'ICFUT0049', precoPdv: 249, nome: 'Mascote Ceará', clube: 'Ceará', categoria: 'mascotes', categoriaNome: 'Mascote', pecas: 311, dimensoes: '9,5 × 8,5 × 17 cm', disponivelSimulacao: false, imagensExtras: 2 },
]
