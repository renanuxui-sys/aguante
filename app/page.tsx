'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import { supabase } from '@/lib/supabase'
import type { Produto } from '@/types'

const imgCamisas       = "https://www.figma.com/api/mcp/asset/37f72976-d9c6-4de3-9a14-8898be580edc"
const imgBgHero        = "https://www.figma.com/api/mcp/asset/edd4f565-9eae-4473-819e-86ec35f69e85"
const imgSearchIcon    = "https://www.figma.com/api/mcp/asset/6eb29aa3-0804-48ca-8949-6cfeaaaa2ec5"
const imgIconSearch    = "https://www.figma.com/api/mcp/asset/2fb5de4a-ff51-409e-868a-ee9cc9d110ff"
const imgIconMagic     = "https://www.figma.com/api/mcp/asset/88af6305-5c41-4643-bf8f-7279d8f8d38f"
const imgIconLightning = "https://www.figma.com/api/mcp/asset/6add553f-7b09-4ebe-9bf6-7da4520bad52"
const imgIconGrid      = "https://www.figma.com/api/mcp/asset/da34006e-ba1b-4195-ab60-fc2cb730fc50"

type Clube = {
  id: string
  nome: string
  slug: string
  escudo_url: string | null
}

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function SecaoCards({ titulo, produtos, linkTodas }: { titulo: string; produtos: Produto[]; linkTodas: string }) {
  const router = useRouter()
  if (produtos.length === 0) return null
  return (
    <section style={{ background: '#f5f5f5', paddingBottom: 112 }}>
      <div className="ag-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: '#282828', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
            {titulo}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="#62748c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </h2>
          <button onClick={() => router.push(linkTodas)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>
            Ver todas →
          </button>
        </div>
        <div className="ag-cards">
          {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const router = useRouter()
  const [query, setQuery]         = useState('')
  const [novidades, setNovidades] = useState<Produto[]>([])
  const [emAlta, setEmAlta]       = useState<Produto[]>([])
  const [anos80, setAnos80]       = useState<Produto[]>([])
  const [clubes, setClubes]       = useState<Clube[]>([])
  const [totalProdutos, setTotalProdutos] = useState<number | null>(null)
  const [novosHoje, setNovosHoje] = useState<number | null>(null)

  useEffect(() => {
    // Total de produtos no banco
    supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('ativo', true)
      .then(({ count }) => setTotalProdutos(count))

    // Novos nas últimas 24h
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    supabase.from('produtos').select('*', { count: 'exact', head: true })
      .eq('ativo', true).gte('created_at', ontem)
      .then(({ count }) => setNovosHoje(count))

    // Novidades — pega 30 mais recentes e embaralha 5 a cada refresh
    supabase.from('produtos').select('*').eq('ativo', true)
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setNovidades(embaralhar(data).slice(0, 5)) })

    // Em alta — mais visualizados
    supabase.from('produtos').select('*').eq('ativo', true)
      .order('views', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setEmAlta(data) })

    // Anos 80 — filtra por ano entre 1980-1989
    supabase.from('produtos').select('*').eq('ativo', true)
      .gte('ano', '1980').lte('ano', '1989').limit(20)
      .then(({ data }) => { if (data) setAnos80(embaralhar(data).slice(0, 5)) })

    // Clubes destaque para hero
    supabase.from('clubes').select('id, nome, slug, escudo_url')
      .eq('pais', 'Brasil').eq('destaque', true).eq('ativo', true)
      .order('ordem', { ascending: true })
      .then(({ data }) => { if (data) setClubes(data) })
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const emAltaLinha1 = emAlta.slice(0, 5)
  const emAltaLinha2 = emAlta.slice(5, 10)

  // Formatadores dos stats
  const totalFmt = totalProdutos !== null ? totalProdutos.toLocaleString('pt-BR') : '...'
  const novosFmt = novosHoje !== null ? novosHoje.toLocaleString('pt-BR') : '...'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-card { width: 218px; height: 325px; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .ag-card:hover { transform: translateY(-3px); }
        .ag-cards { display: grid; grid-template-columns: repeat(5, 218px); gap: 12px; }
        .ag-cta-form { display: flex; gap: 16px; align-items: flex-end; width: 100%; }
        @media (max-width: 768px) {
          .ag-cards { grid-template-columns: repeat(2,1fr) !important; }
          .ag-card { width: 100% !important; height: auto !important; }
          .ag-cta-form { flex-direction: column !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .ag-cards { grid-template-columns: repeat(3, 218px) !important; }
        }
      `}</style>

      <main style={{ fontFamily: 'Onest, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

        <Navbar />

        {/* ══ HERO ══ */}
        <section style={{ paddingTop: 76, position: 'relative', overflow: 'hidden', minHeight: 760 }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '120%', top: '-10%', objectFit: 'cover', opacity: 0.5 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(245,245,245,0) 0%, rgba(245,245,245,0) 55%, rgba(245,245,245,0.6) 75%, rgba(245,245,245,1) 90%)' }} />
          </div>

          <div className="ag-container" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 684, padding: '80px 24px', overflow: 'visible' }}>

            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', zIndex: 3, flexShrink: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(200,196,213,0.56)', border: '0.76px solid rgba(255,255,255,0.38)', borderRadius: 55.54, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: '4px 8px', fontSize: 12, fontWeight: 300, color: '#000', letterSpacing: '-0.12px', textTransform: 'uppercase' as const, marginBottom: 20, width: 'fit-content', lineHeight: 1.5 }}>
                O BUSCADOR DO COLECIONADOR
              </div>
              <h1 style={{ fontWeight: 300, fontSize: 52, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#282828', marginBottom: 20, fontFamily: 'Onest, sans-serif' }}>
                Onde a{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}>paixão</span>
                {' '}pelo futebol vira{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}>coleção.</span>
              </h1>
              <p style={{ fontWeight: 300, fontSize: 16, color: '#62748c', maxWidth: 340, marginBottom: 40, letterSpacing: '-0.01em', lineHeight: 1.5 }}>
                A maneira mais inteligente de descobrir camisas de futebol colecionáveis.
              </p>

              <form onSubmit={handleSearch}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f5f5f5', border: '1.76px solid white', borderRadius: 24, padding: '16px 16px 16px 32px', maxWidth: 611, boxShadow: '0px 3.52px 8.8px rgba(183,181,203,0.31), 0px 17.6px 17.6px rgba(192,192,192,0.27), 0px 36.96px 22.88px rgba(192,192,192,0.16)' }}>
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: camisa do flamengo 1989" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.3)', background: 'transparent', letterSpacing: '-0.01em', fontFamily: 'Onest, sans-serif', minWidth: 0 }} />
                  <button type="submit" className="ag-btn-buscar" style={{ color: '#fff', fontWeight: 700, fontSize: 14, padding: '16px 48px', borderRadius: 16, cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'Onest, sans-serif', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={imgSearchIcon} alt="" style={{ width: 16, height: 16, filter: 'brightness(0) invert(1)' }} />
                    buscar
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', gap: 32, marginTop: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 17 }}>
                  <div style={{ background: '#ebe8f2', borderRadius: 8, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={imgIconSearch} alt="" style={{ width: 24, height: 24 }} />
                  </div>
                  <p style={{ fontSize: 14, color: '#282828', letterSpacing: '-0.01em', lineHeight: 1.2, maxWidth: 201 }}>
                    <strong style={{ fontWeight: 700 }}>Encontramos camisas</strong>{' '}em diversos sites e marketplaces.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 17 }}>
                  <div style={{ background: '#ebe8f2', borderRadius: 8, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={imgIconMagic} alt="" style={{ width: 24, height: 24 }} />
                  </div>
                  <p style={{ fontSize: 14, color: '#282828', letterSpacing: '-0.01em', lineHeight: 1.2, maxWidth: 201 }}>
                    Mostramos só o que importa <strong style={{ fontWeight: 700 }}>para o colecionador.</strong>
                  </p>
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', width: 500, height: 545, flexShrink: 0, overflow: 'visible' }}>
              <img src={imgCamisas} alt="Camisas colecionáveis" style={{ position: 'absolute', right: 0, top: 0, width: 381, height: 545, objectFit: 'cover', objectPosition: 'center top', borderRadius: 12 }} />
              <div style={{ position: 'absolute', left: 59, top: 477, width: 280, height: 42, background: 'rgba(0,0,0,0.10)', borderRadius: '50%', filter: 'blur(20px)', zIndex: 1 }} />

              {/* Stat 1 — novos anúncios hoje (DINÂMICO) */}
              <div style={{ position: 'absolute', left: 56, top: 261, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', background: 'rgba(255,255,255,0.88)', borderTop: '1px solid white', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '8px 12px 36px rgba(0,0,0,0.08)', zIndex: 10, width: 278 }}>
                <img src={imgIconLightning} alt="" style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0 }} />
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  <strong style={{ color: '#550fed', fontWeight: 700 }}>{novosFmt} {novosHoje === 1 ? 'novo anúncio' : 'novos anúncios'} </strong>
                  <span style={{ fontWeight: 400 }}>encontrados nas últimas 24h.</span>
                </p>
              </div>

              {/* Stat 2 — total de camisas (DINÂMICO) */}
              <div style={{ position: 'absolute', left: 222, top: 380, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', background: 'rgba(255,255,255,0.88)', borderTop: '1px solid white', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '8px 12px 36px rgba(0,0,0,0.08)', zIndex: 10, width: 278 }}>
                <div style={{ background: '#745cff', borderRadius: 8, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={imgIconGrid} alt="" style={{ width: 24, height: 24 }} />
                </div>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  <strong style={{ color: '#550fed', fontWeight: 700 }}>{totalFmt} camisas </strong>
                  <span style={{ fontWeight: 400 }}>encontradas em diversos sites.</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CLUBES — atalhos da hero ══ */}
        {clubes.length > 0 && (
          <section style={{ background: '#f5f5f5', paddingTop: 50, paddingBottom: 50 }}>
            <div className="ag-container">
              <p style={{ fontSize: 18, color: '#282828', letterSpacing: '-0.05em', marginBottom: 28, textAlign: 'center' as const }}>
                Os <strong>mais populares</strong> do Brasil
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
                {clubes.map(c => (
                  <button key={c.id} onClick={() => router.push(`/search?q=${c.nome}`)} title={c.nome} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.escudo_url
                      ? <img src={c.escudo_url} alt={c.nome} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 12, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>{c.nome}</span>
                    }
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <SecaoCards titulo="Novidades encontradas" produtos={novidades} linkTodas="/search" />

        <SecaoCards titulo="Camisas dos anos 80" produtos={anos80} linkTodas="/search?decada=80" />

        {/* Em alta — 2 linhas */}
        {emAlta.length > 0 && (
          <section style={{ background: '#f5f5f5', paddingBottom: 112 }}>
            <div className="ag-container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C9 7 6 9 6 13a6 6 0 0012 0c0-4-3-6-6-11z" fill="#FF4D00" opacity="0.9"/>
                    <path d="M12 8c-1 3-3 4-3 7a3 3 0 006 0c0-3-2-4-3-7z" fill="#FFB347"/>
                  </svg>
                  <h2 style={{ fontWeight: 700, fontSize: 20, color: '#282828', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Em alta no momento
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="#62748c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </h2>
                </div>
                <button onClick={() => router.push('/search?ordenar=mais-vistos')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>
                  Ver todas →
                </button>
              </div>
              <div className="ag-cards" style={{ marginBottom: 12 }}>
                {emAltaLinha1.map(p => <CardProduto key={`h1-${p.id}`} produto={p} />)}
              </div>
              {emAltaLinha2.length > 0 && (
                <div className="ag-cards">
                  {emAltaLinha2.map(p => <CardProduto key={`h2-${p.id}`} produto={p} />)}
                </div>
              )}
            </div>
          </section>
        )}

        <Footer />

      </main>
    </>
  )
}
