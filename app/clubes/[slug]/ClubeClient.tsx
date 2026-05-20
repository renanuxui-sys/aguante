'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import type { Produto } from '@/types'

const imgBgHero = '/assets/bg-hero.png'
const imgArrowLeft = '/assets/arrow-left.svg'
const imgChevronDown = '/assets/chevron-down.svg'
const imgFire = '/assets/fire-alt-solid.svg'
const POR_PAGINA = 20

type ClubeInfo = {
  nome: string
  slug: string
  descricao: string
}

type SearchData = {
  produtos: Produto[]
  total: number | null
  temProxima: boolean
}

type ClubeClientProps = {
  clube: ClubeInfo
  initialData: SearchData
}

type FiltroClube = {
  label: string
  params: Record<string, string>
  icon?: string
}

const filtros: FiltroClube[] = [
  { label: 'em alta', params: { ordenar: 'mais-vistos' }, icon: imgFire },
  { label: 'de jogo', params: { de_jogo: 'true' } },
  { label: 'Anos 70', params: { decada: '70' } },
  { label: 'Anos 80', params: { decada: '80' } },
  { label: 'Anos 90', params: { decada: '90' } },
  { label: 'Anos 2000', params: { decada: '2000' } },
]
const filtroKeys = ['ordenar', 'decada', 'de_jogo']

export default function ClubeClient({ clube, initialData }: ClubeClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const primeiraCarga = useRef(true)

  const decada = searchParams.get('decada')
  const ordenar = searchParams.get('ordenar')
  const ordemParam = searchParams.get('ordem')
  const deJogo = searchParams.get('de_jogo') === 'true'
  const paginaParam = Math.max(1, Number(searchParams.get('pagina') || '1') || 1)
  const ordemUrl = ordemParam || (ordenar === 'mais-vistos' ? 'mais vistos' : 'mais recentes')

  const [produtos, setProdutos] = useState<Produto[]>(initialData.produtos)
  const [total, setTotal] = useState<number | null>(initialData.total)
  const [loading, setLoading] = useState(false)

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
        params.set('clube', clube.nome)
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
      } catch {
        if (!ativo) return
        setProdutos([])
        setTotal(0)
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregarProdutos()

    return () => {
      ativo = false
    }
  }, [clube.nome, decada, ordenar, deJogo, ordemUrl, paginaParam])

  function filtroAtivo(params: Record<string, string>) {
    return Object.entries(params).every(([key, value]) => searchParams.get(key) === value)
  }

  function irParaUrl(params: URLSearchParams) {
    const qs = params.toString()
    router.push(qs ? `/clubes/${clube.slug}?${qs}` : `/clubes/${clube.slug}`)
  }

  function aplicarFiltro(params: Record<string, string>) {
    setLoading(true)
    const next = new URLSearchParams(searchParams.toString())
    const ativo = filtroAtivo(params)
    filtroKeys.forEach(key => next.delete(key))
    if (!ativo) Object.entries(params).forEach(([key, value]) => next.set(key, value))
    next.delete('pagina')
    irParaUrl(next)
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

    irParaUrl(next)
  }

  function irParaPagina(n: number) {
    setLoading(true)
    const next = new URLSearchParams(searchParams.toString())
    if (n <= 1) next.delete('pagina')
    else next.set('pagina', String(n))
    irParaUrl(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPaginas = total ? Math.ceil(total / POR_PAGINA) : 0
  const paginasVisiveis = (() => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, index) => index + 1)

    const paginas: Array<number | '...'> = [1]
    const inicio = Math.max(2, paginaParam - 1)
    const fim = Math.min(totalPaginas - 1, paginaParam + 1)

    if (inicio > 2) paginas.push('...')
    for (let pagina = inicio; pagina <= fim; pagina += 1) paginas.push(pagina)
    if (fim < totalPaginas - 1) paginas.push('...')
    paginas.push(totalPaginas)

    return paginas
  })()

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-card { width: 100%; min-height: 325px; height: 100%; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .ag-card:hover { transform: translateY(-3px); }
        .ag-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 40px; align-items: stretch; }
        .ag-clube-hero { max-width: 900px; }
        .ag-listing-head { display: flex; align-items: flex-start; flex-direction: column; gap: 28px; }
        .ag-title-row { display: flex; align-items: center; gap: 20px; }
        .ag-filter-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; width: 100%; }
        .ag-filter-tags-wrap { max-width: 100%; min-width: 0; position: relative; }
        .ag-filter-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ag-filter-tag { display: inline-flex; align-items: center; gap: 8px; min-height: 30px; padding: 4px 12px; border-radius: 8px; border: none; background: #fff; color: #000; font: 400 14px/1.2 Onest, sans-serif; letter-spacing: -0.14px; cursor: pointer; }
        .ag-filter-tag-active { background: #550fed; color: #fff; }
        @media (max-width: 768px) {
          .ag-cards { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px; }
          .ag-card { height: auto !important; min-height: 112px; }
          .ag-title-row { gap: 12px; }
          .ag-clube-title { font-size: 30px !important; white-space: normal !important; }
          .ag-clube-description { font-size: 17px !important; }
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

        <section style={{ paddingTop: 76, position: 'relative', minHeight: 380, background: '#f5f5f5' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '115%', top: '-15%', objectFit: 'cover', opacity: 1 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 44%, rgba(245,245,245,0.75) 78%, #f5f5f5 96%)' }} />
          </div>

          <div className="ag-container" style={{ position: 'relative', zIndex: 2, paddingTop: 48, paddingBottom: 42 }}>
            <div className="ag-listing-head">
              <div className="ag-clube-hero">
                <div>
                  <button onClick={() => router.back()} aria-label="Voltar" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0, marginBottom: 18 }}>
                    <img src={imgArrowLeft} alt="" style={{ width: 24, height: 24 }} />
                  </button>
                  <div className="ag-title-row">
                    <h1 className="ag-clube-title" style={{ fontWeight: 700, fontSize: 42, color: '#000', letterSpacing: '-0.02em', lineHeight: 1.05, margin: 0 }}>
                      {clube.nome}
                    </h1>
                  </div>
                  <p className="ag-clube-description" style={{ fontWeight: 300, fontSize: 20, color: '#000', letterSpacing: '-0.02em', lineHeight: 1.45, marginTop: 24, maxWidth: 760 }}>
                    {clube.descricao}
                  </p>
                  {!loading && (
                    <p className="ag-result-summary" style={{ fontWeight: 300, fontSize: 22, color: '#000', letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 30 }}>
                      {produtos.length > 0 ? (
                        <>
                          Encontramos <strong style={{ fontWeight: 700 }}>{total !== null ? `${total.toLocaleString('pt-BR')} ${total === 1 ? 'camisa' : 'camisas'}` : 'camisas'}</strong> do <strong style={{ fontWeight: 700 }}>{clube.nome}</strong>
                        </>
                      ) : (
                        <>Nenhuma camisa encontrada do <strong style={{ fontWeight: 700 }}>{clube.nome}</strong></>
                      )}
                    </p>
                  )}
                </div>
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
                      <p style={{ fontSize: 14, color: '#000', letterSpacing: '-0.14px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Ordenar por</p>
                      <div style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', cursor: 'pointer', position: 'relative' }}>
                        <select
                          value={ordemUrl}
                          onChange={e => alterarOrdenacao(e.target.value)}
                          style={{ fontWeight: 700, fontSize: 12, color: '#62748c', letterSpacing: '-0.24px', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', appearance: 'none', paddingRight: 24 }}
                        >
                          <option>mais recentes</option>
                          <option>menor preço</option>
                          <option>maior preço</option>
                          <option>mais vistos</option>
                        </select>
                        <img src={imgChevronDown} alt="" style={{ width: 16, height: 16, position: 'absolute', right: 8, pointerEvents: 'none' }} />
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

            {!loading && totalPaginas > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 112 }}>
                {paginaParam > 1 && (
                  <button onClick={() => irParaPagina(paginaParam - 1)} style={{ minWidth: 92, height: 36, borderRadius: 8, border: '1px solid #fff', background: '#ecebf0', color: '#444', fontSize: 12, fontWeight: 700, letterSpacing: '-0.12px', cursor: 'pointer', fontFamily: 'Onest, sans-serif', padding: '0 14px' }}>
                    anterior
                  </button>
                )}
                {paginasVisiveis.map((pagina, index) => (
                  pagina === '...' ? (
                    <span key={`ellipsis-${index}`} style={{ minWidth: 22, height: 34, color: '#62748c', fontSize: 12, fontWeight: 700, fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={pagina}
                      onClick={() => irParaPagina(pagina)}
                      aria-current={pagina === paginaParam ? 'page' : undefined}
                      style={{
                        minWidth: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid #fff',
                        background: pagina === paginaParam ? '#550fed' : '#ecebf0',
                        color: pagina === paginaParam ? '#ebe8f2' : '#444',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'Onest, sans-serif',
                        cursor: pagina === paginaParam ? 'default' : 'pointer',
                      }}
                    >
                      {pagina}
                    </button>
                  )
                ))}
                {paginaParam < totalPaginas && (
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
