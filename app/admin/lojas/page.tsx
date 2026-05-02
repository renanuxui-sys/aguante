'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type LojaMetrica = {
  fonte_nome: string
  fonte_url: string | null
  total_cliques: number
  total_produtos: number
  total_views: number
}

export default function AdminLojas() {
  const [lojas, setLojas]           = useState<LojaMetrica[]>([])
  const [carregando, setCarregando] = useState(true)
  const [totalCliques, setTotalCliques] = useState(0)

  useEffect(() => {
    async function carregar() {
      // Busca agregado por fonte — pagina em blocos para pegar todos os produtos
      const agregado: Record<string, { fonte_url: string | null; cliques: number; produtos: number; views: number }> = {}
      let offset = 0
      const PAGE = 1000

      while (true) {
        const { data: lote } = await supabase
          .from('produtos')
          .select('fonte_nome, fonte_url, cliques_anuncio, views')
          .eq('ativo', true)
          .not('fonte_nome', 'is', null)
          .range(offset, offset + PAGE - 1)

        if (!lote || lote.length === 0) break

        lote.forEach(p => {
          const nome = p.fonte_nome!
          if (!agregado[nome]) {
            agregado[nome] = { fonte_url: p.fonte_url, cliques: 0, produtos: 0, views: 0 }
          }
          agregado[nome].cliques  += p.cliques_anuncio || 0
          agregado[nome].produtos += 1
          agregado[nome].views    += p.views || 0
        })

        if (lote.length < PAGE) break
        offset += PAGE
      }

      const lista: LojaMetrica[] = Object.entries(agregado)
        .map(([fonte_nome, v]) => ({
          fonte_nome,
          fonte_url: v.fonte_url,
          total_cliques: v.cliques,
          total_produtos: v.produtos,
          total_views: v.views,
        }))
        .sort((a, b) => b.total_cliques - a.total_cliques)

      setLojas(lista)
      setTotalCliques(lista.reduce((a, b) => a + b.total_cliques, 0))
      setCarregando(false)
    }

    carregar()
  }, [])

  if (carregando) return <div style={{ color: '#8A8880', fontSize: 14, paddingTop: 40 }}>Carregando...</div>

  const maxCliques = lojas[0]?.total_cliques || 1

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>
          Lojas mais clicadas
        </h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
          {totalCliques.toLocaleString('pt-BR')} cliques totais em "ir para o anúncio" · {lojas.length} lojas
        </p>
      </div>

      {/* Cards de resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {lojas.slice(0, 3).map((l, i) => (
          <div key={l.fonte_nome} style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? '#1A1A1A' : '#B0AEA8' }}>#{i + 1}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{l.fonte_nome}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#550fed', marginBottom: 4 }}>
              {l.total_cliques.toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 12, color: '#8A8880' }}>cliques no anúncio</div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#6B6966', display: 'flex', gap: 12 }}>
              <span>👁 {l.total_views.toLocaleString('pt-BR')} views</span>
              <span>◈ {l.total_produtos.toLocaleString('pt-BR')} produtos</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela completa */}
      <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
              {['#', 'Loja', 'Cliques anúncio', 'Views totais', 'Produtos', '% dos cliques', ''].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lojas.map((l, i) => {
              const pct = totalCliques > 0 ? ((l.total_cliques / totalCliques) * 100).toFixed(1) : '0'
              const barPct = Math.round((l.total_cliques / maxCliques) * 100)
              return (
                <tr key={l.fonte_nome} style={{ borderBottom: i < lojas.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: i < 3 ? '#1A1A1A' : '#B0AEA8', width: 40 }}>{i + 1}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{l.fonte_nome}</span>
                      <div style={{ height: 4, background: '#F0EFEB', borderRadius: 99, width: 180, overflow: 'hidden' }}>
                        <div style={{ width: `${barPct}%`, height: '100%', background: '#550fed', borderRadius: 99 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>
                    {l.total_cliques.toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>
                    {l.total_views.toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>
                    {l.total_produtos.toLocaleString('pt-BR')}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ background: '#F0EFEB', borderRadius: 8, padding: '3px 8px', fontSize: 12, fontWeight: 600, color: '#4A4845' }}>
                      {pct}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {l.fonte_url && (
                      <a href={l.fonte_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#550fed', textDecoration: 'none', fontWeight: 500 }}>↗</a>
                    )}
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