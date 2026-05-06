const HOSTS_PERMITIDOS = new Set(['img.olx.com.br'])

export async function GET(request: Request) {
  const url = new URL(request.url)
  const imagemUrl = url.searchParams.get('url')

  if (!imagemUrl) {
    return new Response('Missing url', { status: 400 })
  }

  let destino: URL
  try {
    destino = new URL(imagemUrl)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (destino.protocol !== 'https:' || !HOSTS_PERMITIDOS.has(destino.hostname)) {
    return new Response('Host not allowed', { status: 400 })
  }

  let upstream: Response
  try {
    upstream = await fetch(destino.toString(), {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: 'https://www.olx.com.br/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })
  } catch (error) {
    return new Response(`Image fetch failed: ${error instanceof Error ? error.message : String(error)}`, { status: 502 })
  }

  if (!upstream.ok) {
    return new Response(`Image fetch failed with status ${upstream.status}`, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') || 'image/jpeg'
  const body = await upstream.arrayBuffer()

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
