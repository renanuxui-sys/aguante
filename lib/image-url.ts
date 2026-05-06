export function imagemComProxy(url: string | null | undefined) {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'img.olx.com.br') {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }
  } catch {
    return url
  }

  return url
}
