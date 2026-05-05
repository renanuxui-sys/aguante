import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const POR_PAGINA = 50

export async function GET(request: Request) {
  const cookieStore = await cookies()
  if (!validarSessaoAdmin(cookieStore.get('admin_session')?.value)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = criarSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const pagina = Math.max(0, Number(searchParams.get('pagina') || '0') || 0)
    const busca = (searchParams.get('busca') || '').trim()

    let query = supabase
      .from('cadastros_cta')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1)

    if (busca) query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`)

    const { data, count, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ data: data || [], total: count || 0 })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado' }, { status: 500 })
  }
}
