'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import { supabase } from '@/lib/supabase'
import type { Produto } from '@/types'

const imgBgHero      = "/assets/bg-hero.png"
const imgArrowLeft   = "/assets/arrow-left.svg"
const imgChevronDown = "/assets/chevron-down.svg"
const imgFire        = "/assets/fire-alt-solid.svg"

const POR_PAGINA = 20

type FiltroBusca = {
  label: string
  params: Record<string, string>
  icon?: string
}

const filtros: FiltroBusca[] = [
  { label: 'em alta', params: { ordenar: 'mais-vistos' }, icon: imgFire },
  { label: 'de jogo', params: { de_jogo: 'true' } },
  { label: 'Anos 70', params: { decada: '70' } },
  { label: 'Anos 80', params: { decada: '80' } },
  { label: 'Anos 90', params: { decada: '90' } },
  { label: 'Anos 2000', params: { decada: '2000' } },
]
const filtroKeys = ['ordenar', 'decada', 'de_jogo']

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q       = searchParams.get('q') || ''
  const decada  = searchParams.get('decada')
  const ordenar = searchParams.get('ordenar')
  const deJogo  = searchParams.get('de_jogo') === 'true'

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [ordem, setOrdem]       = useState('mais recente')
  const [pagina, setPagina]     = useState(1)

  useEffect(() => {
    setLoading(true)
    setPagina(1)
  }, [q, decada, ordenar, deJogo])

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

    if (deJogo) {
      query = query.eq('de_jogo', true)
    }

    // Ordenação
    if (ordenar === 'mais-vistos' || ordem === 'mais vistos') {
      query = query.order('views', { ascending: false, nullsFirst: false })
    } else if (ordem === 'menor preço') {
      query = query.order('preco', { ascending: true, nullsFirst: false })
    } else if (ordem === 'maior preço') {
      query = query.order('preco', { ascending: false, nullsFirst: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    query.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1)
      .then(({ data, count }) => {
        setProdutos(data || [])
        setTotal(count || 0)
        setLoading(false)
      })
  }, [q, decada, ordenar, deJogo, ordem, pagina])

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  const tituloContexto = 'Resultado de busca'

  // Páginas a exibir na paginação (max 5 + reticências + última)
  function paginasParaExibir() {
    if (totalPaginas <= 5) return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    const inicio = Math.max(1, pagina - 2)
    const fim = Math.min(totalPaginas, inicio + 4)
    return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i)
  }
  const paginasExib = paginasParaExibir()
  const mostrarReticencias = totalPaginas > 5 && paginasExib[paginasExib.length - 1] < totalPaginas

  function aplicarFiltro(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString())
    const ativo = filtroAtivo(params)
    filtroKeys.forEach(key => next.delete(key))
    if (!ativo) {
      Object.entries(params).forEach(([key, value]) => next.set(key, value))
    }
    next.delete('pagina')
    const qs = next.toString()
    router.push(qs ? `/search?${qs}` : '/search')
  }

  function filtroAtivo(params: Record<string, string>) {
    return Object.entries(params).every(([key, value]) => searchParams.get(key) === value)
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-card { width: 100%; min-height: 325px; height: 100%; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .ag-card:hover { transform: translateY(-3px); }
        .ag-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 40px; align-items: stretch; }
        .ag-cta-form { display: flex; gap: 16px; align-items: flex-end; width: 100%; }
        .ag-listing-head { display: flex; align-items: flex-start; flex-direction: column; gap: 28px; }
        .ag-title-row { display: flex; align-items: center; gap: 28px; }
        .ag-filter-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; width: 100%; }
        .ag-filter-tags-wrap { max-width: 100%; min-width: 0; position: relative; }
        .ag-filter-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ag-filter-tag { display: inline-flex; align-items: center; gap: 8px; min-height: 30px; padding: 4px 12px; border-radius: 8px; border: none; background: #fff; color: #000; font: 400 14px/1.2 Onest, sans-serif; letter-spacing: -0.14px; cursor: pointer; }
        .ag-filter-tag-active { background: #550fed; color: #fff; }
        @media (max-width: 768px) {
          .ag-cards { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px; }
          .ag-card { height: auto !important; min-height: 112px; }
          .ag-cta-form { flex-direction: column !important; }
          .ag-title-row { gap: 12px; }
          .ag-title-row p { font-size: 26px !important; white-space: normal !important; }
          .ag-result-summary { font-size: 18px !important; }
          .ag-filter-row { align-items: flex-start; flex-direction: column; }
          .ag-filter-tags-wrap { width: 100%; }
          .ag-filter-tags-wrap::after { content: ""; position: absolute; top: 0; right: 0; bottom: 4px; width: 44px; pointer-events: none; background: linear-gradient(to right, rgba(245,245,245,0), rgba(245,245,245,1)); }
          .ag-filter-tags { flex-wrap: nowrap; max-width: 100%; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
          .ag-filter-tags::-webkit-scrollbar { display: none; }
          .ag-filter-tag { flex-shrink: 0; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .ag-cards { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
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
            <div className="ag-listing-head">
              <div>
                <div className="ag-title-row">
                  <button onClick={() => router.back()} aria-label="Voltar" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                    <img src={imgArrowLeft} alt="" style={{ width: 24, height: 24 }} />
                  </button>
                  <p style={{ fontWeight: 700, fontSize: 32, color: '#000', letterSpacing: '-0.64px', whiteSpace: 'nowrap' as const }}>
                    {tituloContexto}
                  </p>
                </div>
                {!loading && (
                  <p className="ag-result-summary" style={{ fontWeight: 300, fontSize: 24, color: '#000', letterSpacing: '-0.48px', lineHeight: 1.2, marginTop: 40 }}>
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

              {!loading && (
                <div className="ag-filter-row">
                  <div className="ag-filter-tags-wrap">
                    <div className="ag-filter-tags" aria-label="Filtros de produtos">
                      {filtros.map(filtro => {
                        const ativo = filtroAtivo(filtro.params)
                        return (
                          <button
                            key={filtro.label}
                            type="button"
                            onClick={() => aplicarFiltro(filtro.params)}
                            className={`ag-filter-tag${ativo ? ' ag-filter-tag-active' : ''}`}
                            aria-pressed={ativo}
                          >
                            {filtro.icon && <img src={filtro.icon} alt="" style={{ width: 16, height: 16, filter: ativo ? 'brightness(0) invert(1)' : undefined }} />}
                            {filtro.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {total > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <p style={{ fontSize: 14, color: '#000', letterSpacing: '-0.14px', lineHeight: 1.2, whiteSpace: 'nowrap' as const }}>Ordenar por</p>
                      <div style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', cursor: 'pointer', position: 'relative' as const }}>
                        <select
                          value={ordenar === 'mais-vistos' ? 'mais vistos' : ordem}
                          onChange={e => setOrdem(e.target.value)}
                          style={{ fontWeight: 700, fontSize: 12, color: '#62748c', letterSpacing: '-0.24px', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', appearance: 'none' as const, paddingRight: 24 }}
                        >
                          <option>mais recente</option>
                          <option>menor preço</option>
                          <option>maior preço</option>
                          <option>mais vistos</option>
                        </select>
                        <img src={imgChevronDown} alt="" style={{ width: 16, height: 16, position: 'absolute' as const, right: 8, pointerEvents: 'none' as const }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section style={{ background: '#f5f5f5', paddingBottom: 40 }}>
          <div className="ag-container">
            {loading ? (
              <div className="ag-cards">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{ width: '100%', height: 325, background: '#ecebf0', borderRadius: 16 }} />
                ))}
              </div>
            ) : produtos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <p style={{ fontSize: 18, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>
                  Tente buscar por outro termo ou clube
                </p>
              </div>
            ) : (
              <div className="ag-cards">
                {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
              </div>
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
