'use client'

import { useEffect, useState } from 'react'
import type { OfertaAfiliada } from '@/types'

function formatarPreco(preco: number | null | undefined) {
  if (typeof preco !== 'number' || !Number.isFinite(preco) || preco <= 0) return null
  return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CardOferta({ oferta }: { oferta: OfertaAfiliada }) {
  const [cupomCopiado, setCupomCopiado] = useState(false)
  const cupomAplicavel = oferta.cupom_aplicavel !== false
  const percentualCupom = oferta.cupom_percentual || 15
  const precos = [oferta.preco_pix, oferta.preco].filter((valor): valor is number => typeof valor === 'number' && Number.isFinite(valor) && valor > 0)
  const precoPrincipal = precos.length ? Math.min(...precos) : null
  const preco = formatarPreco(precoPrincipal)
  const descontoMaximo = typeof oferta.cupom_desconto_maximo === 'number' && Number.isFinite(oferta.cupom_desconto_maximo) && oferta.cupom_desconto_maximo > 0
    ? oferta.cupom_desconto_maximo
    : null
  const descontoCalculado = cupomAplicavel && precoPrincipal && percentualCupom
    ? Math.max(0, Math.round((precoPrincipal - Math.min(precoPrincipal * (percentualCupom / 100), descontoMaximo || Infinity)) * 100) / 100)
    : null
  const precoComCupom = cupomAplicavel ? formatarPreco(oferta.preco_com_cupom ?? descontoCalculado) : null
  const percentualLabel = cupomAplicavel ? `${Math.round(percentualCupom)}% OFF` : null
  const href = oferta.link_afiliado

  useEffect(() => {
    const chave = 'aguante_session_id'
    if (sessionStorage.getItem(chave)) return

    const proximo = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(chave, proximo)
  }, [])

  function obterSessionIdAtual() {
    const chave = 'aguante_session_id'
    const existente = sessionStorage.getItem(chave)
    if (existente) return existente

    const proximo = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(chave, proximo)
    return proximo
  }

  function registrarCliqueSaida() {
    try {
      const payload = JSON.stringify({
        sid: obterSessionIdAtual(),
        cupom_revelado: Boolean(oferta.cupom_codigo && cupomAplicavel),
        pagina: window.location.href,
        origem: 'aguante',
      })
      const endpoint = `/api/ofertas/${encodeURIComponent(oferta.id)}/clique`

      if (navigator.sendBeacon) {
        const enviado = navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }))
        if (enviado) return
      }

      void fetch(endpoint, {
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        method: 'POST',
      }).catch(() => null)
    } catch {
      // O clique afiliado nao pode depender do registro interno.
    }
  }

  async function copiarCupom() {
    if (!oferta.cupom_codigo) return
    await navigator.clipboard?.writeText(oferta.cupom_codigo).catch(() => null)
    setCupomCopiado(true)
    window.setTimeout(() => setCupomCopiado(false), 1800)
  }

  return (
    <article
      className="ag-oferta-card"
      style={{ color: 'inherit', textDecoration: 'none' }}
    >
      <a
        href={href}
        onAuxClick={event => {
          if (event.button === 1) registrarCliqueSaida()
        }}
        onClick={registrarCliqueSaida}
        rel="sponsored noopener"
        style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}
        target="_blank"
      >
        <div
        style={{
          aspectRatio: '1 / 1',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#ecebf0',
          backgroundImage: oferta.imagem_url ? `url(${oferta.imagem_url})` : undefined,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          position: 'relative',
        }}
      >
        <span style={{ position: 'absolute', left: 12, top: 12, background: 'rgba(255,255,255,0.92)', borderRadius: 6, color: '#282828', fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1, padding: '6px 8px' }}>
          na etiqueta
        </span>
        {percentualLabel && cupomAplicavel && (
          <span style={{ position: 'absolute', right: 12, top: 12, background: '#550fed', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1, padding: '6px 8px' }}>
            {percentualLabel}
          </span>
        )}
        {preco && (
          <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(255,255,255,0.94)', borderRadius: 6, color: '#62748c', lineHeight: 1, padding: '7px 8px' }}>
            {precoComCupom && (
              <div style={{ color: '#087443', fontSize: 14, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
                {precoComCupom}
              </div>
            )}
            <div style={{ color: precoComCupom ? '#8A8880' : '#62748c', fontSize: precoComCupom ? 11 : 14, fontWeight: 700, letterSpacing: '-0.03em', textDecoration: precoComCupom ? 'line-through' : 'none' }}>
              {preco}
            </div>
          </div>
        )}
        </div>
      </a>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 10 }}>
        <a
          href={href}
          onAuxClick={event => {
            if (event.button === 1) registrarCliqueSaida()
          }}
          onClick={registrarCliqueSaida}
          rel="sponsored noopener"
          style={{ color: 'inherit', textDecoration: 'none' }}
          target="_blank"
        >
          <p style={{ color: '#282828', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          {oferta.titulo}
          </p>
        </a>
        <p style={{ color: '#62748c', fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Oferta via {oferta.loja}
        </p>
        {oferta.cupom_codigo && cupomAplicavel && (
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 3 }}>
            <span style={{ border: '1px dashed #550fed', borderRadius: 6, color: '#550fed', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1, padding: '6px 8px' }}>
              {oferta.cupom_codigo}
            </span>
            <button
              onClick={copiarCupom}
              type="button"
              style={{ background: '#550fed', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', font: '800 11px Onest, sans-serif', letterSpacing: '-0.01em', lineHeight: 1, padding: '6px 8px' }}
            >
              {cupomCopiado ? 'copiado' : 'copiar'}
            </button>
            <span style={{ background: '#E8FFF4', borderRadius: 6, color: '#087443', fontSize: 11, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1, padding: '6px 8px' }}>
              {Math.round(percentualCupom)}% OFF usando o cupom
            </span>
          </div>
        )}
      </div>
    </article>
  )
}
