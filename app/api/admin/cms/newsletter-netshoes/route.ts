import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const POR_PAGINA = 50

function respostaNaoAutorizado() {
  return Response.json({ error: 'Não autorizado' }, { status: 401 })
}

async function validarAdmin() {
  const cookieStore = await cookies()
  return validarSessaoAdmin(cookieStore.get('admin_session')?.value)
}

export async function GET(request: Request) {
  if (!await validarAdmin()) return respostaNaoAutorizado()

  try {
    const supabase = criarSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const pagina = Math.max(0, Number(searchParams.get('pagina') || '0') || 0)
    const busca = (searchParams.get('busca') || '').trim()
    const status = (searchParams.get('status') || 'todos').trim()

    let query = supabase
      .from('newsletter_netshoes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1)

    if (busca) query = query.or(`email.ilike.%${busca}%,origem.ilike.%${busca}%`)
    if (status === 'ativos') query = query.eq('ativo', true)
    if (status === 'inativos') query = query.eq('ativo', false)

    const { data, count, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ data: data || [], total: count || 0 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!await validarAdmin()) return respostaNaoAutorizado()

  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>
    const id = String(body.id || '').trim()
    const ativo = body.ativo

    if (!id || typeof ativo !== 'boolean') {
      return Response.json({ error: 'Informe id e status válido.' }, { status: 400 })
    }

    const { error } = await criarSupabaseAdmin()
      .from('newsletter_netshoes')
      .update({ ativo, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado' }, { status: 500 })
  }
}
