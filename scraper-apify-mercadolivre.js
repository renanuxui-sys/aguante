/**
 * Scraper — Mercado Livre via Apify
 * Usa o actor karamelo/mercadolivre-scraper-brasil-portugues.
 *
 * Roda em modo teste por padrão:
 * node scraper-apify-mercadolivre.js --clubes=Flamengo --max-paginas=1
 *
 * Para salvar no Supabase:
 * node scraper-apify-mercadolivre.js --clubes=Flamengo --max-paginas=1 --salvar
 */

import fetch from 'node-fetch'
import { criarSupabase, salvarProdutos, extrairAno, carregarClubesBusca } from './scraper-utils.js'
import 'dotenv/config'

const FONTE_NOME = 'Mercado Livre'
const FONTE_URL = 'https://www.mercadolivre.com.br'
const ACTOR_ID = 'karamelo~mercadolivre-scraper-brasil-portugues'
const MAX_PAGINAS_PADRAO = 1

const supabase = criarSupabase()

const CLUBES = [
  { clube: 'Grêmio', query: 'camisa grêmio usada', termos: ['grêmio', 'gremio'] },
  { clube: 'Internacional', query: 'camisa internacional porto alegre usado', termos: ['internacional', 'sport club internacional', 's.c. internacional', 'sc internacional', 'inter porto alegre', 'colorado'] },
  { clube: 'São Paulo', query: 'camisa são paulo futebol usada', termos: ['são paulo', 'sao paulo', 'spfc'] },
  { clube: 'Corinthians', query: 'camisa corinthians usada', termos: ['corinthians'] },
  { clube: 'Santos', query: 'camisa santos futebol usada', termos: ['santos'] },
  { clube: 'Palmeiras', query: 'camisa palmeiras usada', termos: ['palmeiras'] },
  { clube: 'Atlético-MG', query: 'camisa atlético mineiro usada', termos: ['atlético mineiro', 'atletico mineiro', 'atlético-mg', 'atletico-mg', 'atletico mg', 'galo'] },
  { clube: 'Cruzeiro', query: 'camisa cruzeiro usada', termos: ['cruzeiro'] },
  { clube: 'Fluminense', query: 'camisa fluminense usada', termos: ['fluminense'] },
  { clube: 'Flamengo', query: 'camisa flamengo usada', termos: ['flamengo'] },
  { clube: 'Vasco', query: 'camisa vasco usada', termos: ['vasco', 'vasco da gama'] },
  { clube: 'Botafogo', query: 'camisa botafogo usada', termos: ['botafogo'] },
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
  const salvar = args.includes('--salvar')
  const limparInvalidos = args.includes('--limpar-invalidos')
  const filtrarUsados = args.includes('--filtrar-usados')

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

  return { clubesSelecionados, maxPaginas, salvar, limparInvalidos, filtrarUsados }
}

async function carregarClubesDisponiveis() {
  const dinamicos = await carregarClubesBusca(supabase, { usado: true })

  return dinamicos.map(clubeDinamico => {
    const padrao = CLUBES.find(item => normalizarTexto(item.clube) === normalizarTexto(clubeDinamico.clube))
    const termos = Array.from(new Set([...(padrao?.termos || []), ...(clubeDinamico.termos || [])]))

    return {
      clube: clubeDinamico.clube,
      query: padrao?.query || clubeDinamico.query,
      termos,
    }
  })
}

function filtrarClubes(clubesSelecionados, clubesDisponiveis) {
  if (clubesSelecionados.length === 0) return clubesDisponiveis

  return clubesDisponiveis.filter(({ clube, termos = [] }) => {
    const nomes = [clube, ...termos].map(normalizarTexto)
    return clubesSelecionados.some(clubeSelecionado => nomes.includes(clubeSelecionado))
  })
}

function parsePreco(valor) {
  if (typeof valor === 'number') return valor
  if (!valor) return null

  const normalizado = String(valor)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const preco = Number(normalizado)
  return Number.isFinite(preco) ? preco : null
}

function pareceUsado(item) {
  const campos = [
    item.condicao,
    item.condição,
    item.condition,
    item.estado,
    item.eTituloProduto,
    item.title,
  ].map(normalizarTexto)

  return campos.some(campo => /\busad[ao]s?\b/.test(campo))
}

function pareceCamisa(titulo) {
  const lower = normalizarTexto(titulo)
  if (!/\bcamisa\b/.test(lower)) return false
  if (/\b(agasalho|conjunto|calca|calção|short|bermuda|jaqueta|blusa|moletom)\b/.test(lower)) return false
  return true
}

function pertenceAoClube(item, termos) {
  const texto = [
    item.eTituloProduto,
    item.title,
    item.titulo,
    item.description,
    item.descricao,
  ].map(normalizarTexto).join(' ')

  return termos.some(termo => texto.includes(normalizarTexto(termo)))
}

function produtoValido(produto, termos, { exigirUsado = false } = {}) {
  const usadoOk = exigirUsado ? pareceUsado(produto) : true
  return usadoOk && pareceCamisa(produto.eTituloProduto || produto.title || produto.titulo) && pertenceAoClube(produto, termos)
}

async function rodarActor({ query, maxPaginas }) {
  if (!process.env.APIFY_TOKEN) {
    throw new Error('Configure APIFY_TOKEN no .env para usar o scraper da Apify.')
  }

  const input = {
    keyword: query,
    maxPages: maxPaginas,
    maxPagesOfertas: 1,
    scrapeOfertas: false,
    promoted: false,
  }

  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const body = await res.text()
  if (!res.ok) {
    throw new Error(`Apify retornou status ${res.status}: ${body}`)
  }

  return JSON.parse(body)
}

function converterItem(item, clube) {
  const titulo = item.eTituloProduto || item.title || item.titulo || ''
  const link = item.zProdutoLink || item.url || item.link || ''

  return {
    titulo,
    link_original: link,
    imagem_url: item.imagemLink || item.image || item.imagem || null,
    preco: parsePreco(item.novoPreco || item.price || item.preco),
    clube,
    ano: extrairAno(titulo),
    fonte_nome: FONTE_NOME,
    fonte_url: FONTE_URL,
    tags: ['apify'],
    de_jogo: normalizarTexto(titulo).includes('jogo'),
    novidade: false,
    alta_procura: false,
  }
}

async function rasparClube(fonte, options) {
  const { clube, query, termos } = fonte
  console.log(`\n⚽ ${clube} — query: "${query}"`)

  const items = await rodarActor({ query, maxPaginas: options.maxPaginas })
  const aprovados = items.filter(item => produtoValido(item, termos, { exigirUsado: options.filtrarUsados }))
  const convertidos = aprovados.map(item => converterItem(item, clube)).filter(item => item.titulo && item.link_original)

  console.log(`  Encontrados pela Apify: ${items.length}`)
  console.log(`  Aprovados no filtro local: ${convertidos.length}`)

  convertidos.slice(0, 5).forEach((produto, index) => {
    console.log(`     ${index + 1}. ${produto.titulo} — R$ ${produto.preco ?? 's/preço'}`)
  })

  if (!options.salvar) {
    console.log('  Modo teste: nada foi salvo no banco.')
    return convertidos.length
  }

  const salvos = await salvarProdutos(supabase, convertidos)
  console.log(`  ✅ ${salvos} salvos`)
  return salvos
}

async function limparInvalidos(clubes) {
  console.log('\n🧹 Limpando produtos inválidos do Mercado Livre via Apify')

  let total = 0
  for (const { clube, termos } of clubes) {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, titulo, clube')
      .eq('fonte_nome', FONTE_NOME)
      .eq('clube', clube)
      .contains('tags', ['apify'])
      .eq('ativo', true)

    if (error) {
      console.warn(`  ⚠️  ${clube}: erro ao buscar produtos: ${error.message}`)
      continue
    }

    const invalidos = (data || []).filter(produto => !produtoValido({ title: produto.titulo }, termos))
    if (invalidos.length === 0) {
      console.log(`  ✅ ${clube}: nenhum inválido ativo`)
      continue
    }

    const ids = invalidos.map(produto => produto.id)
    const { error: updateError } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .in('id', ids)

    if (updateError) {
      console.warn(`  ⚠️  ${clube}: erro ao desativar inválidos: ${updateError.message}`)
      continue
    }

    total += invalidos.length
    console.log(`  ⏸️  ${clube}: ${invalidos.length} inválidos desativados`)
    invalidos.slice(0, 5).forEach((produto, index) => {
      console.log(`     ${index + 1}. ${produto.titulo}`)
    })
  }

  console.log(`\n🧹 Limpeza concluída: ${total} produtos inválidos desativados.`)
}

async function main() {
  console.log('🚀 Scraper — Mercado Livre via Apify\n')

  const options = parseArgs()
  const clubesDisponiveis = await carregarClubesDisponiveis()
  const clubes = filtrarClubes(options.clubesSelecionados, clubesDisponiveis)

  if (clubes.length === 0) throw new Error('Nenhum clube encontrado para o filtro informado.')

  console.log(`Clubes: ${clubes.map(({ clube }) => clube).join(', ')}`)
  console.log(`Páginas por clube: ${options.maxPaginas}`)
  console.log(`Filtro local de usados: ${options.filtrarUsados ? 'ligado' : 'desligado'}`)
  console.log(options.salvar ? 'Modo salvar: vai gravar no Supabase.' : 'Modo teste: não vai salvar no Supabase.')

  if (options.limparInvalidos) {
    await limparInvalidos(clubes)
    return
  }

  let total = 0
  for (const clube of clubes) {
    total += await rasparClube(clube, options)
  }

  console.log(`\n🏁 Concluído! Total: ${total} produtos ${options.salvar ? 'salvos' : 'aprovados no teste'}.`)
}

main().catch(error => {
  console.error('❌ Erro:', error.message)
  process.exit(1)
})
