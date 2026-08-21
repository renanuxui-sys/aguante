import crypto from 'node:crypto'

const MAX_AGE_MS = 1000 * 60 * 60 * 8
const SEPARADOR_SESSAO = '.'

type CredencialAdmin = {
  usuario: string
  senha: string
}

function segredoAdmin() {
  const segredo = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (!segredo) throw new Error('Configure ADMIN_SESSION_SECRET ou ADMIN_PASSWORD.')
  return segredo
}

function assinar(valor: string) {
  return crypto.createHmac('sha256', segredoAdmin()).update(valor).digest('hex')
}

function normalizarCredencial(credencial: unknown): CredencialAdmin | null {
  if (!credencial || typeof credencial !== 'object') return null

  const dados = credencial as Record<string, unknown>
  const usuario = dados.usuario || dados.username || dados.user
  const senha = dados.senha || dados.password

  if (typeof usuario !== 'string' || typeof senha !== 'string') return null
  if (!usuario || !senha) return null

  return { usuario, senha }
}

function credenciaisPorJson(valor: string): CredencialAdmin[] | null {
  try {
    const parsed = JSON.parse(valor) as unknown

    if (Array.isArray(parsed)) {
      return parsed.map(normalizarCredencial).filter(Boolean) as CredencialAdmin[]
    }

    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as Record<string, unknown>)
        .filter((entrada): entrada is [string, string] => typeof entrada[1] === 'string')
        .map(([usuario, senha]) => ({ usuario, senha }))
        .filter(credencial => credencial.usuario && credencial.senha)
    }
  } catch {
    return null
  }

  return null
}

function credenciaisPorLista(valor: string): CredencialAdmin[] {
  return valor
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const separador = item.includes(':') ? item.indexOf(':') : item.indexOf('=')
      if (separador <= 0) return null

      const usuario = item.slice(0, separador).trim()
      const senha = item.slice(separador + 1).trim()
      if (!usuario || !senha) return null

      return { usuario, senha }
    })
    .filter(Boolean) as CredencialAdmin[]
}

export function listarCredenciaisAdmin() {
  const credenciais: CredencialAdmin[] = []
  const adminUsers = process.env.ADMIN_USERS?.trim()

  if (adminUsers) {
    credenciais.push(...(credenciaisPorJson(adminUsers) || credenciaisPorLista(adminUsers)))
  }

  const usuarioLegado = process.env.ADMIN_USERNAME || 'admin'
  const senhaLegada = process.env.ADMIN_PASSWORD

  if (senhaLegada && !credenciais.some(credencial => credencial.usuario === usuarioLegado)) {
    credenciais.push({ usuario: usuarioLegado, senha: senhaLegada })
  }

  return credenciais
}

export function compararValorSeguro(valor: string, esperado: string) {
  const bufferValor = Buffer.from(valor)
  const bufferEsperado = Buffer.from(esperado)

  if (bufferValor.length !== bufferEsperado.length) return false
  return crypto.timingSafeEqual(bufferValor, bufferEsperado)
}

export function validarCredenciaisAdmin(usuario: unknown, senha: unknown) {
  if (typeof usuario !== 'string' || typeof senha !== 'string') return null

  const credencial = listarCredenciaisAdmin().find(item => compararValorSeguro(usuario, item.usuario))
  if (!credencial || !compararValorSeguro(senha, credencial.senha)) return null

  return { usuario: credencial.usuario }
}

export function criarSessaoAdmin(usuario: string) {
  const timestamp = String(Date.now())
  const usuarioCodificado = encodeURIComponent(usuario)
  const payload = `${timestamp}${SEPARADOR_SESSAO}${usuarioCodificado}`
  return `${payload}${SEPARADOR_SESSAO}${assinar(payload)}`
}

export function dadosSessaoAdmin(sessao?: string) {
  if (!sessao) return null
  const partes = sessao.split(SEPARADOR_SESSAO)
  if (partes.length !== 2 && partes.length !== 3) return null

  const [timestamp, usuarioCodificado, assinatura] = partes.length === 3
    ? partes
    : [partes[0], 'admin', partes[1]]

  if (!timestamp || !assinatura) return null

  const criadoEm = Number(timestamp)
  if (!Number.isFinite(criadoEm) || Date.now() - criadoEm > MAX_AGE_MS) return null

  const payload = partes.length === 3 ? `${timestamp}${SEPARADOR_SESSAO}${usuarioCodificado}` : timestamp
  const esperada = assinar(payload)
  const bufferAssinatura = Buffer.from(assinatura)
  const bufferEsperada = Buffer.from(esperada)

  if (bufferAssinatura.length !== bufferEsperada.length) return null
  if (!crypto.timingSafeEqual(bufferAssinatura, bufferEsperada)) return null

  try {
    return {
      usuario: decodeURIComponent(usuarioCodificado),
      criadoEm,
    }
  } catch {
    return null
  }
}

export function validarSessaoAdmin(sessao?: string) {
  return Boolean(dadosSessaoAdmin(sessao))
}
