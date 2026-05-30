'use client'

import { useEffect, useState } from 'react'
import type { OfertaAfiliada } from '@/types'

function formatarPreco(preco: number | null | undefined) {
  if (typeof preco !== 'number' || !Number.isFinite(preco)) return null
  return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CardOferta({ oferta }: { oferta: OfertaAfiliada }) {
  const [sessionId, setSessionId] = useState('')
  const preco = formatarPreco(oferta.preco)
  const precoComCupom = formatarPreco(oferta.preco_com_cupom)
  const percentual = oferta.cupom_percentual ? Math.round(oferta.cupom_percentual) : null
  const observacao = oferta.cupom_descricao?.toLowerCase().includes('seleção') ? 'exceto Seleção' : oferta.cupom_descricao
  const params = new URLSearchParams()
  if (sessionId) params.set('sid', sessionId)
  if (oferta.cupom_codigo) params.set('cupom_revelado', 'true')
  const href = `/out/oferta/${oferta.id}${params.size ? `?${params.toString()}` : ''}`

  useEffect(() => {
    const chave = 'aguante_session_id'
    const existente = sessionStorage.getItem(chave)
    const proximo = existente || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(chave, proximo)
    const atualizarSessao = window.setTimeout(() => setSessionId(proximo), 0)
    return () => window.clearTimeout(atualizarSessao)
  }, [])

  return (
    <a
      href={href}
      rel="sponsored noreferrer"
      className="ag-oferta-card"
      style={{ color: 'inherit', textDecoration: 'none' }}
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
          camisa nova
        </span>
        {percentual && (
          <span style={{ position: 'absolute', right: 12, top: 12, background: '#550fed', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1, padding: '6px 8px' }}>
            {percentual}% OFF
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 10 }}>
        <p style={{ color: '#282828', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25 }}>
          {oferta.titulo}
        </p>
        <p style={{ color: '#62748c', fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Oferta via {oferta.loja}
        </p>
        {oferta.cupom_codigo && (
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 3 }}>
            <span style={{ border: '1px dashed #550fed', borderRadius: 6, color: '#550fed', fontSize: 12, fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1, padding: '6px 8px' }}>
              {oferta.cupom_codigo}
            </span>
            {observacao && (
              <span style={{ color: '#8A8880', fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {observacao}
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  )
}
