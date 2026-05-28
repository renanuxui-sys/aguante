export type Produto = {
  id: string
  titulo: string
  ano: string | null
  preco: number | null
  imagem_url: string | null
  link_original: string
  fonte_id?: string | null
  fonte_nome: string
  fonte_url: string
  clube: string | null
  tipo_camisa?: string | null
  tags: string[]
  de_jogo: boolean
  novidade: boolean
  alta_procura: boolean
  ativo?: boolean
  views?: number
  likes?: number
  cliques_anuncio?: number
  last_seen_at?: string | null
  inactivated_at?: string | null
  reactivated_at?: string | null
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

export type OfertaAfiliada = {
  id: string
  loja: 'Mercado Livre' | 'Netshoes'
  titulo: string
  preco: number | null
  imagem_url: string | null
  link_afiliado: string
  link_produto: string | null
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export type StoreCoupon = {
  id: string
  store_id: string | null
  store_name: string
  code: string
  discount_label: string
  description: string | null
  rules: string | null
  valid_from: string | null
  valid_until: string | null
  is_active: boolean
  campaign: string | null
  created_at: string
  updated_at: string
}
