import { cookies } from 'next/headers'
import { validarSessaoAdmin } from '@/lib/admin-auth'
import { criarSupabaseAdmin } from '@/lib/supabase-admin'

const PAGE = 1000
const MAX_ROWS = 20000

type ProdutoMercado = {
  id: string
  titulo: string
  ano: string | null
  preco: number | null
  fonte_nome: string | null
  clube: string | null
  created_at: string
  inactivated_at: string | null
  last_seen_at: string | null
  views: number | null
  likes: number | null
  cliques_anuncio: number | null
}

type ClubeInfo = {
  nome: string
  categoria: string | null
}

type RankingItem = {
  chave: string
  label: string
  total: number
  precoMedio: number
  diasMedio: number
  diasMediano: number
  ticketEstimado: number
  cliques: number
  likes: number
}

function inicioMesAtual() {
  const hoje = new Date()
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
}

function fimHoje() {
  const fim = new Date()
  fim.setHours(23, 59, 59, 999)
  return fim.toISOString()
}

function normalizarInicio(valor: string | null) {
  if (!valor) return inicioMesAtual()
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return inicioMesAtual()
  data.setHours(0, 0, 0, 0)
  return data.toISOString()
}

function normalizarFim(valor: string | null) {
  if (!valor) return fimHoje()
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return fimHoje()
  data.setHours(23, 59, 59, 999)
  return data.toISOString()
}

function numero(valor: unknown) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function diasEntre(inicio: string, fim: string | null) {
  if (!fim) return 0
  const diff = new Date(fim).getTime() - new Date(inicio).getTime()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function arredondar(valor: number, casas = 1) {
  if (!Number.isFinite(valor)) return 0
  const fator = 10 ** casas
  return Math.round(valor * fator) / fator
}

function media(valores: number[]) {
  if (!valores.length) return 0
  return valores.reduce((total, valor) => total + valor, 0) / valores.length
}

function mediana(valores: number[]) {
  if (!valores.length) return 0
  const ordenados = [...valores].sort((a, b) => a - b)
  const meio = Math.floor(ordenados.length / 2)
  return ordenados.length % 2 === 0
    ? (ordenados[meio - 1] + ordenados[meio]) / 2
    : ordenados[meio]
}

function mesChave(data: string) {
  return data.slice(0, 7)
}

function rotuloMes(chave: string) {
  const [ano, mes] = chave.split('-')
  return `${mes}/${ano.slice(2)}`
}

function criarRanking(produtos: ProdutoMercado[], chaveFn: (produto: ProdutoMercado) => string | null, labelFn = chaveFn) {
  const grupos = new Map<string, ProdutoMercado[]>()

  produtos.forEach(produto => {
    const chave = chaveFn(produto)
    if (!chave) return
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave)?.push(produto)
  })

  return [...grupos.entries()]
    .map(([chave, itens]) => rankingItem(chave, labelFn(itens[0]) || chave, itens))
    .sort((a, b) => b.total - a.total || a.diasMediano - b.diasMediano)
}

function rankingItem(chave: string, label: string, produtos: ProdutoMercado[]): RankingItem {
  const precos = produtos.map(p => numero(p.preco)).filter(Boolean)
  const dias = produtos.map(p => diasEntre(p.created_at, p.inactivated_at)).filter(dia => dia >= 0)

  return {
    chave,
    label,
    total: produtos.length,
    precoMedio: arredondar(media(precos), 2),
    diasMedio: arredondar(media(dias), 1),
    diasMediano: arredondar(mediana(dias), 1),
    ticketEstimado: arredondar(precos.reduce((total, preco) => total + preco, 0), 2),
    cliques: produtos.reduce((total, p) => total + numero(p.cliques_anuncio), 0),
    likes: produtos.reduce((total, p) => total + numero(p.likes), 0),
  }
}

function filtrarPorCategoria(produtos: ProdutoMercado[], categoria: string, categoriasPorClube: Map<string, string>) {
  if (!categoria) return produtos
  return produtos.filter(produto => produto.clube && categoriasPorClube.get(produto.clube) === categoria)
}

async function carregarProdutos(supabase: ReturnType<typeof criarSupabaseAdmin>, tipo: 'inativos' | 'ativos', params: URLSearchParams) {
  const inicio = normalizarInicio(params.get('inicio'))
  const fim = normalizarFim(params.get('fim'))
  const loja = params.get('loja') || ''
  const clube = params.get('clube') || ''
  const ano = params.get('ano') || ''
  const precoMin = params.get('precoMin')
  const precoMax = params.get('precoMax')
  const rows: ProdutoMercado[] = []
  let offset = 0

  while (rows.length < MAX_ROWS) {
    let query = supabase
      .from('produtos')
      .select('id,titulo,ano,preco,fonte_nome,clube,created_at,inactivated_at,last_seen_at,views,likes,cliques_anuncio')
      .order(tipo === 'inativos' ? 'inactivated_at' : 'created_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + PAGE - 1)

    if (tipo === 'inativos') {
      query = query.not('inactivated_at', 'is', null).gte('inactivated_at', inicio).lte('inactivated_at', fim)
    } else {
      query = query.eq('ativo', true)
    }

    if (loja) query = query.eq('fonte_nome', loja)
    if (clube) query = query.eq('clube', clube)
    if (ano) query = query.eq('ano', ano)
    if (precoMin) query = query.gte('preco', Number(precoMin))
    if (precoMax) query = query.lte('preco', Number(precoMax))

    const { data, error } = await query
    if (error) throw error
    if (!data?.length) break
    rows.push(...data as ProdutoMercado[])
    if (data.length < PAGE) break
    offset += PAGE
  }

  return rows
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  if (!validarSessaoAdmin(cookieStore.get('admin_session')?.value)) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const supabase = criarSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria') || ''
    const inicio = normalizarInicio(searchParams.get('inicio'))
    const fim = normalizarFim(searchParams.get('fim'))

    const [
      { data: clubesData, error: clubesError },
      vendasBrutas,
      ativosBrutos,
      { data: alertasData },
      { data: preferenciasData },
    ] = await Promise.all([
      supabase.from('clubes').select('nome,categoria').eq('ativo', true).order('nome', { ascending: true }),
      carregarProdutos(supabase, 'inativos', searchParams),
      carregarProdutos(supabase, 'ativos', searchParams),
      supabase.from('alertas').select('clube,created_at').gte('created_at', inicio).lte('created_at', fim),
      supabase.from('clubes_preferencias').select('clube,acao,created_at').gte('created_at', inicio).lte('created_at', fim),
    ])

    if (clubesError) throw clubesError

    const categoriasPorClube = new Map<string, string>()
    ;((clubesData || []) as ClubeInfo[]).forEach(clube => {
      if (clube.nome) categoriasPorClube.set(clube.nome, clube.categoria || 'Outros')
    })

    const vendas = filtrarPorCategoria(vendasBrutas, categoria, categoriasPorClube)
    const ativos = filtrarPorCategoria(ativosBrutos, categoria, categoriasPorClube)
    const precos = vendas.map(p => numero(p.preco)).filter(Boolean)
    const dias = vendas.map(p => diasEntre(p.created_at, p.inactivated_at))
    const lojas = criarRanking(vendas, p => p.fonte_nome || 'Sem loja')
    const clubes = criarRanking(vendas, p => p.clube || null)
    const clubeAnos = criarRanking(vendas, p => p.clube && p.ano ? `${p.clube} · ${p.ano}` : null)
    const rapidos = criarRanking(vendas, p => p.clube || null)
      .filter(item => item.total >= 2)
      .sort((a, b) => a.diasMediano - b.diasMediano || b.total - a.total)

    const porMes = criarRanking(vendas, p => p.inactivated_at ? mesChave(p.inactivated_at) : null, p => p.inactivated_at ? rotuloMes(mesChave(p.inactivated_at)) : '')
      .sort((a, b) => a.chave.localeCompare(b.chave))

    const estoquePorClube = criarRanking(ativos, p => p.clube || null)
    const estoqueMapa = new Map(estoquePorClube.map(item => [item.chave, item.total]))
    const alertasPorClube = new Map<string, number>()
    const preferenciasPorClube = new Map<string, number>()

    ;(alertasData || []).forEach(item => {
      const clube = item.clube
      if (clube) alertasPorClube.set(clube, (alertasPorClube.get(clube) || 0) + 1)
    })

    ;(preferenciasData || []).forEach(item => {
      const clube = item.clube
      if (clube && item.acao === 'escolheu') preferenciasPorClube.set(clube, (preferenciasPorClube.get(clube) || 0) + 1)
    })

    const demanda = clubes.map(item => {
      const estoqueAtivo = estoqueMapa.get(item.chave) || 0
      const alertas = alertasPorClube.get(item.chave) || 0
      const preferencias = preferenciasPorClube.get(item.chave) || 0
      const score = (item.total * 4) + Math.round(item.cliques / 8) + item.likes + (alertas * 3) + (preferencias * 2)
      return { ...item, estoqueAtivo, alertas, preferencias, score }
    }).sort((a, b) => b.score - a.score)

    const oportunidades = demanda
      .filter(item => item.score > 0)
      .sort((a, b) => (b.score / Math.max(1, b.estoqueAtivo)) - (a.score / Math.max(1, a.estoqueAtivo)))
      .slice(0, 10)

    const limiteEncalhe = new Date()
    limiteEncalhe.setDate(limiteEncalhe.getDate() - 60)
    const encalhados = ativos
      .map(produto => ({ ...produto, diasAtivo: diasEntre(produto.created_at, new Date().toISOString()) }))
      .filter(produto => new Date(produto.created_at) <= limiteEncalhe)
      .sort((a, b) => b.diasAtivo - a.diasAtivo)
      .slice(0, 12)

    const liquidez = clubes.slice(0, 20).map(item => ({
      ...item,
      velocidade: item.diasMediano ? arredondar(1 / item.diasMediano, 4) : 0,
    }))

    return Response.json({
      filtros: {
        inicio,
        fim,
        lojas: [...new Set([...vendasBrutas, ...ativosBrutos].map(p => p.fonte_nome).filter(Boolean))].sort(),
        clubes: [...new Set([...vendasBrutas, ...ativosBrutos].map(p => p.clube).filter(Boolean))].sort(),
        anos: [...new Set([...vendasBrutas, ...ativosBrutos].map(p => p.ano).filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a))),
        categorias: [...new Set([...categoriasPorClube.values()])].sort(),
      },
      resumo: {
        vendasEstimadas: vendas.length,
        precoMedio: arredondar(media(precos), 2),
        ticketEstimado: arredondar(precos.reduce((total, preco) => total + preco, 0), 2),
        diasMedio: arredondar(media(dias), 1),
        diasMediano: arredondar(mediana(dias), 1),
        estoqueAtivo: ativos.length,
        encalhados: encalhados.length,
        clubeMaisLiquido: rapidos[0]?.label || null,
        lojaMaisVendas: lojas[0]?.label || null,
      },
      rankings: {
        lojas: lojas.slice(0, 15),
        clubes: clubes.slice(0, 15),
        clubeAnos: clubeAnos.slice(0, 15),
        rapidos: rapidos.slice(0, 15),
        precoPorLoja: [...lojas].sort((a, b) => b.precoMedio - a.precoMedio).slice(0, 15),
        precoPorClube: [...clubes].sort((a, b) => b.precoMedio - a.precoMedio).slice(0, 15),
        demanda: demanda.slice(0, 15),
        oportunidades,
      },
      graficos: {
        porMes,
        liquidez,
      },
      encalhados,
      aviso: 'Vendas são estimadas a partir de produtos que ficaram inativos nas lojas de origem.',
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Erro inesperado' }, { status: 500 })
  }
}
