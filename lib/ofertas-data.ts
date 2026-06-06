import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import type { OfertaAfiliada } from '@/types'

type OfertasNetshoesParams = {
  clube?: string | null
  limite?: number
  fallbackAleatorio?: boolean
}

function embaralhar<T>(itens: T[]) {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function ofertaTemPreco(oferta: OfertaAfiliada) {
  const precos = [oferta.preco_pix, oferta.preco].map(Number)
  return precos.some(preco => Number.isFinite(preco) && preco > 0)
}

async function buscarOfertasNetshoes(clube: string | null, limite: number) {
  const supabase = criarSupabaseAdmin()
  let query = supabase
    .from('ofertas_afiliadas')
    .select('*')
    .eq('loja', 'Netshoes')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(Math.max(limite, limite * 3))

  if (clube) query = query.eq('clube', clube)

  const { data, error } = await query.returns<OfertaAfiliada[]>()
  if (error) throw error
  return (data || []).filter(ofertaTemPreco).slice(0, limite)
}

export async function carregarOfertasNetshoes({
  clube = null,
  limite = 12,
  fallbackAleatorio = false,
}: OfertasNetshoesParams = {}) {
  const ofertasClube = await buscarOfertasNetshoes(clube, limite)
  if (!clube || !fallbackAleatorio || ofertasClube.length >= limite) return ofertasClube

  const idsClube = new Set(ofertasClube.map(oferta => oferta.id))
  const ofertasAleatorias = embaralhar(await buscarOfertasNetshoes(null, Math.max(limite * 4, 24)))
    .filter(oferta => !idsClube.has(oferta.id))
    .slice(0, limite - ofertasClube.length)

  return [...ofertasClube, ...ofertasAleatorias]
}
