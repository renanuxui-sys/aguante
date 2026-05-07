import crypto from 'node:crypto'

const MAX_AGE_MS = 1000 * 60 * 60 * 8

function segredoAdmin() {
  const segredo = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (!segredo) throw new Error('Configure ADMIN_PASSWORD ou ADMIN_SESSION_SECRET.')
  return segredo
}

function assinar(valor: string) {
  return crypto.createHmac('sha256', segredoAdmin()).update(valor).digest('hex')
}

export function compararValorSeguro(valor: string, esperado: string) {
  const bufferValor = Buffer.from(valor)
  const bufferEsperado = Buffer.from(esperado)

  if (bufferValor.length !== bufferEsperado.length) return false
  return crypto.timingSafeEqual(bufferValor, bufferEsperado)
}

export function criarSessaoAdmin() {
  const timestamp = String(Date.now())
  return `${timestamp}.${assinar(timestamp)}`
}

export function validarSessaoAdmin(sessao?: string) {
  if (!sessao) return false
  const [timestamp, assinatura] = sessao.split('.')
  if (!timestamp || !assinatura) return false

  const criadoEm = Number(timestamp)
  if (!Number.isFinite(criadoEm) || Date.now() - criadoEm > MAX_AGE_MS) return false

  const esperada = assinar(timestamp)
  const bufferAssinatura = Buffer.from(assinatura)
  const bufferEsperada = Buffer.from(esperada)

  if (bufferAssinatura.length !== bufferEsperada.length) return false
  return crypto.timingSafeEqual(bufferAssinatura, bufferEsperada)
}
