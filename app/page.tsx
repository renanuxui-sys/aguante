'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import { supabase } from '@/lib/supabase'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'
import type { Produto } from '@/types'

const imgCamisas       = "/assets/img-hero.png"
const imgBgHero        = "/assets/bg-hero.png"
const imgSearchIcon    = "/assets/ico-search.svg"
const imgIconSearch    = "/assets/search-normal.svg"
const imgIconMagic     = "/assets/magic-star.svg"
const imgIconLightning = "/assets/Vector.svg"
const imgIconGrid      = "/assets/element-plus.svg"
const imgChevronRight  = "/assets/chevron-right.svg"
const CLUBE_PREFERENCIA_STORAGE_KEY = 'aguante_clube_preferencia'
const CLUBE_PREFERENCIA_EVENT = 'aguante:clube-preferencia'

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
    <section style={{ background: '#f5f5f5', paddingBottom: 56 }}>
      <div className="ag-container">
        <div className="ag-section-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap' as const, gap: 32 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: '#282828', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
            {titulo}
          </h2>
          {/* Ver todas — 18px com chevron-right.svg */}
          <button
            className="ag-section-link"
            onClick={() => router.push(linkTodas)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#282828', fontFamily: 'Onest, sans-serif', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '-0.02em' }}
          >
            <span className="ag-ver-todas-txt">ver todos</span>
            <img src={imgChevronRight} alt="" style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <div className="ag-cards">
          {produtos.map(p => <CardProduto key={p.id} produto={p} />)}
        </div>
      </div>
    </section>
  )
}

function SecaoCopaDoMundo({ produtos }: { produtos: Produto[] }) {
  const router = useRouter()
  if (produtos.length === 0) return null
  return (
    <section className="ag-copa-section" style={{ background: '#ecebf0', padding: '88px 0' }}>
      <div className="ag-container">
        <div className="ag-section-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, marginBottom: 24 }}>
          <div style={{ maxWidth: 620 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, color: '#282828', letterSpacing: '-0.02em', marginBottom: 8 }}>🌍 Copa do Mundo</h2>
            <p style={{ fontWeight: 400, fontSize: 16, lineHeight: 1.2, color: '#4a4845', letterSpacing: '-0.01em' }}>A copa está chegando e te ajudamos a encontrar as camisas das seleções do mundo todo.</p>
          </div>
          <button
            className="ag-section-link"
            onClick={() => router.push('/search?q=Seleção')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#282828', fontFamily: 'Onest, sans-serif', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '-0.02em', flexShrink: 0, padding: 0, marginBottom: 2 }}
          >
            <span className="ag-ver-todas-txt">ver todas</span>
            <img src={imgChevronRight} alt="" style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <div className="ag-cards ag-copa-card-grid">
          {produtos.map(p => <CardProduto key={`copa-${p.id}`} produto={p} />)}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const router = useRouter()
  const [query, setQuery]         = useState('')
  const [novidades, setNovidades] = useState<Produto[]>([])
  const [produtosParaVoce, setProdutosParaVoce] = useState<Produto[]>([])
  const [selecoes, setSelecoes] = useState<Produto[]>([])
  const [clubePreferido, setClubePreferido] = useState('')
  const [emAlta, setEmAlta]       = useState<Produto[]>([])
  const [anos80, setAnos80]       = useState<Produto[]>([])
  const [clubes, setClubes]       = useState<Clube[]>([])
  const [totalProdutos, setTotalProdutos] = useState<number | null>(null)
  const [novosHoje, setNovosHoje] = useState<number | null>(null)
  const [isMobile, setIsMobile]   = useState(false)
  const [clubesManualScroll, setClubesManualScroll] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    const updateMobile = () => setIsMobile(media.matches)
    updateMobile()
    media.addEventListener('change', updateMobile)

    supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true)
      .then(({ count }) => setTotalProdutos(count))

    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    supabase.from('produtos').select('id', { count: 'exact', head: true })
      .eq('ativo', true).gte('created_at', ontem)
      .then(({ count }) => setNovosHoje(count))

    supabase.from('produtos').select(PRODUCT_CARD_SELECT).eq('ativo', true)
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setNovidades(embaralhar(data).slice(0, 6)) })

    supabase.from('clubes_com_total_anuncios').select('nome,total_anuncios')
      .eq('ativo', true)
      .eq('categoria', 'Seleções')
      .gt('total_anuncios', 0)
      .order('ordem', { ascending: true })
      .then(async ({ data, error }) => {
        if (error || !data?.length) {
          setSelecoes([])
          return
        }

        const nomesSelecoes = data.map(clube => clube.nome)
        const { data: produtosSelecoes } = await supabase.from('produtos')
          .select(PRODUCT_CARD_SELECT)
          .eq('ativo', true)
          .in('clube', nomesSelecoes)
          .order('views', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(50)

        setSelecoes(embaralhar(produtosSelecoes || []))
      })

    supabase.from('produtos').select(PRODUCT_CARD_SELECT).eq('ativo', true)
      .order('views', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setEmAlta(embaralhar(data)) })

    supabase.from('produtos').select(PRODUCT_CARD_SELECT).eq('ativo', true)
      .gte('ano', '1980').lte('ano', '1989').limit(20)
      .then(({ data }) => { if (data) setAnos80(embaralhar(data).slice(0, 6)) })

    supabase.from('clubes').select('id, nome, slug, escudo_url')
      .eq('pais', 'Brasil').eq('destaque', true).eq('ativo', true)
      .order('ordem', { ascending: true })
      .then(({ data }) => { if (data) setClubes(data) })

    return () => media.removeEventListener('change', updateMobile)
  }, [])

  useEffect(() => {
    function carregarProdutosParaClube(clube: string | null) {
      if (!clube || clube === 'nao_escolheu') {
        setClubePreferido('')
        setProdutosParaVoce([])
        return
      }

      setClubePreferido(clube)
      supabase.from('produtos').select(PRODUCT_CARD_SELECT).eq('ativo', true).eq('clube', clube)
        .order('views', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(30)
        .then(({ data }) => setProdutosParaVoce(embaralhar(data || []).slice(0, isMobile ? 6 : 5)))
    }

    carregarProdutosParaClube(localStorage.getItem(CLUBE_PREFERENCIA_STORAGE_KEY))

    const atualizarPorStorage = (event: StorageEvent) => {
      if (event.key === CLUBE_PREFERENCIA_STORAGE_KEY) carregarProdutosParaClube(event.newValue)
    }
    const atualizarPorEvento = (event: Event) => {
      carregarProdutosParaClube((event as CustomEvent<string>).detail)
    }

    window.addEventListener('storage', atualizarPorStorage)
    window.addEventListener(CLUBE_PREFERENCIA_EVENT, atualizarPorEvento)

    return () => {
      window.removeEventListener('storage', atualizarPorStorage)
      window.removeEventListener(CLUBE_PREFERENCIA_EVENT, atualizarPorEvento)
    }
  }, [isMobile])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const quantidadeDestaques = isMobile ? 6 : 5
  const emAltaVisiveis = emAlta.slice(0, isMobile ? 6 : 10)

  const totalFmt = totalProdutos !== null ? totalProdutos.toLocaleString('pt-BR') : '...'
  const novosFmt = novosHoje !== null ? novosHoje.toLocaleString('pt-BR') : '...'

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-card { width: 100%; min-height: 325px; height: 100%; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; margin-bottom: 32px; }
        .ag-card:hover { transform: translateY(-3px); }
        .ag-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; align-items: stretch; }
        .ag-copa-card-grid .ag-card { margin-bottom: 0; }
        .ag-copa-section { margin-bottom: 88px; }
        .ag-cta-form { display: flex; gap: 16px; align-items: flex-end; width: 100%; }
        .ag-hero-img { display: block; }
        .ag-hero-stats-inline { display: none; }
        .ag-hero-blocos { display: flex; }
        .ag-clubes-grid { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .ag-clubes-mobile-track { display: none; }
        .ag-ver-todas-txt { display: inline; }
        .ag-section-link { flex-shrink: 0; }
        @keyframes ag-clubes-slide {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .ag-ver-todas-txt { display: inline !important; }
          .ag-section-head { align-items: flex-end !important; flex-direction: row !important; justify-content: space-between !important; gap: 32px !important; }
          .ag-section-link { margin-bottom: 0 !important; }
          .ag-copa-section { margin-bottom: 56px; }
          .ag-cards { grid-template-columns: repeat(2,1fr) !important; }
          .ag-card { width: 100% !important; height: auto !important; min-height: 112px; }
          .ag-cta-form { flex-direction: column !important; }

          /* Hero mobile */
          .ag-hero-img { display: none !important; }
          .ag-hero-infos { width: 100% !important; max-width: none !important; display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .ag-hero-infos > div:first-child { margin-left: auto !important; margin-right: auto !important; }
          .ag-hero-infos h1 { text-align: center !important; }
          .ag-hero-infos p { text-align: center !important; margin-left: auto !important; margin-right: auto !important; }
          .ag-hero-stats-inline { display: flex !important; }
          .ag-hero-blocos { display: none !important; }
          .ag-hero-form { width: 100% !important; }
          .ag-hero-search { width: 100% !important; max-width: none !important; padding: 12px 14px 12px 24px !important; border-radius: 26px !important; }
          .ag-hero-search input { font-size: 16px !important; }
          .ag-hero-busca-btn { width: 64px !important; height: 64px !important; min-width: 64px !important; padding: 0 !important; border-radius: 22px !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 0 !important; }
          .ag-hero-busca-btn img { width: 22px !important; height: 22px !important; display: block !important; flex: 0 0 auto !important; }
          .ag-hero-busca-txt { display: none !important; }

          /* Clubes em scroll horizontal */
          .ag-clubes-wrapper {
            margin: 0 -24px !important;
            overflow: hidden !important;
          }
          .ag-clubes-wrapper.manual {
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            touch-action: pan-x;
          }
          .ag-clubes-wrapper.manual::-webkit-scrollbar {
            display: none;
          }
          .ag-clubes-grid {
            display: none !important;
          }
          .ag-clubes-mobile-track {
            display: flex !important;
            width: max-content !important;
            animation: ag-clubes-slide 32s linear infinite !important;
            will-change: transform;
          }
          .ag-clubes-mobile-set {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 0 8px 8px 24px;
            flex-shrink: 0;
          }
          .ag-clubes-mobile-set + .ag-clubes-mobile-set { padding-left: 8px; }
          .ag-clubes-mobile-set button { flex-shrink: 0 !important; }
          .ag-clubes-wrapper.manual .ag-clubes-mobile-track {
            animation: none !important;
            transform: none !important;
          }
          .ag-clubes-wrapper.manual .ag-clubes-mobile-set[aria-hidden="true"] {
            display: none !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .ag-cards { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
      `}</style>

      <main style={{ fontFamily: 'Onest, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

        <Navbar />

        {/* ══ HERO ══ */}
        <section style={{ paddingTop: 76, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 700, zIndex: 0, pointerEvents: 'none' }}>
            <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, #f5f5f5)' }} />
          </div>

          <div className="ag-container" style={{ paddingTop: 75, paddingBottom: 40, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 48, justifyContent: 'space-between' }}>

            {/* Coluna esquerda — infos */}
            <div className="ag-hero-infos" style={{ maxWidth: 540 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(200,196,213,0.56)', border: '0.76px solid rgba(255,255,255,0.38)', borderRadius: 55.54, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: '4px 8px', fontSize: 12, fontWeight: 300, color: '#000', letterSpacing: '-0.12px', textTransform: 'uppercase' as const, marginBottom: 20, width: 'fit-content', lineHeight: 1.5 }}>
                O BUSCADOR DO COLECIONADOR
              </div>
              <h1 style={{ fontWeight: 300, fontSize: 52, lineHeight: 1.1, letterSpacing: '-0.06em', color: '#282828', marginBottom: 20, fontFamily: 'Onest, sans-serif' }}>
                Onde a{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}>paixão</span>
                {' '}pelo futebol vira{' '}
                <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}>coleção.</span>
              </h1>
              <p style={{ fontWeight: 300, fontSize: 16, color: '#000000', maxWidth: 340, marginBottom: 40, letterSpacing: '-0.03em', lineHeight: 1.5 }}>
                A maneira mais inteligente de descobrir camisas de futebol colecionáveis.
              </p>

              <form onSubmit={handleSearch} className="ag-hero-form">
                <div className="ag-hero-search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f5f5f5', border: '1.76px solid white', borderRadius: 24, padding: '16px 16px 16px 32px', maxWidth: 611, boxShadow: '0px 3.52px 8.8px rgba(183,181,203,0.31), 0px 17.6px 17.6px rgba(192,192,192,0.27), 0px 36.96px 22.88px rgba(192,192,192,0.16)' }}>
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: camisa do flamengo 1989" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.3)', background: 'transparent', letterSpacing: '-0.01em', fontFamily: 'Onest, sans-serif', minWidth: 0 }} />
                  <button type="submit" className="ag-btn-buscar ag-hero-busca-btn" style={{ color: '#fff', fontWeight: 700, fontSize: 14, padding: '16px 48px', borderRadius: 16, cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'Onest, sans-serif', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={imgSearchIcon} alt="" style={{ width: 16, height: 16, filter: 'brightness(0) invert(1)' }} />
                    <span className="ag-hero-busca-txt">buscar</span>
                  </button>
                </div>
              </form>

              {/* Stats inline — só mobile */}
              <div className="ag-hero-stats-inline" style={{ flexDirection: 'column', gap: 8, marginTop: 20 }}>
                <p style={{ textAlign:'center', fontSize: 14, color: '#282828', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
                  <strong style={{ color: '#550fed', fontWeight: 700 }}>{novosFmt} {novosHoje === 1 ? 'novo anúncio' : 'novos anúncios'}</strong> encontrados hoje.
                </p>
                <p style={{ textAlign:'center', fontSize: 14, color: '#282828', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
                  <strong style={{ color: '#550fed', fontWeight: 700 }}>{totalFmt} camisas</strong> encontradas em diversos sites.
                </p>
              </div>

              {/* Blocos "encontramos" — só desktop */}
              <div className="ag-hero-blocos" style={{ gap: 32, marginTop: 32 }}>
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

            {/* Coluna direita — foto + stats (só desktop) */}
            <div className="ag-hero-img" style={{ position: 'relative', width: 500, height: 545, flexShrink: 0, overflow: 'visible' }}>
              <img src={imgCamisas} alt="Camisas colecionáveis" style={{ position: 'absolute', right: 0, top: 0, width: 381, height: 545, objectFit: 'cover', objectPosition: 'center top', borderRadius: 12 }} />
              <div style={{ position: 'absolute', left: 59, top: 477, width: 280, height: 42, background: 'rgba(0,0,0,0.10)', borderRadius: '50%', filter: 'blur(20px)', zIndex: 1 }} />

              <div style={{ position: 'absolute', left: 56, top: 261, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', background: 'rgba(255,255,255,0.88)', borderTop: '1px solid white', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '8px 12px 36px rgba(0,0,0,0.08)', zIndex: 10, width: 278 }}>
                <div style={{ background: '#745cff', borderRadius: 8, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={imgIconLightning} alt="" style={{ width: 24, height: 24 }} />
                </div>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  <strong style={{ color: '#550fed', fontWeight: 700 }}>{novosFmt} {novosHoje === 1 ? 'novo anúncio' : 'novos anúncios'} </strong>
                  <span style={{ fontWeight: 400 }}>encontrados nas últimas 24h.</span>
                </p>
              </div>

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

        {/* ══ CLUBES ══ */}
        {clubes.length > 0 && (
          <section style={{ background: '#f5f5f5', paddingTop: 24, paddingBottom: 88 }}>
            <div className="ag-container">
              <p style={{ fontSize: 18, color: '#282828', letterSpacing: '-0.05em', marginBottom: 28, textAlign: 'center' as const }}>
                Os <strong>mais populares</strong> do Brasil
              </p>
              <div
                className={`ag-clubes-wrapper${clubesManualScroll ? ' manual' : ''}`}
                onPointerDown={() => setClubesManualScroll(true)}
                onTouchStart={() => setClubesManualScroll(true)}
                onWheel={event => {
                  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) setClubesManualScroll(true)
                }}
              >
                <div className="ag-clubes-grid">
                  {clubes.map(c => (
                    <button key={c.id} onClick={() => router.push(`/search?q=${c.nome}`)} title={c.nome} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.escudo_url
                        ? <img src={c.escudo_url} alt={c.nome} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 12, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>{c.nome}</span>
                      }
                    </button>
                  ))}
                </div>
                <div className="ag-clubes-mobile-track">
                  {[0, 1].map(copia => (
                    <div key={copia} className="ag-clubes-mobile-set" aria-hidden={copia === 1 ? true : undefined}>
                      {clubes.map(c => (
                        <button key={`${c.id}-${copia}`} onClick={() => router.push(`/search?q=${c.nome}`)} title={c.nome} tabIndex={copia === 1 ? -1 : undefined} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {c.escudo_url
                            ? <img src={c.escudo_url} alt={c.nome} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                            : <span style={{ fontSize: 12, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>{c.nome}</span>
                          }
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {clubePreferido && (
          <SecaoCards
            titulo="Produtos para você"
            produtos={produtosParaVoce}
            linkTodas={`/search?q=${encodeURIComponent(clubePreferido)}&ordenar=mais-vistos`}
          />
        )}
        <SecaoCopaDoMundo produtos={selecoes.slice(0, quantidadeDestaques)} />
        <SecaoCards titulo="Novidades encontradas" produtos={novidades.slice(0, quantidadeDestaques)} linkTodas="/search" />
        <SecaoCards titulo="Camisas dos anos 80" produtos={anos80.slice(0, quantidadeDestaques)} linkTodas="/search?decada=80" />

        {/* Em alta */}
        {emAlta.length > 0 && (
          <section style={{ background: '#f5f5f5', paddingBottom: 80 }}>
            <div className="ag-container">
              <div className="ag-section-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C9 7 6 9 6 13a6 6 0 0012 0c0-4-3-6-6-11z" fill="#FF4D00" opacity="0.9"/>
                    <path d="M12 8c-1 3-3 4-3 7a3 3 0 006 0c0-3-2-4-3-7z" fill="#FFB347"/>
                  </svg>
                  <h2 style={{ fontWeight: 700, fontSize: 20, color: '#282828', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Em alta no momento
                   </h2>
                </div>
                <button
                  className="ag-section-link"
                  onClick={() => router.push('/search?ordenar=mais-vistos')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#282828', fontFamily: 'Onest, sans-serif', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '-0.02em' }}
                >
                  <span className="ag-ver-todas-txt">ver todos</span>
                  <img src={imgChevronRight} alt="" style={{ width: 20, height: 20 }} />
                </button>
              </div>
              <div className="ag-cards">
                {emAltaVisiveis.map(p => <CardProduto key={`alta-${p.id}`} produto={p} />)}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </main>
    </>
  )
}
