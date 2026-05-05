import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'

export async function GET() {
  const cookieStore = await cookies()
  const ok = validarSessaoAdmin(cookieStore.get('admin_session')?.value)
  return Response.json({ ok }, { status: ok ? 200 : 401 })
}
