/**
 * fix-imagens.js — Corrige imagens ausentes no banco
 * Busca produtos sem imagem válida e visita a página individual de cada um
 * para pegar a imagem real.
 * 
 * Roda com: node fix-imagens.js
 */

import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const DELAY_MS = 800

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function imagemInvalida(url) {
  if (!url) return true
  if (url.startsWith('data:')) return true
  if (url.includes('svg+xml')) return true
  return false
}

async function buscarImagemDaPagina(linkOriginal) {
  try {
    const res = await fetch(linkOriginal, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AguanteBot/1.0)' },
      timeout: 15000,
    })
    if (!res.ok) return null

    const html = await res.text()
    const $ = cheerio.load(html)

    // Tenta pegar a imagem principal do produto
    const imagem =
      $('div.woocommerce-product-gallery__image img').attr('src') ||
      $('figure.woocommerce-product-gallery__wrapper img').attr('src') ||
      $('.wp-post-image').attr('src') ||
      $('img.wp-post-image').attr('data-src') ||
      null

    if (imagem && !imagemInvalida(imagem)) return imagem
    return null
  } catch {
    return null
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🔍 Buscando produtos sem imagem válida...\n')

  // Busca todos os produtos sem imagem ou com imagem inválida
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, titulo, link_original, imagem_url')
    .or('imagem_url.is.null,imagem_url.like.data:%')

  if (error) {
    console.error('Erro ao buscar produtos:', error.message)
    return
  }

  console.log(`📋 ${produtos.length} produtos sem imagem válida encontrados.\n`)

  let corrigidos = 0
  let naoEncontrados = 0

  for (let i = 0; i < produtos.length; i++) {
    const p = produtos[i]
    console.log(`[${i + 1}/${produtos.length}] ${p.titulo.slice(0, 50)}...`)

    const imagem = await buscarImagemDaPagina(p.link_original)

    if (imagem) {
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ imagem_url: imagem })
        .eq('id', p.id)

      if (updateError) {
        console.log(`  ❌ Erro ao atualizar: ${updateError.message}`)
      } else {
        console.log(`  ✅ Imagem corrigida`)
        corrigidos++
      }
    } else {
      console.log(`  ⚠️  Imagem não encontrada`)
      naoEncontrados++
    }

    if (i < produtos.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n✅ Concluído!`)
  console.log(`   Corrigidos: ${corrigidos}`)
  console.log(`   Não encontrados: ${naoEncontrados}`)
}

main().catch(console.error)
