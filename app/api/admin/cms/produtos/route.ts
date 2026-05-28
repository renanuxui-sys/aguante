import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const POR_PAGINA = 20
const PAGE_AGREGACAO = 1000

async function sessaoAdminValida() {
  const cookieStore = await cookies()
  return validarSessaoAdmin(cookieStore.get('admin_session')?.value)
}

async function carregarClubes() {
  const clubes = new Set<string>()
  let offset = 0
  const supabase = criarSupabaseAdmin()

  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('clube')
      .eq('ativo', true)
      .not('clube', 'is', null)
      .range(offset, offset + PAGE_AGREGACAO - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    data.forEach(produto => {
      if (produto.clube) clubes.add(produto.clube)
    })

    if (data.length < PAGE_AGREGACAO) break
    offset += PAGE_AGREGACAO
  }

  return [...clubes].sort()
}

async function carregarRankingClubes(limite?: number) {
  const contagem: Record<string, number> = {}
  let offset = 0
  const supabase = criarSupabaseAdmin()

  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('clube')
      .eq('ativo', true)
      .not('clube', 'is', null)
      .range(offset, offset + PAGE_AGREGACAO - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    data.forEach(produto => {
      if (produto.clube) contagem[produto.clube] = (contagem[produto.clube] || 0) + 1
    })

    if (data.length < PAGE_AGREGACAO) break
    offset += PAGE_AGREGACAO
  }

  const ranking = Object.entries(contagem)
    .map(([clube, total]) => ({ clube, total }))
    .sort((a, b) => b.total - a.total)

  return {
    ranking: typeof limite === 'number' ? ranking.slice(0, limite) : ranking,
    totalGeral: ranking.reduce((total, item) => total + item.total, 0),
  }
}

async function carregarRankingLojas() {
  const agregado: Record<string, { fonte_url: string | null; cliques: number; produtos: number; views: number }> = {}
  let offset = 0
  const supabase = criarSupabaseAdmin()

  while (true) {
    const { data, error } = await supabase
      .from('produtos')
      .select('fonte_nome, fonte_url, cliques_anuncio, views')
      .eq('ativo', true)
      .not('fonte_nome', 'is', null)
      .range(offset, offset + PAGE_AGREGACAO - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    data.forEach(produto => {
      const nome = produto.fonte_nome
      if (!nome) return

      if (!agregado[nome]) {
        agregado[nome] = { fonte_url: produto.fonte_url, cliques: 0, produtos: 0, views: 0 }
      }

      agregado[nome].cliques += produto.cliques_anuncio || 0
      agregado[nome].produtos += 1
      agregado[nome].views += produto.views || 0
    })

    if (data.length < PAGE_AGREGACAO) break
    offset += PAGE_AGREGACAO
  }

  const lojas = Object.entries(agregado)
    .map(([fonte_nome, valor]) => ({
      fonte_nome,
      fonte_url: valor.fonte_url,
      total_cliques: valor.cliques,
      total_produtos: valor.produtos,
      total_views: valor.views,
    }))
    .sort((a, b) => b.total_cliques - a.total_cliques)

  return {
    lojas,
    totalCliques: lojas.reduce((total, loja) => total + loja.total_cliques, 0),
  }
}

export async function GET(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const modo = searchParams.get('modo')

    if (modo === 'clubes') return Response.json(await carregarRankingClubes())
    if (modo === 'lojas') return Response.json(await carregarRankingLojas())

    if (modo === 'resumo') {
      const supabase = criarSupabaseAdmin()
      const [{ count: totalProdutos, error }, clubes] = await Promise.all([
        supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true),
        carregarRankingClubes(8),
      ])

      if (error) throw error
      return Response.json({ totalProdutos: totalProdutos || 0, clubesRanking: clubes.ranking })
    }

    const pagina = Math.max(Number(searchParams.get('pagina') || 0), 0)
    const busca = searchParams.get('busca')?.trim() || ''
    const clube = searchParams.get('clube')?.trim() || ''
    const ativo = searchParams.get('ativo') || 'todos'
    const supabase = criarSupabaseAdmin()

    let query = supabase
      .from('produtos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1)

    if (busca) query = query.ilike('titulo', `%${busca}%`)
    if (clube) query = query.eq('clube', clube)
    if (ativo === 'ativos') query = query.eq('ativo', true)
    if (ativo === 'inativos') query = query.eq('ativo', false)

    const [{ data, count, error }, clubes] = await Promise.all([query, carregarClubes()])
    if (error) throw error

    return Response.json({ produtos: data || [], total: count || 0, clubes })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao carregar produtos.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!await sessaoAdminValida()) return Response.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return Response.json({ error: 'Produto não informado.' }, { status: 400 })

    const atualizacao: Record<string, unknown> = {}
    ;['ativo', 'de_jogo', 'novidade', 'alta_procura'].forEach(campo => {
      if (typeof body[campo] === 'boolean') atualizacao[campo] = body[campo]
    })

    if (typeof body.ativo === 'boolean') {
      atualizacao.inactivated_at = body.ativo ? null : new Date().toISOString()
      if (body.ativo) atualizacao.reactivated_at = new Date().toISOString()
    }

    if (Object.keys(atualizacao).length === 0) {
      return Response.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    atualizacao.updated_at = new Date().toISOString()

    const { data, error } = await criarSupabaseAdmin()
      .from('produtos')
      .update(atualizacao)
      .eq('id', id)
      .select('*')
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ produto: data })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar produto.' }, { status: 500 })
  }
}
