import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const METRICAS = {
  views: { campo: 'views', label: 'views' },
  cliques: { campo: 'cliques_anuncio', label: 'cliques' },
  likes: { campo: 'likes', label: 'likes' },
} as const

type TipoMetrica = keyof typeof METRICAS

function tipoValido(tipo: string | null): tipo is TipoMetrica {
  return tipo === 'views' || tipo === 'cliques' || tipo === 'likes'
}

function criarClienteMetricasAdmin() {
  try {
    return criarSupabaseAdmin()
  } catch (error) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) throw error
    console.warn('SUPABASE_SERVICE_ROLE_KEY ausente; /api/admin/cms/metricas usando anon key como fallback.')
    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
}

async function carregarRanking(tipo: TipoMetrica, limit: number, offset = 0) {
  const supabase = criarClienteMetricasAdmin()
  const { campo } = METRICAS[tipo]

  const { data, count, error } = await supabase
    .from('produtos')
    .select('id,titulo,clube,imagem_url,views,likes,cliques_anuncio,fonte_nome,link_original', { count: 'exact' })
    .eq('ativo', true)
    .gt(campo, 0)
    .order(campo, { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return { produtos: data || [], total: count || 0 }
}

export async function GET(req: Request) {
  const cookieStore = await cookies()
  if (!validarSessaoAdmin(cookieStore.get('admin_session')?.value)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo')
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 5), 1), 100)
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0)

    if (tipoValido(tipo)) {
      return Response.json(await carregarRanking(tipo, limit, offset))
    }

    const [views, cliques, likes] = await Promise.all([
      carregarRanking('views', 5),
      carregarRanking('cliques', 5),
      carregarRanking('likes', 5),
    ])

    return Response.json({ views, cliques, likes })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado' }, { status: 500 })
  }
}
