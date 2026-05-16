/**
 * scraper-utils.js — Utilitários compartilhados entre todos os scrapers
 * 
 * Ciclo de vida de um produto:
 * 1. Antes do scraping: marca todos os produtos da fonte como ativo = false
 * 2. Durante o scraping: upsert seta ativo = true nos produtos encontrados
 * 3. Após o scraping: produtos não encontrados ficam ativo = false (sumiram do site de origem)
 * 
 * Isso preserva id, views, likes e histórico — o produto some do site mas não é deletado.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

export function criarSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Desativa todos os produtos de uma fonte antes do scraping.
 * Produtos encontrados durante o scraping serão reativados via upsert.
 */
export async function desativarProdutosDaFonte(supabase, fonteNome) {
  const agora = new Date().toISOString()
  const { data, error } = await supabase
    .from('produtos')
    .update({
      ativo: false,
      inactivated_at: agora,
      updated_at: agora,
    })
    .eq('fonte_nome', fonteNome)
    .eq('ativo', true)
    .select('id')

  if (error) {
    console.error(`  ⚠️  Erro ao desativar produtos de "${fonteNome}":`, error.message)
    return 0
  }

  console.log(`  🔄 ${data?.length || 0} produtos de "${fonteNome}" marcados como inativos`)
  return data?.length || 0
}

/**
 * Upsert com reativação automática.
 * Sempre inclui ativo: true para reativar produtos que voltaram a aparecer.
 */
export async function salvarProdutos(supabase, produtos) {
  if (produtos.length === 0) return 0

  const agora = new Date().toISOString()
  const links = produtos.map(p => p.link_original).filter(Boolean)
  const reativados = await buscarLinksInativos(supabase, links)

  // Garante que todos os produtos encontrados ficam ativos e com presença registrada.
  const produtosAtivos = produtos.map(p => {
    const { tipo_camisa, ...produto } = p
    void tipo_camisa

    return {
      ...produto,
      ativo: true,
      de_jogo: ehCamisaDeJogo(p.titulo),
      last_seen_at: agora,
      inactivated_at: null,
      updated_at: agora,
      ...(reativados.has(p.link_original) ? { reactivated_at: agora } : {}),
    }
  })

  const { data, error } = await supabase
    .from('produtos')
    .upsert(produtosAtivos, { onConflict: 'link_original', ignoreDuplicates: false })
    .select('id,link_original,titulo,fonte_nome,clube,ano,preco')

  if (error) {
    console.error('  ❌ Erro ao salvar:', error.message)
    return 0
  }

  await registrarHistoricoPrecos(supabase, data || [])
  return data?.length || 0
}

async function buscarLinksInativos(supabase, links) {
  const unicos = [...new Set(links)]
  const inativos = new Set()
  const TAMANHO_LOTE = 250

  for (let i = 0; i < unicos.length; i += TAMANHO_LOTE) {
    const lote = unicos.slice(i, i + TAMANHO_LOTE)
    const { data, error } = await supabase
      .from('produtos')
      .select('link_original')
      .in('link_original', lote)
      .eq('ativo', false)

    if (error) {
      console.warn('  ⚠️  Não foi possível detectar reativações:', error.message)
      return inativos
    }

    ;(data || []).forEach(item => {
      if (item.link_original) inativos.add(item.link_original)
    })
  }

  return inativos
}

async function registrarHistoricoPrecos(supabase, produtos) {
  const comPreco = produtos.filter(produto => produto.preco !== null && produto.preco !== undefined)
  if (comPreco.length === 0) return

  const ids = comPreco.map(produto => produto.id).filter(Boolean)
  const ultimos = new Map()

  for (let i = 0; i < ids.length; i += 250) {
    const lote = ids.slice(i, i + 250)
    const { data, error } = await supabase
      .from('produto_precos_historico')
      .select('produto_id,preco,registrado_em')
      .in('produto_id', lote)
      .order('registrado_em', { ascending: false })

    if (error) {
      console.warn('  ⚠️  Não foi possível carregar histórico de preços:', error.message)
      return
    }

    ;(data || []).forEach(item => {
      if (!ultimos.has(item.produto_id)) ultimos.set(item.produto_id, Number(item.preco))
    })
  }

  const novos = comPreco
    .filter(produto => Number(produto.preco) > 0 && ultimos.get(produto.id) !== Number(produto.preco))
    .map(produto => ({
      produto_id: produto.id,
      link_original: produto.link_original,
      titulo: produto.titulo,
      fonte_nome: produto.fonte_nome,
      clube: produto.clube,
      ano: produto.ano,
      tipo_camisa: identificarTipoCamisa(produto.titulo),
      preco: produto.preco,
    }))

  if (novos.length === 0) return

  const { error } = await supabase
    .from('produto_precos_historico')
    .insert(novos)

  if (error) console.warn('  ⚠️  Não foi possível registrar histórico de preços:', error.message)
}

export function identificarTipoCamisa(titulo) {
  const texto = normalizarTexto(titulo || '')

  if (/\b(pre[-\s]?jogo|pre[-\s]?match)\b/.test(texto)) return 'pre_jogo'
  if (/\b(goleiro|goalkeeper|keeper|gk)\b/.test(texto)) return 'goleiro'
  if (/\b(away|fora|visitante)\b/.test(texto)) return 'away'
  if (/\b(home|casa|mandante)\b/.test(texto)) return 'home'
  if (/\b(third|terceira|3a|3ª)\b/.test(texto)) return 'third'
  if (/\b(treino|training|trainning)\b/.test(texto)) return 'treino'

  return null
}

export function ehCamisaDeJogo(titulo) {
  const texto = normalizarTexto(titulo || '')
  if (identificarTipoCamisa(texto) === 'pre_jogo') return false
  if (/\bpre[-\s]?jogo\b/.test(texto) || /\bpre[-\s]?match\b/.test(texto)) return false

  return /\b(de jogo|usada em jogo|match worn|matchworn|player issue|game worn|game issued)\b/.test(texto)
}

/**
 * Relatório final — mostra quantos foram reativados, desativados e novos.
 */
export async function relatorioFinal(supabase, fonteNome) {
  const { count: inativos } = await supabase
    .from('produtos')
    .select('*', { count: 'exact', head: true })
    .eq('fonte_nome', fonteNome)
    .eq('ativo', false)

  const { count: ativos } = await supabase
    .from('produtos')
    .select('*', { count: 'exact', head: true })
    .eq('fonte_nome', fonteNome)
    .eq('ativo', true)

  console.log(`\n📊 Relatório "${fonteNome}":`)
  console.log(`   ✅ Ativos (encontrados): ${ativos || 0}`)
  console.log(`   ⏸️  Inativos (não encontrados/vendidos): ${inativos || 0}`)

  await atualizarHomeMetricas(supabase)
}

async function contar(query) {
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count || 0
}

export async function atualizarHomeMetricas(supabase) {
  try {
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [totalProdutos, novos24h] = await Promise.all([
      contar(supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true)),
      contar(supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true).gte('created_at', ontem)),
    ])

    const { error } = await supabase
      .from('home_metricas')
      .upsert({
        id: 'principal',
        total_produtos: totalProdutos,
        novos_24h: novos24h,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (error) throw new Error(error.message)

    console.log(`   🔢 Métricas da home atualizadas: ${totalProdutos} camisas ativas, ${novos24h} novos anúncios em 24h`)
  } catch (error) {
    console.warn('   ⚠️  Não foi possível atualizar métricas da home:', error.message)
  }
}

export function extrairAno(titulo) {
  if (!titulo) return null
  const match = titulo.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
  return match ? match[1] : null
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const CLUBES_MAP = [
  { clube: 'Flamengo',      termos: ['flamengo'] },
  { clube: 'Corinthians',   termos: ['corinthians'] },
  { clube: 'Palmeiras',     termos: ['palmeiras'] },
  { clube: 'São Paulo',     termos: ['são paulo', 'sao paulo', 'spfc'] },
  { clube: 'Grêmio',        termos: ['grêmio', 'gremio'] },
  { clube: 'Internacional', termos: ['internacional'] },
  { clube: 'Santos',        termos: ['santos'] },
  { clube: 'Atlético-MG',   termos: ['atlético mineiro', 'atletico mineiro', 'atlético-mg', 'atletico mg', 'galo'] },
  { clube: 'Botafogo',      termos: ['botafogo'] },
  { clube: 'Fluminense',    termos: ['fluminense'] },
  { clube: 'Vasco',         termos: ['vasco'] },
  { clube: 'Cruzeiro',      termos: ['cruzeiro'] },
  { clube: 'Athletico-PR',  termos: ['athletico', 'atletico pr', 'paranaense', 'furacão'] },
  { clube: 'Fortaleza',     termos: ['fortaleza'] },
  { clube: 'Bahia',         termos: ['bahia'] },
  { clube: 'Vitória',       termos: ['vitória', 'vitoria'] },
  { clube: 'Sport',         termos: ['sport', 'sport recife', 'sport club do recife'] },
]

export const SELECOES_MAP = [
  { clube: 'Brasil',         termos: ['brasil', 'seleção brasileira', 'selecao brasileira', 'canarinho', 'cbf'] },
  { clube: 'Argentina',      termos: ['argentina', 'afa', 'albiceleste'] },
  { clube: 'Uruguai',        termos: ['uruguai', 'uruguay'] },
  { clube: 'Chile',          termos: ['chile'] },
  { clube: 'Colômbia',       termos: ['colômbia', 'colombia'] },
  { clube: 'Paraguai',       termos: ['paraguai', 'paraguay'] },
  { clube: 'Peru',           termos: ['peru'] },
  { clube: 'Equador',        termos: ['equador', 'ecuador'] },
  { clube: 'México',         termos: ['méxico', 'mexico'] },
  { clube: 'Estados Unidos', termos: ['estados unidos', 'eua', 'usa', 'united states', 'usmnt'] },
  { clube: 'Canadá',         termos: ['canadá', 'canada'] },
  { clube: 'Alemanha',       termos: ['alemanha', 'germany', 'deutschland'] },
  { clube: 'Espanha',        termos: ['espanha', 'spain'] },
  { clube: 'França',         termos: ['frança', 'franca', 'france'] },
  { clube: 'Inglaterra',     termos: ['inglaterra', 'england'] },
  { clube: 'Itália',         termos: ['itália', 'italia', 'italy', 'azzurra'] },
  { clube: 'Holanda',        termos: ['holanda', 'países baixos', 'paises baixos', 'netherlands'] },
  { clube: 'Portugal',       termos: ['portugal'] },
  { clube: 'Bélgica',        termos: ['bélgica', 'belgica', 'belgium'] },
  { clube: 'Croácia',        termos: ['croácia', 'croacia', 'croatia'] },
  { clube: 'Grécia',         termos: ['grécia', 'grecia', 'greece'] },
  { clube: 'Jamaica',        termos: ['jamaica'] },
  { clube: 'Japão',          termos: ['japão', 'japao', 'japan'] },
  { clube: 'Coreia do Sul',  termos: ['coreia do sul', 'coréia do sul', 'korea'] },
  { clube: 'Noruega',        termos: ['noruega', 'norway'] },
  { clube: 'Suécia',         termos: ['suécia', 'suecia', 'sweden'] },
  { clube: 'Nigéria',        termos: ['nigéria', 'nigeria'] },
  { clube: 'Camarões',       termos: ['camarões', 'camaroes', 'cameroon'] },
  { clube: 'Marrocos',       termos: ['marrocos', 'morocco'] },
]

export const TIMES_MAP = [...CLUBES_MAP, ...SELECOES_MAP]

export function normalizarTexto(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function termoComBorda(termo) {
  return new RegExp(`(^|[^a-z0-9])${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`)
}

function termosBaseClube(clube) {
  const nome = clube?.nome || clube?.clube || ''
  const slug = clube?.slug || ''
  const termos = [nome, slug, normalizarTexto(nome), normalizarTexto(slug).replace(/-/g, ' ')]
    .map(t => String(t || '').replace(/-/g, ' ').trim())
    .filter(Boolean)

  const extras = []
  for (const termo of termos) {
    const normalizado = normalizarTexto(termo)
    if (normalizado.includes('independiente')) {
      extras.push(termo.replace(/independiente/gi, 'independente'))
    }
  }

  if (termos.some(termo => normalizarTexto(termo) === 'boca juniors')) {
    extras.push('boca', 'boca jr', 'boca jrs', 'boca junior')
  }

  return [...termos, ...extras]
}

export async function carregarClubesMap(supabase) {
  const { data, error } = await supabase
    .from('clubes')
    .select('nome, slug')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error || !data?.length) {
    if (error) console.warn('  ⚠️  Não foi possível carregar clubes do banco:', error.message)
    return TIMES_MAP
  }

  const porClube = new Map()

  for (const clube of data) {
    const chave = normalizarTexto(clube.nome)
    porClube.set(chave, { clube: clube.nome, termos: new Set(termosBaseClube(clube)) })
  }

  for (const clubePadrao of TIMES_MAP) {
    const termosPadrao = termosBaseClube(clubePadrao).concat(clubePadrao.termos)
    const clubeDoBanco = Array.from(porClube.values()).find(item => {
      const nome = normalizarTexto(item.clube)
      return normalizarTexto(clubePadrao.clube) === nome ||
        termosPadrao.some(termo => {
          const termoNormalizado = normalizarTexto(termo)
          return nome === termoNormalizado || nome.includes(termoNormalizado)
        })
    })
    const atual = clubeDoBanco || { clube: clubePadrao.clube, termos: new Set() }
    termosPadrao.forEach(termo => atual.termos.add(termo))
    porClube.set(normalizarTexto(atual.clube), atual)
  }

  return Array.from(porClube.values()).map(({ clube, termos }) => ({
    clube,
    termos: Array.from(termos)
      .map(termo => termo.trim())
      .filter(Boolean),
  }))
}

export async function carregarClubesMapPorCategoria(supabase) {
  const { data, error } = await supabase
    .from('clubes')
    .select('nome, slug, categoria')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error || !data?.length) {
    if (error) console.warn('  ⚠️  Não foi possível carregar clubes por categoria do banco:', error.message)
    return new Map([
      ['Clubes Brasileiros', CLUBES_MAP],
      ['Seleções', SELECOES_MAP],
    ])
  }

  const porCategoria = new Map()
  for (const clube of data) {
    const categoria = clube.categoria || 'Outros'
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, [])
    porCategoria.get(categoria).push({
      clube: clube.nome,
      termos: termosBaseClube(clube),
    })
  }

  return porCategoria
}

export function combinarClubesMap(...maps) {
  const porClube = new Map()

  for (const map of maps) {
    for (const item of map || []) {
      if (!item?.clube) continue
      const chave = normalizarTexto(item.clube)
      const atual = porClube.get(chave) || { clube: item.clube, termos: new Set() }
      ;(item.termos || []).forEach(termo => atual.termos.add(termo))
      porClube.set(chave, atual)
    }
  }

  return Array.from(porClube.values()).map(({ clube, termos }) => ({
    clube,
    termos: Array.from(termos).filter(Boolean),
  }))
}

export async function carregarClubesBusca(supabase, { usado = false } = {}) {
  const clubesMap = await carregarClubesMap(supabase)
  return clubesMap.map(({ clube, termos }) => ({
    clube,
    query: `camisa ${clube}${usado ? ' usada' : ''}`,
    termos,
    aliases: termos.filter(termo => normalizarTexto(termo) !== normalizarTexto(clube)),
  }))
}

export function identificarClube(titulo, clubesMap = CLUBES_MAP) {
  const texto = normalizarTexto(titulo)
  let melhor = null

  for (const { clube, termos } of clubesMap) {
    for (const termo of termos) {
      const termoNormalizado = normalizarTexto(termo)
      if (!termoNormalizado || !termoComBorda(termoNormalizado).test(texto)) continue
      if (!melhor || termoNormalizado.length > melhor.tamanho) {
        melhor = { clube, tamanho: termoNormalizado.length }
      }
    }
  }

  return melhor?.clube || null
}

export function identificarSelecao(titulo, selecoesMap = SELECOES_MAP) {
  return identificarClube(titulo, selecoesMap)
}
