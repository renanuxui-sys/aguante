import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const PAGE = 1000

export async function GET() {
  const cookieStore = await cookies()
  if (!validarSessaoAdmin(cookieStore.get('admin_session')?.value)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = criarSupabaseAdmin()
    const todas = []
    let offset = 0

    while (true) {
      const { data, error } = await supabase
        .from('clubes_preferencias')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE - 1)

      if (error) return Response.json({ error: error.message }, { status: 500 })
      if (!data?.length) break
      todas.push(...data)
      if (data.length < PAGE) break
      offset += PAGE
    }

    const escolhas = todas.filter(item => item.acao === 'escolheu' && item.clube)
    const contagem: Record<string, number> = {}
    escolhas.forEach(item => {
      if (item.clube) contagem[item.clube] = (contagem[item.clube] || 0) + 1
    })

    const ranking = Object.entries(contagem)
      .map(([clube, total]) => ({ clube, total, pct: escolhas.length ? Math.round((total / escolhas.length) * 100) : 0 }))
      .sort((a, b) => b.total - a.total)

    return Response.json({
      ranking,
      recentes: todas.slice(0, 50),
      totalEscolhas: escolhas.length,
      totalSemEscolha: todas.filter(item => item.acao !== 'escolheu').length,
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado' }, { status: 500 })
  }
}
