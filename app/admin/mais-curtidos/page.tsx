'use client'
import { useEffect, useState, useCallback } from 'react'

type Produto = {
  id: string; titulo: string; clube: string | null; imagem_url: string | null
  views: number; likes: number; cliques_anuncio: number; fonte_nome: string | null; link_original: string
}

const POR_PAGINA = 50

export default function MaisCurtidos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal]       = useState(0)
  const [pagina, setPagina]     = useState(0)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const params = new URLSearchParams({
      tipo: 'likes',
      limit: String(POR_PAGINA),
      offset: String(pagina * POR_PAGINA),
    })
    const res = await fetch(`/api/admin/cms/metricas?${params}`, { cache: 'no-store' })
    const json = res.ok ? await res.json() : { produtos: [], total: 0 }
    setProdutos(json.produtos || [])
    setTotal(json.total || 0)
    setCarregando(false)
  }, [pagina])

  useEffect(() => { carregar() }, [carregar])

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Mais curtidos</h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>{total.toLocaleString('pt-BR')} produtos com likes registrados</p>
      </div>

      {carregando ? <div style={{ color: '#8A8880', fontSize: 14 }}>Carregando...</div> : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['#', 'Produto', 'Clube', 'Likes', 'Views', 'Cliques anúncio', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#8A8880', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < produtos.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#B0AEA8', width: 40 }}>{pagina * POR_PAGINA + i + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0EFEB', overflow: 'hidden', flexShrink: 0 }}>
                        {p.imagem_url && <img src={p.imagem_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titulo}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4845' }}>{p.clube || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{(p.likes || 0).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B6966' }}>{(p.views || 0).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B6966' }}>{(p.cliques_anuncio || 0).toLocaleString('pt-BR')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <a href={p.link_original} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#550fed', textDecoration: 'none', fontWeight: 500 }}>↗</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(() => {
        const totalPaginas = Math.ceil(total / POR_PAGINA)
        if (totalPaginas <= 1) return null
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontSize: 13, color: '#6B6966' }}>
            <span>Mostrando {pagina * POR_PAGINA + 1}-{Math.min((pagina + 1) * POR_PAGINA, total)} de {total.toLocaleString('pt-BR')}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0} style={{ padding: '7px 14px', background: pagina === 0 ? '#F0EFEB' : '#fff', border: '1px solid #E8E6DF', borderRadius: 8, fontSize: 13, fontFamily: 'Onest, sans-serif', cursor: pagina === 0 ? 'not-allowed' : 'pointer', color: '#4A4845' }}>← Anterior</button>
              <button onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))} disabled={pagina >= totalPaginas - 1} style={{ padding: '7px 14px', background: pagina >= totalPaginas - 1 ? '#F0EFEB' : '#fff', border: '1px solid #E8E6DF', borderRadius: 8, fontSize: 13, fontFamily: 'Onest, sans-serif', cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer', color: '#4A4845' }}>Próxima →</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
