'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const imgLogo       = "https://www.figma.com/api/mcp/asset/3246a130-14a7-437c-859c-0a4bfbaab46d"
const imgNavChevron = "https://www.figma.com/api/mcp/asset/8fcccfaa-c506-49db-93ca-b43a8d022ff0"
const imgNavSearch  = "https://www.figma.com/api/mcp/asset/e71c8759-36e2-4d85-abaa-28f807b894bf"

export const TODOS_CLUBES = [
  'Flamengo','Corinthians','Palmeiras','Atlético-MG','Athletico-PR','Fortaleza',
  'Bahia','Botafogo','Cruzeiro','Fluminense','Grêmio','Internacional',
  'São Paulo','Vasco','Santos','Vitória',
]

type Clube = {
  id: string
  nome: string
  slug: string
  escudo_url: string | null
  total_anuncios: number
}

const LIMITE_INICIAL = 8

export default function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled]       = useState(false)
  const [submenu, setSubmenu]         = useState(false)
  const [menuMobile, setMenuMobile]   = useState(false)
  const [query, setQuery]             = useState('')
  const [clubes, setClubes]           = useState<Clube[]>([])
  const [expandido, setExpandido]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 80) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    async function carregarClubes() {
      const { data: listaClubes } = await supabase
        .from('clubes')
        .select('id, nome, slug, escudo_url')
        .eq('pais', 'Brasil')
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (!listaClubes) return

      // Conta produtos ativos para cada clube em paralelo
      const contagens = await Promise.all(
        listaClubes.map(async (c) => {
          const { count } = await supabase
            .from('produtos')
            .select('*', { count: 'exact', head: true })
            .eq('clube', c.nome)
            .eq('ativo', true)
          return { ...c, total_anuncios: count || 0 }
        })
      )

      // Ordena por quantidade (maior primeiro)
      contagens.sort((a, b) => b.total_anuncios - a.total_anuncios)
      setClubes(contagens)
    }

    carregarClubes()
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
      inputRef.current?.blur()
    }
  }

  const clubesVisiveis = expandido ? clubes : clubes.slice(0, LIMITE_INICIAL)
  const temMais = clubes.length > LIMITE_INICIAL

  const navStyle: React.CSSProperties = scrolled
    ? {
        position: 'fixed', top: 16,
        left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 80px)', maxWidth: 1060,
        height: 70,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 24,
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', justifyContent: 'space-between',
        zIndex: 100,
        transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
      }
    : {
        position: 'fixed', top: 0, left: 0, right: 0, width: '100%',
        height: 76,
        background: 'transparent',
        border: 'none', borderBottom: '1px solid #e0dee7', borderRadius: 0,
        boxShadow: 'none',
        display: 'flex', alignItems: 'center',
        padding: '0 calc((100% - 1140px) / 2 + 24px)',
        justifyContent: 'space-between',
        zIndex: 100,
        transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
      }

  const submenuTop = scrolled ? 16 + 70 + 8 : 76

  return (
    <>
      <nav style={navStyle}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img src={imgLogo} alt="Aguante" style={{ width: scrolled ? 120 : 136, height: scrolled ? 44 : 55, display: 'block', transition: 'all 350ms cubic-bezier(0.4,0,0.2,1)' }} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: scrolled ? 110 : 40 }}>
          <div className="ag-nav-links">
            <Link href="/" className="ag-link-black" style={{ fontSize: 12, letterSpacing: '-0.24px', lineHeight: '24px', whiteSpace: 'nowrap' }}>
              Conheça Aguante
            </Link>

            <div style={{ position: 'relative' }} onMouseEnter={() => setSubmenu(true)} onMouseLeave={() => setSubmenu(false)}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', fontSize: 12, letterSpacing: '-0.24px', display: 'flex', alignItems: 'center', gap: 2, fontFamily: 'Onest, sans-serif', padding: '26px 0', whiteSpace: 'nowrap', transition: 'color 150ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#550fed')}
                onMouseLeave={e => (e.currentTarget.style.color = '#000')}
              >
                Explore camisas
                <img src={imgNavChevron} alt="" style={{ width: 18, height: 18, transition: 'transform 200ms ease' }} />
              </button>
            </div>
          </div>

          <div className="ag-nav-pill-wrap">
            <form onSubmit={handleSearch}>
              <div
                className="ag-search-pill"
                style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', border: '1px solid #e0dee7', borderRadius: scrolled ? 12 : 16, padding: scrolled ? '8px 12px' : '11px 16px', width: 286, cursor: 'text', gap: 8 }}
                onClick={() => inputRef.current?.focus()}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="O que você procura?"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, fontWeight: 300, color: '#444', letterSpacing: '-0.12px', fontFamily: 'Onest, sans-serif', minWidth: 0 }}
                />
                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'transform 150ms ease' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img src={imgNavSearch} alt="Buscar" style={{ width: 20, height: 20 }} />
                </button>
              </div>
            </form>
          </div>
        </div>

        <button className="ag-hamburger" onClick={() => setMenuMobile(!menuMobile)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* Submenu */}
      {submenu && (
        <div
          style={{ position: 'fixed', top: submenuTop, left: 0, right: 0, background: '#fff', boxShadow: '0 20px 68px rgba(0,0,0,0.1)', zIndex: 99, padding: '32px 0 40px', transition: 'top 350ms cubic-bezier(0.4,0,0.2,1)' }}
          onMouseEnter={() => setSubmenu(true)}
          onMouseLeave={() => { setSubmenu(false); setExpandido(false) }}
        >
          <div className="ag-container">
            <p style={{ fontWeight: 700, fontSize: 32, color: '#282828', letterSpacing: '-0.05em', marginBottom: 24 }}>Clubes Brasileiros</p>
            <div className="ag-submenu-grid">
              {clubesVisiveis.map(clube => (
                <div
                  key={clube.id}
                  className="ag-submenu-item"
                  onClick={() => { setSubmenu(false); setExpandido(false); router.push(`/search?q=${clube.nome}`) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: 'pointer' }}
                >
                  {clube.escudo_url && (
                    <img src={clube.escudo_url} alt={clube.nome} style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} />
                  )}
                  <p style={{ fontSize: 16, color: '#282828', letterSpacing: '-0.05em' }}>{clube.nome}</p>
                  <span style={{ background: '#dfdfdf', borderRadius: 8, padding: '2px 6px', fontSize: 12, color: '#550fed', fontWeight: 700, marginLeft: 'auto' }}>
                    {clube.total_anuncios.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>

            {temMais && (
              <button
                onClick={() => setExpandido(e => !e)}
                style={{ marginTop: 24, background: 'none', border: '1px solid #e0dee7', borderRadius: 12, padding: '10px 24px', fontSize: 13, color: '#550fed', fontWeight: 700, cursor: 'pointer', fontFamily: 'Onest, sans-serif', letterSpacing: '-0.01em' }}
              >
                {expandido ? 'Ver menos clubes ↑' : `Ver mais ${clubes.length - LIMITE_INICIAL} clubes ↓`}
              </button>
            )}
          </div>
        </div>
      )}

      {menuMobile && (
        <div
          style={{ position: 'fixed', top: scrolled ? 102 : 60, left: 0, right: 0, background: '#fff', borderBottom: '1px solid #e0dee7', padding: '20px 24px', zIndex: 99, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
          onClick={() => setMenuMobile(false)}
        >
          <Link href="/" className="ag-link-black" style={{ fontSize: 16, fontWeight: 700 }}>Conheça Aguante</Link>
          <Link href="/search" className="ag-link-black" style={{ fontSize: 16, fontWeight: 700 }}>Explore camisas</Link>
        </div>
      )}
    </>
  )
}
