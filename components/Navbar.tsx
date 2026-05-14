'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const imgLogo      = "/assets/logo.svg"
const imgChevron   = "/assets/chevron-down.svg"
const imgNavSearch = "/assets/ico-search.svg"
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
      id: String(i), nome, slug: nome.toLowerCase().replace(/[\s/]/g,'-'),
      categoria: 'Clubes Brasileiros', escudo_url: null, total_anuncios: 0,
    }))
  }]

  const catAtivaData = cats.find(c => c.key === catAtiva) || cats[0]

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); setQuery(''); setMenuMobile(false); setBuscaMobile(false) }
  }

  // Navegação pelo submenu/menu mobile usa ?clube= para busca exata por clube,
  // evitando que a busca por título traga resultados irrelevantes
  // (ex: "Brasil" trazia camisas com "Brasileiro" ou "Copa do Brasil" no título)
  function navegar(nome: string) {
    setSubmenu(false); setMenuMobile(false)
    router.push(`/search?clube=${encodeURIComponent(nome)}`)
  }

  function onSubmenuEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setSubmenu(true)
  }
  function onSubmenuLeave() {
    leaveTimer.current = setTimeout(() => setSubmenu(false), 150)
  }

  useEffect(() => {
    document.body.style.overflow = menuMobile ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuMobile])

  return (
    <>
      <nav style={{
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
          <button onClick={() => { setBuscaMobile(b => !b); setMenuMobile(false) }}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <img src={imgNavSearch} alt="Buscar" style={{ width: 24, height: 24, filter: 'brightness(0)' }} />
          </button>
          <button onClick={() => { setMenuMobile(m => { const aberto = !m; if (aberto) setCatMobile(''); return aberto }); setBuscaMobile(false) }}
            aria-label={menuMobile ? 'Fechar menu' : 'Abrir menu'}
            style={{ width: 52, height: 52, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <img src={menuMobile ? imgClose : imgMenu} alt="" style={{ width: 48, height: 48 }} />
          </button>
        </div>
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
                  <div key={clube.id} onClick={() => navegar(clube.nome)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0dee7', cursor: 'pointer', transition: 'padding-left 150ms ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.paddingLeft = '6px'; (e.currentTarget.firstChild as HTMLElement).style.color = '#550fed' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.paddingLeft = '0'; (e.currentTarget.firstChild as HTMLElement).style.color = '#000' }}>
                    <span style={{ fontSize: 14, color: '#000', letterSpacing: '-0.01em', lineHeight: 1.2, transition: 'color 150ms ease' }}>{clube.nome}</span>
                    {clube.total_anuncios > 0 && (
                      <span style={{ background: '#ebe8f2', borderRadius: 8, padding: '2px 8px', fontSize: 11, color: '#550fed', fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
                        {clube.total_anuncios.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
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
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: '#fff', zIndex: 98, padding: '12px 16px', borderBottom: '1px solid #e0dee7', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', border: '1px solid #e0dee7', borderRadius: 12, padding: '10px 16px', gap: 8 }}>
              <input ref={mobileInput} autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="O que você procura?"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: '#444', fontFamily: 'Onest, sans-serif' }} />
              <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <img src={imgNavSearch} alt="" style={{ width: 20, height: 20, filter: 'brightness(0)' }} />
              </button>
            </div>
          </form>
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
            <div style={{ padding: '0 20px' }}>
              {cats.map(cat => {
                const aberta = catMobile === cat.key
                return (
                  <div key={cat.key}>
                    <button onClick={() => setCatMobile(aberta ? '' : cat.key)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif' }}>
                      <span style={{ fontWeight: 700, fontSize: 18, color: '#000', letterSpacing: '-0.02em' }}>{cat.labelMobile}</span>
                      <img src={imgChevron} alt="" style={{ width: 20, height: 20, transition: 'transform 200ms ease', transform: aberta ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>

                    {aberta && cat.clubes.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', paddingBottom: 16 }}>
                        {cat.clubes.map(clube => (
                          <button key={clube.id} onClick={() => navegar(clube.nome)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontFamily: 'Onest, sans-serif', width: '100%', textAlign: 'left' }}>
                            <span style={{ fontSize: 14, color: '#000', letterSpacing: '-0.01em' }}>{clube.nome}</span>
                            {clube.total_anuncios > 0 && (
                              <span style={{ background: '#ebe8f2', borderRadius: 8, padding: '2px 8px', fontSize: 11, color: '#550fed', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                                {clube.total_anuncios.toLocaleString('pt-BR')}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {aberta && cat.clubes.length === 0 && (
                      <p style={{ fontSize: 13, color: '#aaa', paddingBottom: 16 }}>Nenhum clube com anúncios.</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '0 20px 40px' }}>
              {[
                { href: '/sobre', label: 'Sobre Aguante' },
                { href: '/contato', label: 'Fale conosco' },
              ].map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuMobile(false)}
                  style={{ display: 'block', fontSize: 16, color: '#000', textDecoration: 'none', padding: '16px 0', letterSpacing: '-0.01em' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .ag-nav-links     { display: none !important; }
          .ag-nav-pill-wrap { display: none !important; }
          .ag-mobile-btns   { display: flex !important; }
        }
      `}</style>
    </>
  )
}
