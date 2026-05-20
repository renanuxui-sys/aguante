import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'

function embaralhar<T>(itens: T[]) {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

async function contar(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count || 0
}

export async function carregarHomeDataServidor() {
  const supabase = criarSupabaseAdmin()
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [
    totalProdutos,
    novos24h,
    novidades,
    clubesSelecoes,
    emAlta,
    anos80,
    clubes,
  ] = await Promise.all([
    contar(supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true)),
    contar(supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true).gte('created_at', ontem)),
    supabase
      .from('produtos')
      .select(PRODUCT_CARD_SELECT)
      .eq('ativo', true)
      .gte('created_at', ontem)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('clubes')
      .select('nome')
      .eq('ativo', true)
      .eq('categoria', 'Seleções'),
    supabase
      .from('produtos')
      .select(PRODUCT_CARD_SELECT)
      .eq('ativo', true)
      .order('views', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('produtos')
      .select(PRODUCT_CARD_SELECT)
      .eq('ativo', true)
      .gte('ano', '1980')
      .lte('ano', '1989')
      .limit(20),
    supabase
      .from('clubes')
      .select('id,nome,slug,escudo_url')
      .eq('pais', 'Brasil')
      .eq('destaque', true)
      .eq('ativo', true)
      .order('ordem', { ascending: true }),
  ])

  const nomesSelecoes = (clubesSelecoes.data || []).map(clube => clube.nome).filter(Boolean)
  const selecoes = nomesSelecoes.length
    ? await supabase
        .from('produtos')
        .select(PRODUCT_CARD_SELECT)
        .eq('ativo', true)
        .in('clube', nomesSelecoes)
        .order('views', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  return {
    metricas: {
      total_produtos: totalProdutos,
      novos_24h: novos24h,
    },
    novidades: embaralhar(novidades.data || []),
    selecoes: embaralhar(selecoes.data || []),
    emAlta: embaralhar(emAlta.data || []),
    anos80: anos80.data || [],
    clubes: clubes.data || [],
  }
}
