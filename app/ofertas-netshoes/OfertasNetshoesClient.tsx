'use client'

import { useMemo, useState } from 'react'
import CardOferta from '@/components/CardOferta'
import type { OfertaAfiliada } from '@/types'

const TODOS = 'todos'
const SELECAO_BRASILEIRA = 'Seleção Brasileira'
const OUTRAS_SELECOES = 'Outras Seleções'

function embaralhar<T>(itens: T[]) {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function ordenarPorClubesEmbaralhados(ofertas: OfertaAfiliada[]) {
  const grupos = new Map<string, OfertaAfiliada[]>()

  ofertas.forEach(oferta => {
    const clube = oferta.clube || 'Outros'
    grupos.set(clube, [...(grupos.get(clube) || []), oferta])
  })

  return embaralhar(Array.from(grupos.keys())).flatMap(clube => grupos.get(clube) || [])
}

export default function OfertasNetshoesClient({ ofertas }: { ofertas: OfertaAfiliada[] }) {
  const [clubeSelecionado, setClubeSelecionado] = useState(TODOS)
  const [ofertasOrdenadas] = useState(() => ordenarPorClubesEmbaralhados(ofertas))

  const { clubesBrasileiros, selecoes } = useMemo(() => {
    const grupos = Array.from(new Set(ofertas.map(oferta => oferta.clube).filter((clube): clube is string => Boolean(clube))))
    const clubesBrasileiros = grupos
      .filter(clube => clube !== SELECAO_BRASILEIRA && clube !== OUTRAS_SELECOES)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    const selecoes = [SELECAO_BRASILEIRA, OUTRAS_SELECOES].filter(grupo => grupos.includes(grupo))

    return { clubesBrasileiros, selecoes }
  }, [ofertas])

  const ofertasFiltradas = clubeSelecionado === TODOS
    ? ofertasOrdenadas
    : ofertasOrdenadas.filter(oferta => oferta.clube === clubeSelecionado)
  const ofertasClubes = ofertasFiltradas.filter(oferta => oferta.clube !== SELECAO_BRASILEIRA && oferta.clube !== OUTRAS_SELECOES)
  const ofertasBrasil = ofertasFiltradas.filter(oferta => oferta.clube === SELECAO_BRASILEIRA)
  const ofertasOutrasSelecoes = ofertasFiltradas.filter(oferta => oferta.clube === OUTRAS_SELECOES)

  function renderSecao(titulo: string, itens: OfertaAfiliada[]) {
    if (itens.length === 0) return null

    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <h2 style={{ color: '#282828', fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.05, margin: 0 }}>
            {titulo}
          </h2>
          <span style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 999, color: '#62748c', fontSize: 11, fontWeight: 800, lineHeight: 1, padding: '6px 8px' }}>
            {itens.length}
          </span>
        </div>
        <div className="ag-cards">
          {itens.map(oferta => <CardOferta key={oferta.id} oferta={oferta} />)}
        </div>
      </section>
    )
  }

  function renderFiltro(nome: string) {
    const ativo = nome === clubeSelecionado
    const icone = nome === SELECAO_BRASILEIRA ? '🇧🇷' : nome === OUTRAS_SELECOES ? '🌍' : null

    return (
      <button
        key={nome}
        onClick={() => setClubeSelecionado(nome)}
        type="button"
        style={{
          alignItems: 'center',
          background: ativo ? '#282828' : '#fff',
          border: `1px solid ${ativo ? '#282828' : '#E8E6DF'}`,
          borderRadius: 999,
          color: ativo ? '#fff' : '#282828',
          cursor: 'pointer',
          display: 'inline-flex',
          font: '800 12px Onest, sans-serif',
          gap: 6,
          letterSpacing: '-0.01em',
          padding: '9px 12px',
        }}
      >
        {icone && <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1 }}>{icone}</span>}
        <span>{nome}</span>
      </button>
    )
  }

  if (ofertas.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: '#62748c', fontSize: 15, fontWeight: 600, padding: 28 }}>
        Nenhuma oferta Netshoes ativa no momento.
      </div>
    )
  }

  return (
    <>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        {renderFiltro(TODOS)}
        {selecoes.map(renderFiltro)}
        {clubesBrasileiros.length > 0 && (
          <span style={{ color: '#8A8880', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1, marginLeft: 4, padding: '0 4px', textTransform: 'uppercase' }}>
            Clubes
          </span>
        )}
        {clubesBrasileiros.map(renderFiltro)}
      </div>

      {ofertasFiltradas.length > 0 ? (
        clubeSelecionado === TODOS ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 52 }}>
            {renderSecao('Clubes brasileiros', ofertasClubes)}
            {renderSecao(SELECAO_BRASILEIRA, ofertasBrasil)}
            {renderSecao(OUTRAS_SELECOES, ofertasOutrasSelecoes)}
          </div>
        ) : (
          <div className="ag-cards">
            {ofertasFiltradas.map(oferta => <CardOferta key={oferta.id} oferta={oferta} />)}
          </div>
        )
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: '#62748c', fontSize: 15, fontWeight: 600, padding: 28 }}>
          Nenhuma oferta ativa para esta seção.
        </div>
      )}
    </>
  )
}
