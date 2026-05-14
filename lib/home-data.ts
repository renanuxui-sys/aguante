import { criarSupabaseAdmin } from '@/lib/supabase-admin'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'

export async function carregarHomeDataServidor() {
  const supabase = criarSupabaseAdmin()

  const [
    metricas,
    novidades,
    clubesSelecoes,
    emAlta,
    anos80,
    clubes,
  ] = await Promise.all([
    supabase
      .from('home_metricas')
      .select('total_produtos,novos_24h')
      .eq('id', 'principal')
      .maybeSingle(),
    supabase
      .from('produtos')
      .select(PRODUCT_CARD_SELECT)
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(30),
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
    metricas: metricas.data || null,
    novidades: novidades.data || [],
    selecoes: selecoes.data || [],
    emAlta: emAlta.data || [],
    anos80: anos80.data || [],
    clubes: clubes.data || [],
  }
}
