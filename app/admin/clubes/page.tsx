'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ClubeContagem = { clube: string; total: number }

export default function AdminClubes() {
  const router = useRouter()
  const [ranking, setRanking]     = useState<ClubeContagem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [totalGeral, setTotalGeral] = useState(0)

  useEffect(() => {
    async function carregar() {
      const contagem: Record<string, number> = {}
      let offset = 0
      const PAGE = 1000

      while (true) {
        const { data: lote } = await supabase
          .from('produtos')
          .select('clube')
          .eq('ativo', true)
          .not('clube', 'is', null)
          .range(offset, offset + PAGE - 1)

        if (!lote || lote.length === 0) break
        lote.forEach(p => { if (p.clube) contagem[p.clube] = (contagem[p.clube] || 0) + 1 })
        if (lote.length < PAGE) break
        offset += PAGE
      }

      const lista = Object.entries(contagem)
        .map(([clube, total]) => ({ clube, total }))
        .sort((a, b) => b.total - a.total)

      setRanking(lista)
      setTotalGeral(lista.reduce((a, b) => a + b.total, 0))
      setCarregando(false)
    }

    carregar()
  }, [])

  if (carregando) return <div style={{ color: '#8A8880', fontSize: 14, paddingTop: 40 }}>Carregando ranking...</div>

  const max = ranking[0]?.total || 1

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Clubes</h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
          {ranking.length} clubes · {totalGeral.toLocaleString('pt-BR')} produtos com clube identificado
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
              {['#', 'Clube', 'Produtos', '% do total', ''].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranking.map((item, i) => {
              const pct = Math.round((item.total / max) * 100)
              const pctTotal = ((item.total / totalGeral) * 100).toFixed(1)
              return (
                <tr key={item.clube} style={{ borderBottom: i < ranking.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: i < 3 ? '#1A1A1A' : '#B0AEA8', width: 40 }}>{i + 1}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{item.clube}</span>
                      <div style={{ height: 4, background: '#F0EFEB', borderRadius: 99, width: 200, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#1A1A1A', borderRadius: 99 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{item.total.toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>{pctTotal}%</td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      onClick={() => router.push(`/admin/produtos?clube=${encodeURIComponent(item.clube)}`)}
                      style={{ padding: '5px 12px', background: '#F0EFEB', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 500, fontFamily: 'Onest, sans-serif', cursor: 'pointer', color: '#4A4845' }}
                    >
                      Ver produtos
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}