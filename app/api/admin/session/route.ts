import { cookies } from 'next/headers'
import { dadosSessaoAdmin } from '@/lib/admin-auth'

export async function GET() {
  const cookieStore = await cookies()
  const sessao = dadosSessaoAdmin(cookieStore.get('admin_session')?.value)
  return Response.json({ ok: Boolean(sessao), usuario: sessao?.usuario || null }, { status: sessao ? 200 : 401 })
}
