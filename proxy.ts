import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const primaryHost = 'aguante.com.br'
const vercelHost = 'aguante.vercel.app'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')

  if (host === vercelHost) {
    const url = request.nextUrl.clone()
    url.hostname = primaryHost
    url.protocol = 'https'
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|assets/).*)',
}
