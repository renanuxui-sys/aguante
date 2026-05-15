'use client'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import type { Produto } from '@/types'

const imgBgHero      = "/assets/bg-hero.png"
const imgArrowLeft   = "/assets/arrow-left.svg"
const imgChevronDown = "/assets/chevron-down.svg"
const imgFire        = "/assets/fire-alt-solid.svg"

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

type SearchData = {
  produtos: Produto[]
  total: number | null
  temProxima: boolean
}

type SearchClientProps = {
  initialParams: {
    q: string
    categoria: string | null
    clube: string
    decada: string | null
    ordenar: string | null
    de_jogo: string | null
    pagina: string
  }
  initialData: SearchData
}

export default function SearchClient({ initialData }: SearchClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q          = searchParams.get('q') || ''
  const categoria  = searchParams.get('categoria')
  // ?clube=Brasil → busca exata pelo campo clube (vinda da navbar/submenu)
  // Evita que "Brasil" traga camisas com "Brasileiro" ou "Copa do Brasil" no título
  const clubeExato = searchParams.get('clube') || ''
  const decada     = searchParams.get('decada')
  const ordenar    = searchParams.get('ordenar')
  const ordemParam = searchParams.get('ordem')
  const deJogo     = searchParams.get('de_jogo') === 'true'
  const paginaParam = Math.max(1, Number(searchParams.get('pagina') || '1') || 1)
  const ordemUrl = ordemParam || (ordenar === 'mais-vistos' ? 'mais vistos' : 'mais recentes')

  const primeiraCarga = useRef(true)
  const [produtos, setProdutos] = useState<Produto[]>(initialData.produtos)
  const [total, setTotal]       = useState<number | null>(initialData.total)
  const [temProxima, setTemProxima] = useState(initialData.temProxima)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (primeiraCarga.current) {
      primeiraCarga.current = false
      return
    }

    let ativo = true
    setLoading(true)

    async function carregarProdutos() {
      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (categoria) params.set('categoria', categoria)
        if (clubeExato) params.set('clube', clubeExato)
        if (decada) params.set('decada', decada)
        if (ordenar) params.set('ordenar', ordenar)
        if (deJogo) params.set('de_jogo', 'true')
        params.set('ordem', ordemUrl)
        params.set('pagina', String(paginaParam))

        const res = await fetch(`/api/search?${params.toString()}`)
        if (!ativo) return
        const data: SearchData = res.ok ? await res.json() : { produtos: [], total: 0, temProxima: false }
        if (!ativo) return
        setProdutos(data.produtos || [])
        setTotal(data.total)
        setTemProxima(Boolean(data.temProxima))
      } catch {
        if (!ativo) return
        setProdutos([])
        setTotal(0)
        setTemProxima(false)
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregarProdutos()

    return () => {
      ativo = false
    }
  }, [q, clubeExato, categoria, decada, ordenar, deJogo, ordemUrl, paginaParam])

  // Título contextual: clube exato > busca livre > categoria
  const tituloContexto = 'Resultado de busca'
  const labelBusca = clubeExato || q || categoria || ''

  function aplicarFiltro(params: Record<string, string>) {
    setLoading(true)
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

  function irParaPagina(n: number) {
    setLoading(true)
    const next = new URLSearchParams(searchParams.toString())
    if (n <= 1) {
      next.delete('pagina')
    } else {
      next.set('pagina', String(n))
    }
    const qs = next.toString()
    router.push(qs ? `/search?${qs}` : '/search')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function alterarOrdenacao(valor: string) {
    setLoading(true)

    const next = new URLSearchParams(searchParams.toString())
    next.delete('pagina')

    if (valor === 'mais vistos') {
      next.set('ordenar', 'mais-vistos')
      next.delete('ordem')
    } else {
      next.delete('ordenar')
      if (valor === 'mais recentes') next.delete('ordem')
      else next.set('ordem', valor)
    }

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
            <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '115%', top: '-15%', objectFit: 'cover', opacity: 1 }} />
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
                    {produtos.length > 0 ? (
                      <>
                        Encontramos <strong style={{ fontWeight: 700 }}>{total !== null ? `${total.toLocaleString('pt-BR')} ${total === 1 ? 'camisa' : 'camisas'}` : 'camisas'}</strong>
                        {labelBusca && <> para <strong style={{ fontWeight: 700 }}>&quot;{labelBusca}&quot;</strong></>}
                      </>
                    ) : (
                      <>
                        Nenhuma camisa encontrada
                        {labelBusca && <> para <strong style={{ fontWeight: 700 }}>&quot;{labelBusca}&quot;</strong></>}
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
                  {produtos.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <p style={{ fontSize: 14, color: '#000', letterSpacing: '-0.14px', lineHeight: 1.2, whiteSpace: 'nowrap' as const }}>Ordenar por</p>
                      <div style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', cursor: 'pointer', position: 'relative' as const }}>
                        <select
                          value={ordemUrl}
                          onChange={e => alterarOrdenacao(e.target.value)}
                          style={{ fontWeight: 700, fontSize: 12, color: '#62748c', letterSpacing: '-0.24px', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', appearance: 'none' as const, paddingRight: 24 }}
                        >
                          <option>mais recentes</option>
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
            {!loading && (paginaParam > 1 || temProxima) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 112 }}>
                {paginaParam > 1 && (
                  <button onClick={() => irParaPagina(paginaParam - 1)} style={{ minWidth: 92, height: 36, borderRadius: 8, border: '1px solid #fff', background: '#ecebf0', color: '#444', fontSize: 12, fontWeight: 700, letterSpacing: '-0.12px', cursor: 'pointer', fontFamily: 'Onest, sans-serif', padding: '0 14px' }}>
                    anterior
                  </button>
                )}
                <span style={{ minWidth: 34, height: 34, borderRadius: 8, background: '#550fed', color: '#ebe8f2', fontSize: 12, fontWeight: 700, fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {paginaParam}
                </span>
                {temProxima && (
                  <button onClick={() => irParaPagina(paginaParam + 1)} style={{ minWidth: 92, height: 36, borderRadius: 8, border: '1px solid #fff', background: '#ecebf0', color: '#444', fontSize: 12, fontWeight: 700, letterSpacing: '-0.12px', cursor: 'pointer', fontFamily: 'Onest, sans-serif', padding: '0 14px' }}>
                    próxima
                  </button>
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
