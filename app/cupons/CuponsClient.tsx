'use client'

import { useMemo, useState } from 'react'
import CardOferta from '@/components/CardOferta'
import type { OfertaAfiliada } from '@/types'

const TODOS = 'Todos'

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

export default function CuponsClient({ ofertas }: { ofertas: OfertaAfiliada[] }) {
  const [clubeSelecionado, setClubeSelecionado] = useState(TODOS)
  const [ofertasOrdenadas] = useState(() => ordenarPorClubesEmbaralhados(ofertas))

  const clubes = useMemo(() => {
    return [TODOS, ...Array.from(new Set(ofertas.map(oferta => oferta.clube).filter((clube): clube is string => Boolean(clube)))).sort((a, b) => a.localeCompare(b, 'pt-BR'))]
  }, [ofertas])

  const ofertasFiltradas = clubeSelecionado === TODOS
    ? ofertasOrdenadas
    : ofertasOrdenadas.filter(oferta => oferta.clube === clubeSelecionado)

  if (ofertas.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: '#62748c', fontSize: 15, fontWeight: 600, padding: 28 }}>
        Nenhum cupom ativo no momento.
      </div>
    )
  }

  return (
    <>
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        {clubes.map(clube => {
          const ativo = clube === clubeSelecionado
          return (
            <button
              key={clube}
              onClick={() => setClubeSelecionado(clube)}
              type="button"
              style={{
                background: ativo ? '#282828' : '#fff',
                border: `1px solid ${ativo ? '#282828' : '#E8E6DF'}`,
                borderRadius: 999,
                color: ativo ? '#fff' : '#282828',
                cursor: 'pointer',
                font: '800 12px Onest, sans-serif',
                letterSpacing: '-0.01em',
                padding: '9px 12px',
              }}
            >
              {clube}
            </button>
          )
        })}
      </div>

      {ofertasFiltradas.length > 0 ? (
        <div className="ag-cards">
          {ofertasFiltradas.map(oferta => <CardOferta key={oferta.id} oferta={oferta} />)}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: '#62748c', fontSize: 15, fontWeight: 600, padding: 28 }}>
          Nenhuma oferta ativa para este clube.
        </div>
      )}
    </>
  )
}
