/**
 * Scraper — Mercado Livre
 * Busca camisas usadas de clubes brasileiros via API oficial
 * Roda com: node scraper-mercadolivre.js
 */

import fetch from 'node-fetch'
import { criarSupabase, desativarProdutosDaFonte, salvarProdutos, relatorioFinal, extrairAno, carregarClubesBusca, sleep } from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME = 'Mercado Livre'
const FONTE_URL  = 'https://www.mercadolivre.com.br'
const DELAY_MS   = 1000
const RESULTADOS_POR_PAGINA = 50
const MAX_PAGINAS_PADRAO = 20 // até 1000 resultados por clube

const supabase = criarSupabase()

const CLUBES = [
  { clube: 'Flamengo',      query: 'camisa flamengo', aliases: ['fla'] },
  { clube: 'Corinthians',   query: 'camisa corinthians', aliases: ['timao', 'timão'] },
  { clube: 'Palmeiras',     query: 'camisa palmeiras', aliases: ['pal'] },
  { clube: 'São Paulo',     query: 'camisa são paulo futebol', aliases: ['sao paulo', 'spfc'] },
  { clube: 'Grêmio',        query: 'camisa grêmio', aliases: ['gremio'] },
  { clube: 'Internacional', query: 'camisa internacional futebol', aliases: ['inter'] },
  { clube: 'Santos',        query: 'camisa santos futebol', aliases: ['santos fc'] },
  { clube: 'Atlético-MG',   query: 'camisa atlético mineiro', aliases: ['atletico-mg', 'atletico mg', 'atlético mineiro', 'atletico mineiro', 'galo'] },
  { clube: 'Botafogo',      query: 'camisa botafogo', aliases: ['bota'] },
  { clube: 'Fluminense',    query: 'camisa fluminense', aliases: ['flu'] },
  { clube: 'Vasco',         query: 'camisa vasco', aliases: ['vasco da gama'] },
  { clube: 'Cruzeiro',      query: 'camisa cruzeiro', aliases: ['cruzeiro ec'] },
  { clube: 'Athletico-PR',  query: 'camisa athletico paranaense', aliases: ['athletico pr', 'atletico-pr', 'atletico pr', 'paranaense', 'furacao', 'furacão'] },
  { clube: 'Fortaleza',     query: 'camisa fortaleza futebol', aliases: ['fortaleza ec'] },
  { clube: 'Bahia',         query: 'camisa bahia futebol', aliases: ['ec bahia'] },
  { clube: 'Vitória',       query: 'camisa vitória futebol', aliases: ['vitoria', 'ec vitoria', 'ec vitória'] },
]

function normalizarTexto(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function parseArgs() {
  const args = process.argv.slice(2)
  const clubesArg = args.find(arg => arg.startsWith('--clubes='))
  const maxPaginasArg = args.find(arg => arg.startsWith('--max-paginas='))
  const dryRun = args.includes('--dry-run')
  const semDesativar = args.includes('--sem-desativar')

  const clubesSelecionados = clubesArg
    ? clubesArg
      .replace('--clubes=', '')
      .split(',')
      .map(normalizarTexto)
      .filter(Boolean)
    : []

  const maxPaginas = maxPaginasArg
    ? Math.max(1, Number(maxPaginasArg.replace('--max-paginas=', '')) || MAX_PAGINAS_PADRAO)
    : MAX_PAGINAS_PADRAO

  return { clubesSelecionados, maxPaginas, dryRun, semDesativar }
}

async function carregarClubesDisponiveis() {
  const dinamicos = await carregarClubesBusca(supabase)

  return dinamicos.map(clubeDinamico => {
    const padrao = CLUBES.find(item => normalizarTexto(item.clube) === normalizarTexto(clubeDinamico.clube))
    const aliases = Array.from(new Set([...(padrao?.aliases || []), ...(clubeDinamico.aliases || [])]))

    return {
      clube: clubeDinamico.clube,
      query: padrao?.query || clubeDinamico.query,
      aliases,
    }
  })
}

function filtrarClubes(clubesSelecionados, clubesDisponiveis) {
  if (clubesSelecionados.length === 0) return clubesDisponiveis

  return clubesDisponiveis.filter(({ clube, aliases = [] }) => {
    const nomes = [clube, ...aliases].map(normalizarTexto)
    return clubesSelecionados.some(clubeSelecionado => nomes.includes(clubeSelecionado))
  })
}

// ── Buscar token de acesso ───────────────────────────────
async function getAccessToken() {
  if (process.env.ML_ACCESS_TOKEN) {
    console.log('🔑 Usando ML_ACCESS_TOKEN do .env\n')
    return process.env.ML_ACCESS_TOKEN
  }

  if (process.env.ML_REFRESH_TOKEN) {
    if (!process.env.ML_CLIENT_ID || !process.env.ML_CLIENT_SECRET) {
      throw new Error('Configure ML_CLIENT_ID e ML_CLIENT_SECRET no .env para renovar o ML_REFRESH_TOKEN.')
    }

    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        refresh_token: process.env.ML_REFRESH_TOKEN,
      })
    })
    const data = await res.json()
    if (!data.access_token) throw new Error('Falha ao renovar token: ' + JSON.stringify(data))
    console.log('🔑 Token renovado com ML_REFRESH_TOKEN\n')
    if (data.refresh_token && data.refresh_token !== process.env.ML_REFRESH_TOKEN) {
      console.log('⚠️  O Mercado Livre retornou um novo refresh_token. Atualize o ML_REFRESH_TOKEN no .env.')
    }
    return data.access_token
  }

  if (!process.env.ML_CLIENT_ID || !process.env.ML_CLIENT_SECRET) {
    throw new Error('Configure ML_ACCESS_TOKEN, ML_REFRESH_TOKEN ou ML_CLIENT_ID e ML_CLIENT_SECRET no .env para usar a API do Mercado Livre.')
  }

  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
    })
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Falha ao obter token: ' + JSON.stringify(data))
  console.log('🔑 Token obtido com sucesso\n')
  return data.access_token
}

// ── Buscar uma página de resultados ─────────────────────
async function buscarPagina(token, query, offset) {
  const params = new URLSearchParams({
    q: query,
    condition: 'used',
    category: 'MLB1276', // Camisetas de Futebol
    offset: offset.toString(),
    limit: RESULTADOS_POR_PAGINA.toString(),
  })

  const res = await fetch(`https://api.mercadolibre.com/sites/MLB/search?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'AguanteBot/1.0',
      Accept: 'application/json',
    }
  })

  if (!res.ok) {
    const body = await res.text()
    console.warn(`  ⚠️  Status ${res.status} para offset ${offset}: ${body}`)
    return { results: [], total: 0 }
  }

  const data = await res.json()
  return {
    results: data.results || [],
    total: data.paging?.total || 0,
  }
}

// ── Converter item ML para formato do banco ──────────────
function converterItem(item, clube) {
  const titulo = item.title || ''
  const preco  = item.price || null
  const imagem = item.thumbnail
    ? item.thumbnail.replace('/I/', '/D/').replace('-I.', '-D.') // imagem maior
    : null
  const link   = item.permalink || ''

  return {
    titulo,
    link_original: link,
    imagem_url: imagem,
    preco,
    clube,
    ano: extrairAno(titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: [],
    de_jogo: titulo.toLowerCase().includes('jogo') || titulo.toLowerCase().includes('match worn'),
    novidade: false,
    alta_procura: (item.sold_quantity || 0) > 5,
    ativo: true,
  }
}

// ── Raspar um clube completo ─────────────────────────────
async function rasparClube(token, { clube, query }, { maxPaginas, dryRun }) {
  console.log(`\n⚽ ${clube} — query: "${query}"`)

  // Primeira busca para saber o total
  const primeira = await buscarPagina(token, query, 0)
  const total = Math.min(primeira.total, maxPaginas * RESULTADOS_POR_PAGINA)
  const paginas = Math.ceil(total / RESULTADOS_POR_PAGINA)

  console.log(`   Total disponível: ${primeira.total} | Vamos buscar: ${total} (${paginas} páginas)`)

  let totalClube = 0

  // Salva primeira página
  if (primeira.results.length > 0) {
    const produtos = primeira.results
      .filter(item => item.condition === 'used')
      .map(item => converterItem(item, clube))
    const salvos = dryRun ? produtos.length : await salvarProdutos(supabase, produtos)
    totalClube += salvos
    console.log(`  ✅ Página 1/${paginas} — ${salvos} ${dryRun ? 'encontrados' : 'salvos'}`)

    if (dryRun) {
      produtos.slice(0, 3).forEach((produto, index) => {
        console.log(`     ${index + 1}. ${produto.titulo} — R$ ${produto.preco ?? 's/preço'}`)
      })
    }
  }

  // Demais páginas
  for (let pagina = 2; pagina <= paginas; pagina++) {
    await sleep(DELAY_MS)
    const offset = (pagina - 1) * RESULTADOS_POR_PAGINA
    const { results } = await buscarPagina(token, query, offset)

    if (results.length === 0) break

    const produtos = results
      .filter(item => item.condition === 'used')
      .map(item => converterItem(item, clube))
    const salvos = dryRun ? produtos.length : await salvarProdutos(supabase, produtos)
    totalClube += salvos
    console.log(`  ✅ Página ${pagina}/${paginas} — ${salvos} ${dryRun ? 'encontrados' : 'salvos'} (total ${clube}: ${totalClube})`)
  }

  return totalClube
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  console.log('🚀 Scraper — Mercado Livre\n')

  const options = parseArgs()
  const clubesDisponiveis = await carregarClubesDisponiveis()
  const clubesParaRaspar = filtrarClubes(options.clubesSelecionados, clubesDisponiveis)

  if (clubesParaRaspar.length === 0) {
    throw new Error('Nenhum clube encontrado para o filtro informado.')
  }

  console.log(`Clubes: ${clubesParaRaspar.map(({ clube }) => clube).join(', ')}`)
  console.log(`Páginas por clube: ${options.maxPaginas}`)
  if (options.dryRun) console.log('Modo teste: não vai salvar no banco.')

  const token = await getAccessToken()

  const deveDesativar = !options.dryRun && !options.semDesativar && options.clubesSelecionados.length === 0
  if (deveDesativar) {
    await desativarProdutosDaFonte(supabase, FONTE_NOME)
  } else if (!options.dryRun) {
    console.log('Sem desativação inicial: execução filtrada ou flag --sem-desativar.')
  }

  let totalGeral = 0

  for (const fonte of clubesParaRaspar) {
    const total = await rasparClube(token, fonte, options)
    totalGeral += total
    console.log(`  ✅ ${fonte.clube} concluído: ${total} produtos`)
    await sleep(DELAY_MS * 2)
  }

  if (!options.dryRun) {
    await relatorioFinal(supabase, FONTE_NOME, totalGeral)
  }

  console.log(`\n🏁 Concluído! Total geral: ${totalGeral} produtos ${options.dryRun ? 'encontrados' : 'ativos'}.`)
}

main().catch(console.error)
