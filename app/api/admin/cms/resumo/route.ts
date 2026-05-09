import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const cookieStore = await cookies()
  if (!validarSessaoAdmin(cookieStore.get('admin_session')?.value)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = criarSupabaseAdmin()
    const [{ count: cadastros }, { count: alertas }, { count: escolhas }] = await Promise.all([
      supabase.from('cadastros_cta').select('id', { count: 'exact', head: true }),
      supabase.from('alertas').select('id', { count: 'exact', head: true }),
      supabase.from('clubes_preferencias').select('id', { count: 'exact', head: true }).eq('acao', 'escolheu'),
    ])

    return Response.json({
      cadastros: cadastros || 0,
      alertas: alertas || 0,
      escolhas: escolhas || 0,
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado' }, { status: 500 })
  }
}
