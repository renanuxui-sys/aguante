'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import { supabase } from '@/lib/supabase'
import type { Produto } from '@/types'

const imgBgHero    = "https://www.figma.com/api/mcp/asset/edd4f565-9eae-4473-819e-86ec35f69e85"
const imgArrowLeft = "https://www.figma.com/api/mcp/asset/3fd80195-aaa1-496d-8fe9-004e1e8272cf"
const imgChevronDown = "https://www.figma.com/api/mcp/asset/c5b80643-ab70-4381-94cd-3496ac846c89"

const MOCK: Produto[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  titulo: ['Camisa Flamengo Adidas', 'Camisa Internacional Perusso', 'Camisa Santos Umbro', 'Camisa Grêmio Topper', 'Camisa Corinthians Penalty'][i % 5],
  ano: ['1994', '1985', '1998', '1996', '2000'][i % 5],
  preco: [2500, 1800, 900, 1200, 750][i % 5],
  imagem_url: null,
  link_original: '#',
  fonte_nome: ['Mercado Livre', 'OLX', 'Enjoei'][i % 3],
  fonte_url: '',
  clube: ['Flamengo', 'Internacional', 'Santos', 'Grêmio', 'Corinthians'][i % 5],
  tags: [],
  de_jogo: i % 4 === 0,
  novidade: i % 3 === 0,
  alta_procura: i % 5 === 0,
  created_at: '',
  updated_at: '',
}))

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [ordenar, setOrdenar] = useState('menor preço')
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 20
  const TOTAL_PAGINAS = 8

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('produtos').select('*')
    if (q) query = query.ilike('titulo', `%${q}%`)
    if (ordenar === 'menor preço') query = query.order('preco', { ascending: true })
    else if (ordenar === 'maior preço') query = query.order('preco', { ascending: false })
    else query = query.order('created_at', { ascending: false })
    query.range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1)
      .then(({ data }) => { setProdutos(data?.length ? data : MOCK); setLoading(false) })
  }, [q, ordenar, pagina])

  // Divide em linhas de 5
  const rows: Produto[][] = []
  for (let i = 0; i < produtos.length; i += 5) rows.push(produtos.slice(i, i + 5))

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

        {/* ══ HEADER DA BUSCA ══ */}
        <section style={{ paddingTop: 76, position: 'relative', minHeight: 290, background: '#f5f5f5' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '115%', top: '-15%', objectFit: 'cover', opacity: 0.4 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(245,245,245,0.7) 80%, #f5f5f5 95%)' }} />
          </div>

          <div className="ag-container" style={{ position: 'relative', zIndex: 2, paddingTop: 86, paddingBottom: 40 }}>
            {/* Voltar */}
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', marginBottom: 16 }}>
              <img src={imgArrowLeft} alt="Voltar" style={{ width: 24, height: 24 }} />
            </button>

            {/* Título + ordenar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 32, color: '#000', letterSpacing: '-0.64px', whiteSpace: 'nowrap' as const }}>
                  Resultado da busca
                </p>
                {q && (
                  <p style={{ fontWeight: 300, fontSize: 24, color: '#000', letterSpacing: '-0.48px', lineHeight: 1.2, marginTop: 4 }}>
                    Encontramos <strong style={{ fontWeight: 700 }}>64 camisas</strong> na sua busca por{' '}
                    <strong style={{ fontWeight: 700 }}>"{q}"</strong>
                  </p>
                )}
              </div>

              {/* Ordenar por */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <p style={{ fontSize: 14, color: '#000', letterSpacing: '-0.14px', lineHeight: 1.2, whiteSpace: 'nowrap' as const }}>Ordenar por</p>
                <div style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', cursor: 'pointer', position: 'relative' as const }}>
                  <select
                    value={ordenar}
                    onChange={e => setOrdenar(e.target.value)}
                    style={{ fontWeight: 700, fontSize: 12, color: '#62748c', letterSpacing: '-0.24px', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', appearance: 'none' as const, paddingRight: 20 }}
                  >
                    <option>menor preço</option>
                    <option>maior preço</option>
                    <option>mais recente</option>
                  </select>
                  <img src={imgChevronDown} alt="" style={{ width: 14, height: 14, position: 'absolute' as const, right: 8, pointerEvents: 'none' as const }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ GRID DE PRODUTOS ══ */}
        <section style={{ background: '#f5f5f5', paddingBottom: 40 }}>
          <div className="ag-container">
            {loading ? (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 40 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{ width: 218, height: 325, background: '#ecebf0', borderRadius: 16 }} />
                ))}
              </div>
            ) : (
              rows.map((row, ri) => (
                <div key={ri} className="ag-card-row">
                  {row.map(p => <CardProduto key={p.id} produto={p} />)}
                </div>
              ))
            )}

            {/* ══ PAGINAÇÃO ══ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 112 }}>
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setPagina(n)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #fff', background: pagina === n ? '#550fed' : '#ecebf0', color: pagina === n ? '#ebe8f2' : '#444', fontSize: 12, fontWeight: 400, letterSpacing: '-0.12px', cursor: 'pointer', fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {n}
                </button>
              ))}
              <button style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #fff', background: '#ecebf0', color: '#444', fontSize: 12, cursor: 'pointer', fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>...</button>
              <button onClick={() => setPagina(TOTAL_PAGINAS)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #fff', background: '#ecebf0', color: '#444', fontSize: 12, cursor: 'pointer', fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>8</button>
            </div>
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