export type Produto = {
  id: string
  titulo: string
  ano: string | null
  preco: number | null
  imagem_url: string | null
  link_original: string
  fonte_nome: string
  fonte_url: string
  clube: string | null
  tags: string[]
  de_jogo: boolean
  novidade: boolean
  alta_procura: boolean
  created_at: string
  updated_at: string
}

export type Fonte = {
  id: string
  nome: string
  url: string
  ativa: boolean
  ultimo_scraping: string | null
  total_produtos: number
  created_at: string
}
