'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import { supabase } from '@/lib/supabase'
import type { Produto } from '@/types'

const imgBgHero      = "https://www.figma.com/api/mcp/asset/edd4f565-9eae-4473-819e-86ec35f69e85"
const imgArrowLeft   = "https://www.figma.com/api/mcp/asset/3fd80195-aaa1-496d-8fe9-004e1e8272cf"
const imgChevronDown = "https://www.figma.com/api/mcp/asset/c5b80643-ab70-4381-94cd-3496ac846c89"

const POR_PAGINA = 20

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q       = searchParams.get('q') || ''
  const decada  = searchParams.get('decada')
  const ordenar = searchParams.get('ordenar')

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [ordem, setOrdem]       = useState('mais recente')
  const [pagina, setPagina]     = useState(1)

  useEffect(() => {
    setLoading(true)
    setPagina(1)
  }, [q, decada, ordenar])

  useEffect(() => {
    setLoading(true)

    let query = supabase.from('produtos').select('*', { count: 'exact' }).eq('ativo', true)

    // Busca por múltiplos termos: "internacional 1997" busca cada palavra no título OU clube OU ano
    if (q) {
      const termos = q.trim().split(/\s+/).filter(t => t.length > 0)
      termos.forEach(termo => {
        query = query.or(`titulo.ilike.%${termo}%,clube.ilike.%${termo}%,ano.ilike.%${termo}%`)
      })
    }

    // Filtro por década (1980, 1990, etc.)
    if (decada) {
      const ini = decada.length === 2 ? `19${decada}` : decada
      const inicio = parseInt(ini, 10)
      const fim = inicio + 9
      query = query.gte('ano', String(inicio)).lte('ano', String(fim))
    }

    // Ordenação
    if (ordem === 'menor preço') {
      query = query.order('preco', { ascending: true, nullsFirst: false })
    } else if (ordem === 'maior preço') {
      query = query.order('preco', { ascending: false, nullsFirst: false })
    } else if (ordenar === 'mais-vistos' || ordem === 'mais vistos') {
      query = query.order('views', { ascending: false, nullsFirst: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1)
      .then(({ data, count }) => {
        setProdutos(data || [])
        setTotal(count || 0)
        setLoading(false)
      })
  }, [q, decada, ordenar, ordem, pagina])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  // Divide em linhas de 5
  const rows: Produto[][] = []
  for (let i = 0; i < produtos.length; i += 5) rows.push(produtos.slice(i, i + 5))

  // Título da página dependendo do contexto
  const tituloContexto = decada
    ? `Camisas dos anos ${decada.length === 2 ? decada : decada.slice(2)}`
    : ordenar === 'mais-vistos'
      ? 'Em alta no momento'
      : 'Resultado da busca'

  // Páginas a exibir na paginação (max 5 + reticências + última)
  function paginasParaExibir() {
    if (totalPaginas <= 5) return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    const inicio = Math.max(1, pagina - 2)
    const fim = Math.min(totalPaginas, inicio + 4)
    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i)
  }
  const paginasExib = paginasParaExibir()
  const mostrarReticencias = totalPaginas > 5 && paginasExib[paginasExib.length - 1] < totalPaginas

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-card { width: 218px; height: 325px; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .ag-card:hover { transform: translateY(-3px); }
        .ag-card-row { display: flex; gap: 12px; margin-bottom: 40px; }
        .ag-cta-form { display: flex; gap: 16px; align-items: flex-end; width: 100%; }
        @media (max-width: 768px) {
          .ag-card-row { display: grid !important; grid-template-columns: repeat(2,1fr); gap: 10px; }
          .ag-card-row > a { width: 100% !important; height: auto !important; }
          .ag-cta-form { flex-direction: column !important; }
        }
      `}</style>

      <main style={{ fontFamily: 'Onest, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
        <Navbar />

        <section style={{ paddingTop: 76, position: 'relative', minHeight: 290, background: '#f5f5f5' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '115%', top: '-15%', objectFit: 'cover', opacity: 0.4 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(245,245,245,0.7) 80%, #f5f5f5 95%)' }} />
          </div>

          <div className="ag-container" style={{ position: 'relative', zIndex: 2, paddingTop: 86, paddingBottom: 40 }}>
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', marginBottom: 16 }}>
              <img src={imgArrowLeft} alt="Voltar" style={{ width: 24, height: 24 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 32, color: '#000', letterSpacing: '-0.64px', whiteSpace: 'nowrap' as const }}>
                  {tituloContexto}
                </p>
                {!loading && (
                  <p style={{ fontWeight: 300, fontSize: 24, color: '#000', letterSpacing: '-0.48px', lineHeight: 1.2, marginTop: 4 }}>
                    {total > 0 ? (
                      <>
                        Encontramos <strong style={{ fontWeight: 700 }}>{total.toLocaleString('pt-BR')} {total === 1 ? 'camisa' : 'camisas'}</strong>
                        {q && <> na sua busca por <strong style={{ fontWeight: 700 }}>"{q}"</strong></>}
                      </>
                    ) : (
                      <>
                        Nenhuma camisa encontrada
                        {q && <> para <strong style={{ fontWeight: 700 }}>"{q}"</strong></>}
                      </>
                    )}
                  </p>
                )}
              </div>

              {total > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <p style={{ fontSize: 14, color: '#000', letterSpacing: '-0.14px', lineHeight: 1.2, whiteSpace: 'nowrap' as const }}>Ordenar por</p>
                  <div style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', cursor: 'pointer', position: 'relative' as const }}>
                    <select
                      value={ordem}
                      onChange={e => setOrdem(e.target.value)}
                      style={{ fontWeight: 700, fontSize: 12, color: '#62748c', letterSpacing: '-0.24px', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', appearance: 'none' as const, paddingRight: 20 }}
                    >
                      <option>mais recente</option>
                      <option>menor preço</option>
                      <option>maior preço</option>
                      <option>mais vistos</option>
                    </select>
                    <img src={imgChevronDown} alt="" style={{ width: 14, height: 14, position: 'absolute' as const, right: 8, pointerEvents: 'none' as const }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section style={{ background: '#f5f5f5', paddingBottom: 40 }}>
          <div className="ag-container">
            {loading ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 40 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{ width: 218, height: 325, background: '#ecebf0', borderRadius: 16 }} />
                ))}
              </div>
            ) : produtos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <p style={{ fontSize: 18, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>
                  Tente buscar por outro termo ou clube
                </p>
              </div>
            ) : (
              rows.map((row, ri) => (
                <div key={ri} className="ag-card-row">
                  {row.map(p => <CardProduto key={p.id} produto={p} />)}
                </div>
              ))
            )}

            {/* Paginação dinâmica */}
            {!loading && totalPaginas > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 112 }}>
                {paginasExib.map(n => (
                  <button key={n} onClick={() => { setPagina(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #fff', background: pagina === n ? '#550fed' : '#ecebf0', color: pagina === n ? '#ebe8f2' : '#444', fontSize: 12, fontWeight: 400, letterSpacing: '-0.12px', cursor: 'pointer', fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {n}
                  </button>
                ))}
                {mostrarReticencias && (
                  <>
                    <span style={{ color: '#62748c', fontFamily: 'Onest, sans-serif' }}>...</span>
                    <button onClick={() => { setPagina(totalPaginas); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #fff', background: pagina === totalPaginas ? '#550fed' : '#ecebf0', color: pagina === totalPaginas ? '#ebe8f2' : '#444', fontSize: 12, cursor: 'pointer', fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {totalPaginas}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f5f5f5' }} />}>
      <SearchContent />
    </Suspense>
  )
}