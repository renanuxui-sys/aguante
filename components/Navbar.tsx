'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { gerarSlugClube } from '@/lib/clube-utils'

const imgLogo      = "/assets/logo.svg"
const imgHome      = "/assets/home.svg"
const imgChevron   = "/assets/chevron-down.svg"
const imgNavSearch = "/assets/ico-search.svg"
const imgCoupon    = "/assets/coupon.svg"
const imgProfile   = "/assets/profile.svg"
const imgFavorite  = "/assets/ico-favorite.svg"
const imgMenu      = "/assets/menu.svg"
const imgClose     = "/assets/close.svg"

export const CLUBES_BRASILEIROS = [
  'Palmeiras','Flamengo','Fluminense','São Paulo','Athletico-PR','Bahia',
  'Coritiba','Botafogo','Bragantino','Vasco da Gama','Grêmio','Cruzeiro',
  'Vitória','Corinthians','Atlético-MG','Internacional','Santos','Mirassol',
  'Remo','Chapecoense','Vila Nova','Fortaleza','São Bernardo','Criciúma',
  'Juventude','Ceará SC','Sport Recife','Náutico','Operário','Botafogo SP',
  'Avaí','Novorizontino','Athletic','Atlético-GO','Ponte Preta','Goiás',
  'Cuiabá','Londrina','CRB','América-MG','Paysandu','Guarani',
  'Santa Cruz','Figueirense',
]
export const TODOS_CLUBES = CLUBES_BRASILEIROS

const ORDEM_CATS = ['Clubes Brasileiros','Clubes Sulamericanos','Clubes Europeus','Seleções','Outros']
const LABEL_MOBILE: Record<string,string> = {
  'Clubes Brasileiros': 'Clubes Brasileiros',
  'Clubes Sulamericanos': 'América do Sul',
  'Clubes Europeus': 'Europa',
  'Seleções': 'Seleções',
  'Outros': 'Outros',
}

type ClubeDB = {
  id: string; nome: string; slug: string
  categoria: string; escudo_url: string | null; total_anuncios: number
}
type ClubeBase = Omit<ClubeDB, 'total_anuncios'>
type Categoria = { key: string; label: string; labelMobile: string; clubes: ClubeDB[] }

function montarCategorias(clubes: ClubeDB[]) {
  const comProdutos = clubes
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const grupos: Record<string, ClubeDB[]> = {}
  comProdutos.forEach(c => {
    const cat = c.categoria || 'Outros'
    if (!grupos[cat]) grupos[cat] = []
    grupos[cat].push(c)
  })

  return ORDEM_CATS
    .filter(k => grupos[k]?.length)
    .map(k => ({ key: k, label: k, labelMobile: LABEL_MOBILE[k] || k, clubes: grupos[k] }))
}

async function carregarClubesMenu() {
  const { data: clubes } = await supabase
    .from('clubes')
    .select('id,nome,slug,categoria,escudo_url')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  return ((clubes || []) as ClubeBase[]).map(clube => ({
    ...clube,
    total_anuncios: 0,
  }))
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [submenu, setSubmenu]         = useState(false)
  const [catAtiva, setCatAtiva]       = useState('Clubes Brasileiros')
  const [menuMobile, setMenuMobile]   = useState(false)
  const [catMobile, setCatMobile]     = useState('')
  const [categorias, setCategorias]   = useState<Categoria[]>([])
  const [query, setQuery]             = useState('')
  const [buscaMobile, setBuscaMobile] = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  const mobileInput = useRef<HTMLInputElement>(null)
  const leaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function carregar() {
      const clubes = await carregarClubesMenu()
      if (!clubes.length) return
      setCategorias(montarCategorias(clubes))
    }
    carregar()
  }, [])

  // Fallback com lista local — sem zerados (oculta badge quando 0)
  const cats: Categoria[] = categorias.length > 0 ? categorias : [{
    key: 'Clubes Brasileiros', label: 'Clubes Brasileiros', labelMobile: 'Clubes Brasileiros',
    clubes: [...CLUBES_BRASILEIROS].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((nome, i) => ({
      id: String(i), nome, slug: gerarSlugClube(nome),
      categoria: 'Clubes Brasileiros', escudo_url: null, total_anuncios: 0,
    }))
  }]

  const catAtivaData = cats.find(c => c.key === catAtiva) || cats[0]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); setQuery(''); setMenuMobile(false); setBuscaMobile(false) }
  }

  function abrirBuscaMobile() {
    setBuscaMobile(true)
    setMenuMobile(false)
    setCatMobile('')
  }

  function fecharBuscaMobile() {
    setBuscaMobile(false)
    setCatMobile('')
  }

  function onSubmenuEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setSubmenu(true)
  }
  function onSubmenuLeave() {
    leaveTimer.current = setTimeout(() => setSubmenu(false), 150)
  }

  useEffect(() => {
    document.body.style.overflow = menuMobile || buscaMobile ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuMobile, buscaMobile])

  useEffect(() => {
    document.body.classList.add('ag-has-mobile-bottom-nav')
    return () => { document.body.classList.remove('ag-has-mobile-bottom-nav') }
  }, [])

  useEffect(() => {
    window.addEventListener('aguante:abrir-busca-mobile', abrirBuscaMobile)
    return () => window.removeEventListener('aguante:abrir-busca-mobile', abrirBuscaMobile)
  }, [])

  const inicioAtivo = pathname === '/'

  return (
    <>
      <nav className="ag-main-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 76,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center',
        padding: '0 max(16px, calc((100% - 1140px) / 2 + 24px))',
        justifyContent: 'space-between',
        zIndex: 100,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img src={imgLogo} alt="Aguante" style={{ width: 136, height: 55, display: 'block' }} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="ag-nav-links">
          <div style={{ position: 'relative' }} onMouseEnter={onSubmenuEnter} onMouseLeave={onSubmenuLeave}>
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: submenu ? '#550fed' : '#000',
              fontSize: 13, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'Onest, sans-serif', padding: '28px 0',
              fontWeight: 700, transition: 'color 150ms ease',
            }}>
              Explore camisas
              <img src={imgChevron} alt="" style={{ width: 16, height: 16, transition: 'transform 200ms ease', transform: submenu ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
          </div>

          <Link href="/sobre" style={{ color: '#000', fontSize: 13, textDecoration: 'none', letterSpacing: '-0.01em', transition: 'color 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.color='#550fed')}
            onMouseLeave={e => (e.currentTarget.style.color='#000')}>
            Conheça Aguante
          </Link>
          <button
            type="button"
            aria-disabled="true"
            style={{ alignItems: 'center', background: 'none', border: 'none', color: '#000', cursor: 'default', display: 'flex', fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 700, gap: 6, letterSpacing: '-0.01em', opacity: 0.3, padding: 0, pointerEvents: 'none' }}
          >
            <img src={imgCoupon} alt="" style={{ display: 'block', height: 18, width: 18 }} />
            Cupons
          </button>
          <Link href="/contato" style={{ color: '#000', fontSize: 13, textDecoration: 'none', letterSpacing: '-0.01em', transition: 'color 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.color='#550fed')}
            onMouseLeave={e => (e.currentTarget.style.color='#000')}>
            Contato
          </Link>
        </div>

        <form onSubmit={handleSearch} className="ag-nav-pill-wrap" style={{ display: 'flex' }}>
          <div className="ag-search-pill"
            style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', border: '1px solid #e0dee7', borderRadius: 16, padding: '10px 16px', width: 260, cursor: 'text', gap: 8 }}
            onClick={() => inputRef.current?.focus()}>
            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="O que você procura?"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 300, color: '#444', fontFamily: 'Onest, sans-serif', minWidth: 0 }} />
            <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0, transition: 'transform 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform='scale(1.12)')}
              onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}>
              <img src={imgNavSearch} alt="Buscar" style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </form>

        <div style={{ display: 'none', alignItems: 'center', gap: 8 }} className="ag-mobile-btns">
          <button onClick={() => { setCatMobile(''); setMenuMobile(m => !m); setBuscaMobile(false) }}
            aria-label={menuMobile ? 'Fechar menu' : 'Abrir menu'}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <img src={menuMobile ? imgClose : imgMenu} alt="" style={{ width: 24, height: 24 }} />
          </button>
        </div>
      </nav>

      <nav className={`ag-mobile-bottom-nav${menuMobile ? ' ag-mobile-bottom-nav-hidden' : ''}`} aria-label="Navegação principal mobile">
        <Link href="/" className={`ag-mobile-nav-item${inicioAtivo ? ' ag-mobile-nav-active' : ''}`} onClick={() => { setMenuMobile(false); setBuscaMobile(false) }}>
          <span className="ag-mobile-nav-icon">
            <img src={imgHome} alt="" />
          </span>
          <span>Início</span>
        </Link>

        <button type="button" className="ag-mobile-nav-item" onClick={() => { setMenuMobile(false); setBuscaMobile(false); window.dispatchEvent(new CustomEvent('aguante:abrir-perfil')) }}>
          <span className="ag-mobile-nav-icon">
            <img src={imgProfile} alt="" />
          </span>
          <span>Perfil</span>
        </button>

        <button type="button" className="ag-mobile-nav-item ag-mobile-nav-muted" aria-disabled="true">
          <span className="ag-mobile-nav-icon">
            <img src={imgCoupon} alt="" />
          </span>
          <span>Cupons</span>
        </button>

        <button type="button" className="ag-mobile-nav-item ag-mobile-nav-search" onClick={abrirBuscaMobile}>
          <span className="ag-mobile-nav-icon">
            <img src={imgNavSearch} alt="" />
          </span>
          <span>Procurar</span>
        </button>

        <button type="button" className="ag-mobile-nav-item" onClick={() => { setBuscaMobile(false); setMenuMobile(false); router.push('/favoritos') }}>
          <span className="ag-mobile-nav-icon">
            <img src={imgFavorite} alt="" />
          </span>
          <span>Favoritos</span>
        </button>

      </nav>

      {/* SUBMENU DESKTOP */}
      {submenu && (
        <div style={{ position: 'fixed', top: 76, left: 0, right: 0, background: '#fff', boxShadow: '0 20px 68px rgba(0,0,0,0.1)', zIndex: 99, paddingBottom: 24, maxHeight: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column' }}
          onMouseEnter={onSubmenuEnter} onMouseLeave={onSubmenuLeave}>
          <div style={{ borderBottom: '1px solid #e0dee7', padding: '0 max(16px, calc((100% - 1140px) / 2 + 24px))', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 32, paddingTop: 24, overflowX: 'auto' }}>
              {cats.map(cat => (
                <button key={cat.key} onClick={() => setCatAtiva(cat.key)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Onest, sans-serif', fontSize: 20, letterSpacing: '-0.02em',
                  fontWeight: catAtiva === cat.key ? 700 : 400,
                  color: catAtiva === cat.key ? '#000' : '#aaa',
                  paddingBottom: 16,
                  borderBottom: catAtiva === cat.key ? '2px solid #000' : '2px solid transparent',
                  transition: 'color 150ms ease', whiteSpace: 'nowrap',
                }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '24px max(16px, calc((100% - 1140px) / 2 + 24px)) 0', overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {catAtivaData && catAtivaData.clubes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 40px' }}>
                {catAtivaData.clubes.map(clube => (
                  <Link key={clube.id} href={`/clubes/${clube.slug || gerarSlugClube(clube.nome)}`} onClick={() => setSubmenu(false)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0dee7', cursor: 'pointer', transition: 'padding-left 150ms ease', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.paddingLeft = '6px'; (e.currentTarget.firstChild as HTMLElement).style.color = '#550fed' }}
                    onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0'; (e.currentTarget.firstChild as HTMLElement).style.color = '#000' }}>
                    <span style={{ fontSize: 14, color: '#000', letterSpacing: '-0.01em', lineHeight: 1.2, transition: 'color 150ms ease' }}>{clube.nome}</span>
                    {clube.total_anuncios > 0 && (
                      <span style={{ background: '#ebe8f2', borderRadius: 8, padding: '2px 8px', fontSize: 11, color: '#550fed', fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
                        {clube.total_anuncios.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#aaa', padding: '16px 0' }}>Nenhum clube com anúncios nesta categoria.</p>
            )}
          </div>
        </div>
      )}

      {/* BUSCA MOBILE */}
      {buscaMobile && (
        <div className="ag-mobile-search-modal">
          <div className="ag-mobile-modal-head">
            <button onClick={fecharBuscaMobile} aria-label="Fechar busca" className="ag-mobile-modal-close">
              <img src={imgClose} alt="" />
            </button>
          </div>

          <form onSubmit={handleSearch} className="ag-mobile-search-form">
            <input
              ref={mobileInput}
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="O que você procura?"
            />
            <button type="submit" aria-label="Buscar">
              <img src={imgNavSearch} alt="" />
            </button>
          </form>

          <div className="ag-mobile-modal-list">
            {cats.map(cat => {
              const aberta = catMobile === cat.key
              return (
                <div key={cat.key}>
                  <button onClick={() => setCatMobile(aberta ? '' : cat.key)} className="ag-mobile-accordion-trigger">
                    <span>{cat.labelMobile}</span>
                    <img src={imgChevron} alt="" style={{ transform: aberta ? 'rotate(180deg)' : 'rotate(0)' }} />
                  </button>

                  {aberta && cat.clubes.length > 0 && (
                    <div className="ag-mobile-club-grid">
                      {cat.clubes.map(clube => (
                        <Link
                          key={clube.id}
                          href={`/clubes/${clube.slug || gerarSlugClube(clube.nome)}`}
                          onClick={fecharBuscaMobile}
                        >
                          {clube.nome}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MENU MOBILE */}
      {menuMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', height: 76, flexShrink: 0 }}>
            <button onClick={() => setMenuMobile(false)} aria-label="Fechar menu" style={{ width: 52, height: 52, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={imgClose} alt="" style={{ width: 48, height: 48 }} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '8px 20px 40px' }}>
              {[
                { href: '/', label: 'Inicio' },
                { href: '/sobre', label: 'Sobre Aguante' },
                { href: '/contato', label: 'Contato' },
              ].map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuMobile(false)}
                  style={{ display: 'block', fontSize: 22, fontWeight: 700, color: '#000', textDecoration: 'none', padding: '18px 0', letterSpacing: '-0.02em' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ag-mobile-bottom-nav { display: none; }
        @media (max-width: 768px) {
          .ag-main-nav {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            height: 62px !important;
            justify-content: space-between !important;
            padding: 0 20px !important;
            background: #fff !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .ag-main-nav > a:first-child {
            justify-content: flex-start;
          }
          .ag-main-nav > a:first-child img {
            width: 122px !important;
            height: auto !important;
          }
          body.ag-has-mobile-bottom-nav main > section:first-of-type,
          body.ag-has-mobile-bottom-nav main > div:first-of-type {
            padding-top: 0 !important;
          }
          .ag-nav-links     { display: none !important; }
          .ag-nav-pill-wrap { display: none !important; }
          .ag-mobile-btns   { display: flex !important; }
          body.ag-has-mobile-bottom-nav { padding-bottom: calc(82px + env(safe-area-inset-bottom)); }
          .ag-btn-fixo-mobile { bottom: calc(82px + env(safe-area-inset-bottom)) !important; }
          .ag-mobile-bottom-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 160;
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            align-items: end;
            min-height: calc(68px + env(safe-area-inset-bottom));
            padding: 8px max(8px, env(safe-area-inset-left)) calc(8px + env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-right));
            background: #ebe8f2;
            box-shadow: 0 -8px 22px rgba(28, 20, 54, 0.08);
          }
          .ag-mobile-bottom-nav-hidden {
            display: none;
          }
          .ag-mobile-nav-item {
            position: relative;
            min-width: 0;
            min-height: 52px;
            padding: 0 2px;
            border: 0;
            background: transparent;
            color: #000;
            cursor: pointer;
            text-decoration: none;
            font: 400 12px/1.05 Onest, sans-serif;
            letter-spacing: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
            -webkit-tap-highlight-color: transparent;
          }
          .ag-mobile-nav-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ag-mobile-nav-icon img {
            width: 24px;
            height: 24px;
            display: block;
            object-fit: contain;
          }
          .ag-mobile-nav-muted {
            opacity: 0.3;
          }
          .ag-mobile-nav-muted {
            pointer-events: none;
          }
          .ag-mobile-nav-active {
            color: #550fed;
            font-weight: 700;
          }
          .ag-mobile-nav-item:not(.ag-mobile-nav-search) .ag-mobile-nav-icon img {
            filter: none;
          }
          .ag-mobile-nav-search {
            font-size: 12px;
            line-height: 1.05;
            font-weight: 400;
          }
          .ag-mobile-search-modal {
            position: fixed;
            inset: 0;
            z-index: 220;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            background: #fff;
            padding: 0 20px calc(120px + env(safe-area-inset-bottom));
          }
          .ag-mobile-modal-head {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            min-height: 76px;
            flex-shrink: 0;
          }
          .ag-mobile-modal-close {
            width: 52px;
            height: 52px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ag-mobile-modal-close img {
            width: 48px;
            height: 48px;
          }
          .ag-mobile-search-form {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 56px;
            margin-bottom: 18px;
            padding: 0 8px 0 18px;
            border: 1px solid #e0dee7;
            border-radius: 18px;
            background: #f5f5f5;
          }
          .ag-mobile-search-form input {
            flex: 1;
            min-width: 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: #000;
            font: 400 16px/1.2 Onest, sans-serif;
          }
          .ag-mobile-search-form button {
            width: 44px;
            height: 44px;
            padding: 0;
            border: 0;
            border-radius: 14px;
            background: #550fed;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .ag-mobile-search-form button img {
            width: 22px;
            height: 22px;
            filter: brightness(0) invert(1);
          }
          .ag-mobile-modal-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .ag-mobile-accordion-trigger {
            width: 100%;
            min-height: 58px;
            padding: 0;
            border: 0;
            border-bottom: 1px solid #f0f0f0;
            background: transparent;
            color: #000;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font: 700 18px/1.15 Onest, sans-serif;
            letter-spacing: -0.02em;
          }
          .ag-mobile-accordion-trigger img {
            width: 20px;
            height: 20px;
            transition: transform 180ms ease;
          }
          .ag-mobile-club-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 16px;
            padding: 8px 0 18px;
          }
          .ag-mobile-club-grid a {
            min-width: 0;
            padding: 9px 0;
            border-bottom: 1px solid #f0f0f0;
            color: #000;
            font: 400 14px/1.2 Onest, sans-serif;
            letter-spacing: -0.01em;
            text-decoration: none;
          }
        }
        @media (max-width: 390px) {
          .ag-mobile-nav-item { font-size: 12px; }
          .ag-mobile-nav-search { font-size: 12px; }
        }
      `}</style>
    </>
  )
}
