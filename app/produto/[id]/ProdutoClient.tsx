'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import { supabase } from '@/lib/supabase'
import { imagemComProxy } from '@/lib/image-url'
import { gerarSlugLoja } from '@/lib/loja-utils'
import { formatarResumoProduto } from '@/lib/product-description'
import type { Produto, StoreCoupon } from '@/types'

const imgArrowLeft    = "/assets/arrow-left.svg"
const imgLightning    = "https://www.figma.com/api/mcp/asset/7d7e1469-42a4-4078-be97-1e683db9145c"
const imgIconNotify   = "/assets/ico-notify.svg"
const imgChevronRight = "/assets/chevron-right.svg"
const imgBgHero       = "/assets/bg-hero.png"
const imgExport       = "/assets/export.svg"
const TAGS_OCULTAS = new Set(['geckoapi', 'apify'])

type ProdutoComStats = Produto & { views?: number; likes?: number; cliques_anuncio?: number }
type StatusAlerta = 'idle' | 'loading' | 'success' | 'error'

type ProdutoClientProps = {
  produtoInicial: ProdutoComStats
  relacionadosIniciais: Produto[]
  cupomInicial: StoreCoupon | null
}

type RastreamentoSaida = {
  origem: string
  pagina: string
  campanha: string
}

function origemInicialDoUsuario() {
  const params = new URLSearchParams(window.location.search)
  const origemUtm = params.get('utm_source') || params.get('utm_medium')
  if (origemUtm) return origemUtm

  if (!document.referrer) return 'direto'

  try {
    const origem = new URL(document.referrer)
    return origem.hostname === window.location.hostname ? 'aguante' : origem.hostname
  } catch {
    return document.referrer
  }
}

export default function ProdutoClient({ produtoInicial, relacionadosIniciais, cupomInicial }: ProdutoClientProps) {
  const id = produtoInicial.id
  const router = useRouter()
  const produto = produtoInicial
  const [relacionados] = useState<Produto[]>(relacionadosIniciais)
  const [alertaAberto, setAlertaAberto] = useState(false)
  const [favoritado, setFavoritado]     = useState(false)
  const [likes, setLikes]               = useState(produtoInicial.likes || 0)
  const [clubeAlerta, setClubeAlerta]   = useState(produtoInicial.clube || '')
  const [anoAlerta, setAnoAlerta]       = useState(produtoInicial.ano || '')
  const [nomeAlerta, setNomeAlerta]     = useState('')
  const [emailAlerta, setEmailAlerta]   = useState('')
  const [statusAlerta, setStatusAlerta] = useState<StatusAlerta>('idle')
  const [imagemCarregadaUrl, setImagemCarregadaUrl] = useState<string | null>(null)
  const [mostrarBotaoFixo, setMostrarBotaoFixo] = useState(false)
  const [cupomRevelado, setCupomRevelado] = useState(false)
  const [cupomCopiado, setCupomCopiado] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [rastreamentoSaida, setRastreamentoSaida] = useState<RastreamentoSaida>({
    origem: '',
    pagina: '',
    campanha: '',
  })

  const registrarMetrica = useCallback((tipo: 'views' | 'cliques' | 'likes', delta?: number) => {
    const request = fetch('/api/metricas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produto_id: id, tipo, ...(delta !== undefined ? { delta } : {}) }),
      keepalive: true,
    })

    request.then(async res => {
      if (!res.ok) {
        const erro = await res.text().catch(() => '')
        console.warn(`Não foi possível registrar ${tipo}:`, res.status, erro)
      }
    }).catch(error => console.warn(`Não foi possível registrar ${tipo}:`, error))

    return request
  }, [id])

  useEffect(() => {
    const curtidos = JSON.parse(sessionStorage.getItem('aguante_curtidos') || '[]')
    const restaurarFavorito = window.setTimeout(() => setFavoritado(curtidos.includes(id)), 0)
    registrarMetrica('views')

    return () => window.clearTimeout(restaurarFavorito)
  }, [id, registrarMetrica])

  useEffect(() => {
    const atualizarBotaoFixo = () => setMostrarBotaoFixo(window.scrollY > 160)
    atualizarBotaoFixo()
    window.addEventListener('scroll', atualizarBotaoFixo, { passive: true })
    return () => window.removeEventListener('scroll', atualizarBotaoFixo)
  }, [])

  useEffect(() => {
    const chave = 'aguante_session_id'
    const existente = sessionStorage.getItem(chave)
    const proximo = existente || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(chave, proximo)
    const atualizarSessao = window.setTimeout(() => setSessionId(proximo), 0)
    return () => window.clearTimeout(atualizarSessao)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const origemSalva = sessionStorage.getItem('aguante_origem_usuario')
    const campanhaSalva = sessionStorage.getItem('aguante_campanha')
    const origem = origemSalva || origemInicialDoUsuario()
    const campanha = params.get('utm_campaign') || campanhaSalva || ''

    sessionStorage.setItem('aguante_origem_usuario', origem)
    if (campanha) sessionStorage.setItem('aguante_campanha', campanha)

    const atualizarRastreamento = window.setTimeout(() => {
      setRastreamentoSaida({
        origem,
        campanha,
        pagina: `${window.location.pathname}${window.location.search}`,
      })
    }, 0)

    return () => window.clearTimeout(atualizarRastreamento)
  }, [])

  async function toggleCurtida() {
    const novoEstado = !favoritado
    const delta = novoEstado ? 1 : -1
    setFavoritado(novoEstado)
    setLikes(l => Math.max(0, l + delta))
    const res = await registrarMetrica('likes', delta)
    const data = res.ok ? await res.json() : null
    if (typeof data?.likes === 'number') setLikes(data.likes)
    if (typeof window !== 'undefined') {
      const curtidos: string[] = JSON.parse(sessionStorage.getItem('aguante_curtidos') || '[]')
      if (novoEstado && !curtidos.includes(id)) curtidos.push(id)
      if (!novoEstado) { const idx = curtidos.indexOf(id); if (idx !== -1) curtidos.splice(idx, 1) }
      sessionStorage.setItem('aguante_curtidos', JSON.stringify(curtidos))
    }
  }

  async function handleCriarAlerta(e: React.FormEvent) {
    e.preventDefault()
    if (!clubeAlerta.trim() || !anoAlerta.trim() || !nomeAlerta.trim() || !emailAlerta.trim()) return
    setStatusAlerta('loading')
    const alertaBase = {
      email: emailAlerta.trim(),
      clube: clubeAlerta.trim(),
      palavra_chave: `${clubeAlerta.trim()} ${anoAlerta.trim()}`,
      ativo: true,
    }
    const alertaCompleto = {
      ...alertaBase,
      nome: nomeAlerta.trim(),
      ano: anoAlerta.trim(),
      produto_id: produto.id,
      produto_titulo: produto.titulo,
      produto_link: produto.link_original,
      fonte_nome: produto.fonte_nome,
    }

    let { error } = await supabase.from('alertas').insert(alertaCompleto)
    if (error) {
      const fallback = await supabase.from('alertas').insert(alertaBase)
      error = fallback.error
    }
    if (error) { setStatusAlerta('error'); return }
    setStatusAlerta('success')
    setNomeAlerta('')
    setEmailAlerta('')
  }

  function fecharAlerta() {
    setAlertaAberto(false)
    setStatusAlerta('idle')
    setClubeAlerta(produto?.clube || '')
    setAnoAlerta(produto?.ano || '')
    setNomeAlerta('')
    setEmailAlerta('')
  }

  function registrarEventoCupom(eventType: 'coupon_reveal' | 'coupon_copy') {
    if (!cupomInicial) return

    fetch('/api/coupons/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        coupon_id: cupomInicial.id,
        coupon_code: cupomInicial.code,
        product_id: produto.id,
        store_id: cupomInicial.store_id,
        store_name: produto.fonte_nome,
        session_id: sessionId,
        source: rastreamentoSaida.origem,
        campaign: cupomInicial.campaign || rastreamentoSaida.campanha,
        club: produto.clube,
        page_path: rastreamentoSaida.pagina,
      }),
      keepalive: true,
    }).catch(error => console.warn('Não foi possível registrar evento de cupom:', error))
  }

  function revelarCupom() {
    if (cupomRevelado) return
    setCupomRevelado(true)
    registrarEventoCupom('coupon_reveal')
  }

  async function copiarCupom() {
    if (!cupomInicial) return
    setCupomRevelado(true)
    await navigator.clipboard?.writeText(cupomInicial.code).catch(() => null)
    setCupomCopiado(true)
    registrarEventoCupom('coupon_copy')
    window.setTimeout(() => setCupomCopiado(false), 2200)
  }

  const imagemProdutoUrl = imagemComProxy(produto.imagem_url)
  const imgCarregada = imagemCarregadaUrl === imagemProdutoUrl
  const tagsVisiveis = (produto.tags || []).filter(tag => !TAGS_OCULTAS.has(tag.toLowerCase()))
  const linkSaidaParams = new URLSearchParams()
  if (sessionId) linkSaidaParams.set('sid', sessionId)
  if (rastreamentoSaida.origem) linkSaidaParams.set('origem', rastreamentoSaida.origem)
  if (rastreamentoSaida.pagina) linkSaidaParams.set('pagina', rastreamentoSaida.pagina)
  if (cupomInicial?.campaign || rastreamentoSaida.campanha) linkSaidaParams.set('campanha', cupomInicial?.campaign || rastreamentoSaida.campanha)
  if (cupomInicial && cupomRevelado) {
    linkSaidaParams.set('cupom_revelado', 'true')
    linkSaidaParams.set('coupon_id', cupomInicial.id)
    linkSaidaParams.set('coupon_code', cupomInicial.code)
  }
  const linkSaida = `/out/produto-${encodeURIComponent(produto.id)}${linkSaidaParams.size ? `?${linkSaidaParams.toString()}` : ''}`

  const renderBlocoInfos = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tagsVisiveis.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tagsVisiveis.map((tag: string) => (
              <span key={tag} style={{ background: '#ecebf0', borderRadius: 8, padding: '3px 10px', fontSize: 12, color: '#4a4845', fontWeight: 500, letterSpacing: '-0.01em' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <p style={{ fontWeight: 700, fontSize: 32, color: '#000', letterSpacing: '-0.64px', lineHeight: 1 }}>{produto.titulo}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {produto.ano && <p style={{ fontWeight: 300, fontSize: 18, color: '#000', letterSpacing: '-0.36px', lineHeight: 1.2 }}>Ano {produto.ano}</p>}
          {produto.preco && <p style={{ fontWeight: 300, fontSize: 24, color: '#62748c', letterSpacing: '-0.48px', lineHeight: 1.2, textAlign: 'right', marginLeft: 'auto' }}>R$ {produto.preco.toLocaleString('pt-BR')}</p>}
        </div>
        {produto.novidade && (
          <div style={{ background: '#000', borderRadius: 16, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
            <span style={{ fontWeight: 300, fontSize: 16, color: '#fff', letterSpacing: '-0.16px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>novidade</span>
          </div>
        )}
      </div>
      <div style={{ height: 1, background: '#e0dee7', width: '100%' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontWeight: 700, fontSize: 12, color: '#000', letterSpacing: '-0.12px', lineHeight: 1.2 }}>Resumo do produto</p>
        <p style={{ fontWeight: 300, fontSize: 16, color: '#000', letterSpacing: '-0.16px', lineHeight: 1.2 }}>
          {formatarResumoProduto(produto)}
        </p>
        <p style={{ fontWeight: 700, fontSize: 12, color: '#000', letterSpacing: '-0.12px', lineHeight: 1.2, opacity: 0.4 }}>
          Este anúncio foi encontrado em{' '}
          <Link href={`/lojas/${gerarSlugLoja(produto.fonte_nome)}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
            {produto.fonte_nome}
          </Link>
        </p>
      </div>
    </div>
  )

  const renderBotaoAnuncio = (fullWidth = false) => (
    <a
      href={linkSaida}
      target="_blank"
      rel="noopener noreferrer"
      style={{ background: '#550fed', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 48px', textDecoration: 'none', width: fullWidth ? '100%' : undefined }}
    >
      <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.16px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Ir para a loja</span>
      <img src={imgExport} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)', flexShrink: 0 }} />
    </a>
  )

  const renderCupom = () => {
    if (!cupomInicial) return null

    const validade = cupomInicial.valid_until
      ? new Date(cupomInicial.valid_until).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : null

    return (
      <div style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#087443', fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 6 }}>Cupom disponível</p>
            <p style={{ color: '#000', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {cupomInicial.discount_label} na {produto.fonte_nome}
            </p>
            {cupomInicial.description && (
              <p style={{ color: '#62748c', fontSize: 13, lineHeight: 1.35, marginTop: 6 }}>{cupomInicial.description}</p>
            )}
          </div>
          {validade && <span style={{ color: '#62748c', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>até {validade}</span>}
        </div>

        {cupomInicial.rules && <p style={{ color: '#8A8880', fontSize: 12, lineHeight: 1.35 }}>{cupomInicial.rules}</p>}

        {!cupomRevelado ? (
          <button onClick={revelarCupom} style={{ height: 44, border: 'none', borderRadius: 12, background: '#1A1A1A', color: '#fff', cursor: 'pointer', font: '700 14px Onest, sans-serif' }}>
            Revelar cupom
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ border: '1px dashed #550fed', borderRadius: 12, color: '#550fed', fontSize: 18, fontWeight: 800, letterSpacing: '0.04em', padding: '10px 14px', background: '#F6F2FF' }}>
              {cupomInicial.code}
            </div>
            <button onClick={copiarCupom} style={{ height: 42, border: '1px solid #550fed', borderRadius: 12, background: '#fff', color: '#550fed', cursor: 'pointer', font: '700 13px Onest, sans-serif', padding: '0 14px' }}>
              {cupomCopiado ? 'Copiado' : 'Copiar cupom'}
            </button>
            <a href={linkSaida} target="_blank" rel="noopener noreferrer" style={{ height: 42, borderRadius: 12, background: '#550fed', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', font: '700 13px Onest, sans-serif', padding: '0 16px' }}>
              Ver na loja
            </a>
          </div>
        )}
      </div>
    )
  }

  const renderCardAlerta = () => (
    <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <p style={{ fontWeight: 300, fontSize: 15, color: '#000', lineHeight: 1.3 }}>
        <strong style={{ fontWeight: 700 }}>Não encontrou o produto que procurava?</strong> Crie um alerta que te avisamos quando ele for encontrado.
      </p>
      <button onClick={() => setAlertaAberto(true)} style={{ border: '1px solid #550fed', borderRadius: 12, padding: '12px 16px', background: 'transparent', cursor: 'pointer', fontFamily: 'Onest, sans-serif', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#000', whiteSpace: 'nowrap' }}>criar alerta</span>
        <img src={imgIconNotify} alt="" style={{ width: 20, height: 20 }} />
      </button>
    </div>
  )

  const renderAvisoTerceiros = () => (
    <div style={{ borderTop: '1px solid #e0dee7', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontWeight: 300, fontSize: 13, color: '#62748c', letterSpacing: '-0.13px', lineHeight: 1.35 }}>
        Os produtos e preços exibidos na Aguante podem sofrer alterações sem aviso prévio, conforme disponibilidade das lojas e vendedores responsáveis pelos anúncios.
      </p>
      <p style={{ fontWeight: 300, fontSize: 13, color: '#62748c', letterSpacing: '-0.13px', lineHeight: 1.35 }}>
        A Aguante não realiza vendas diretas e não se responsabiliza por pagamentos, entregas, trocas ou negociações realizadas com terceiros.
      </p>
    </div>
  )

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-card { width: 218px; min-height: 325px; height: 100%; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .ag-card:hover { transform: translateY(-3px); }
        .ag-cta-form { display: flex; gap: 16px; align-items: flex-end; width: 100%; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ag-produto-desktop { display: flex; }
        .ag-produto-mobile  { display: none; }
        .ag-produto-mobile-content { padding-top: 76px; }
        .ag-btn-fixo-mobile { display: none; }
        @media (max-width: 768px) {
          .ag-produto-desktop { display: none !important; }
          .ag-produto-mobile  { display: flex !important; }
          .ag-produto-mobile-content { padding-top: 0 !important; }
          .ag-btn-fixo-mobile.visivel { display: flex !important; }
          .ag-card { width: 100% !important; height: auto !important; min-height: 112px; }
          .ag-cta-form { flex-direction: column !important; }
          .ag-relacionados { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <main style={{ fontFamily: 'Onest, sans-serif', background: '#f8f8f8', minHeight: '100vh' }}>

        {/* DESKTOP */}
        <div className="ag-produto-desktop" style={{ flexDirection: 'column' }}>
          <Navbar />
          <section style={{ paddingTop: 76, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 897, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '115%', top: '-15%', objectFit: 'cover', opacity: 1 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 56%, #f8f8f8)' }} />
            </div>
            <div className="ag-container" style={{ paddingTop: 48, paddingBottom: 48, position: 'relative', zIndex: 1 }}>
              <button onClick={() => router.back()} aria-label="Voltar" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0, marginBottom: 24 }}>
                <img src={imgArrowLeft} alt="" style={{ width: 24, height: 24 }} />
              </button>
              <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
                <div style={{ width: 557, flexShrink: 0 }}>
                  <div style={{ width: '100%', height: 625, borderRadius: 16, overflow: 'hidden', background: '#ecebf0', position: 'relative', padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {!imgCarregada && (
                      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: '#ecebf0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {!imagemProdutoUrl && <span style={{ fontSize: 13, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>Sem foto disponível</span>}
                      </div>
                    )}
                    {imagemProdutoUrl && (
                      <img key={imagemProdutoUrl} src={imagemProdutoUrl} alt={produto.titulo} onLoad={() => setImagemCarregadaUrl(imagemProdutoUrl)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: 16, opacity: imgCarregada ? 1 : 0, transition: 'opacity 0.3s ease', zIndex: 2 }} />
                    )}
                    {produto.alta_procura && (
                      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', height: 25, alignItems: 'flex-start', justifyContent: 'center', overflow: 'hidden', borderRadius: 16, boxShadow: '0px 14px 12.6px rgba(161,244,82,0.13), inset 0px -2px 28px rgba(116,216,22,0.51)', width: 'fit-content' }}>
                        <div style={{ background: '#1beaa0', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 15px', height: 28 }}>
                          <img src={imgLightning} alt="" style={{ width: 15, height: 15 }} />
                          <span style={{ fontWeight: 300, fontSize: 16, color: '#000', letterSpacing: '-0.16px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>alta procura</span>
                        </div>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 3 }}>
                      <button onClick={toggleCurtida} style={{ background: '#fff', border: favoritado ? '2px solid #550fed' : '2px solid transparent', borderRadius: 16, boxShadow: '0px 4px 16px rgba(0,0,0,0.25)', padding: 10, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 180ms ease' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <path d="M14 24s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12z" fill={favoritado ? '#550fed' : 'none'} stroke="#550fed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#550fed', letterSpacing: '-0.16px', lineHeight: 1.2 }}>{likes}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 40 }}>
                  {renderBlocoInfos()}
                  {renderCupom()}
                  {renderBotaoAnuncio()}
                  {renderCardAlerta()}
                  {renderAvisoTerceiros()}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* MOBILE */}
        <div className="ag-produto-mobile" style={{ flexDirection: 'column' }}>
          <Navbar />
          <div className="ag-produto-mobile-content">
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#ecebf0' }}>
              {imagemProdutoUrl && (
                <img src={imagemProdutoUrl} alt={produto.titulo} onLoad={() => setImagemCarregadaUrl(imagemProdutoUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: imgCarregada ? 1 : 0, transition: 'opacity 0.3s ease' }} />
              )}
              <button onClick={() => router.back()} style={{ position: 'absolute', top: 16, left: 16, background: '#FFF', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
                <img src={imgArrowLeft} alt="Voltar" style={{ width: 24, height: 24 }} />
              </button>
              <button onClick={toggleCurtida} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: favoritado ? '2px solid #550fed' : '2px solid transparent', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <path d="M14 24s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12z" fill={favoritado ? '#550fed' : 'none'} stroke="#550fed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#550fed' }}>{likes}</span>
              </button>
              {produto.alta_procura && (
                <div style={{ position: 'absolute', bottom: 16, left: 16, background: '#1beaa0', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', boxShadow: '0px 14px 12.6px rgba(161,244,82,0.13)' }}>
                  <img src={imgLightning} alt="" style={{ width: 14, height: 14 }} />
                  <span style={{ fontWeight: 400, fontSize: 12, color: '#000', whiteSpace: 'nowrap' }}>alta procura</span>
                </div>
              )}
            </div>
            <div style={{ padding: '24px 20px 120px', display: 'flex', flexDirection: 'column', gap: 32 }}>
              {renderBlocoInfos()}
              {renderCupom()}
              {renderBotaoAnuncio(true)}
              {renderCardAlerta()}
              {renderAvisoTerceiros()}
            </div>
          </div>
        </div>

        {/* Botão fixo mobile */}
        <div className={`ag-btn-fixo-mobile${mostrarBotaoFixo ? ' visivel' : ''}`} style={{ position: 'fixed', bottom: 8, left: 16, right: 16, zIndex: 50 }}>
          <a href={linkSaida} target="_blank" rel="noopener noreferrer" style={{ background: '#550fed', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 24px', textDecoration: 'none', width: '100%', boxShadow: '0 4px 24px rgba(85,15,237,0.35)' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.16px', whiteSpace: 'nowrap' }}>Ir para a loja</span>
            <img src={imgExport} alt="" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)', flexShrink: 0 }} />
          </a>
        </div>

        {/* Relacionados */}
        {relacionados.length > 0 && (
          <section style={{ position: 'relative', zIndex: 1, paddingTop: 64, paddingBottom: 48 }}>
            <div className="ag-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <p style={{ fontWeight: 300, fontSize: 24, color: '#000', letterSpacing: '-0.48px', lineHeight: 1.2 }}>Você <strong style={{ fontWeight: 700 }}>pode se interessar</strong></p>
                <img src={imgChevronRight} alt="" style={{ width: 20, height: 20, transform: 'rotate(-90deg)', flexShrink: 0 }} />
              </div>
              <div className="ag-relacionados" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 218px)', gap: 12 }}>
                {relacionados.map(r => <CardProduto key={r.id} produto={r} />)}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </main>

      {/* Modal alerta */}
      {alertaAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }} onClick={fecharAlerta}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '48px 56px', width: '100%', maxWidth: 520, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={fecharAlerta} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#62748c' }}>✕</button>
            {statusAlerta === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#550fed', fontFamily: 'Onest, sans-serif', letterSpacing: '-0.02em' }}>Alerta criado! 🔔</p>
                <p style={{ fontSize: 14, color: '#62748c', marginTop: 8, fontFamily: 'Onest, sans-serif' }}>Te avisamos quando aparecer outra camisa parecida.</p>
              </div>
            ) : (
              <>
                <p style={{ fontWeight: 700, fontSize: 12, color: '#550fed', letterSpacing: '-0.12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src={imgIconNotify} alt="" style={{ width: 16, height: 16 }} />criar alerta
                </p>
                <p style={{ fontWeight: 700, fontSize: 24, color: '#000', letterSpacing: '-0.48px', lineHeight: 1.2, marginBottom: 32 }}>{produto.titulo}{produto.ano ? ` ${produto.ano}` : ''}</p>
                <form onSubmit={handleCriarAlerta} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>Clube</label>
                    <input type="text" value={clubeAlerta} onChange={e => setClubeAlerta(e.target.value)} required style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 16, padding: '14px 24px', height: 48, fontSize: 14, outline: 'none', fontFamily: 'Onest, sans-serif', width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>Ano</label>
                    <input type="text" value={anoAlerta} onChange={e => setAnoAlerta(e.target.value)} required style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 16, padding: '14px 24px', height: 48, fontSize: 14, outline: 'none', fontFamily: 'Onest, sans-serif', width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>Nome</label>
                    <input type="text" value={nomeAlerta} onChange={e => setNomeAlerta(e.target.value)} required style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 16, padding: '14px 24px', height: 48, fontSize: 14, outline: 'none', fontFamily: 'Onest, sans-serif', width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>E-mail</label>
                    <input type="email" value={emailAlerta} onChange={e => setEmailAlerta(e.target.value)} required style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 16, padding: '14px 24px', height: 48, fontSize: 14, outline: 'none', fontFamily: 'Onest, sans-serif', width: '100%' }} />
                  </div>
                  {statusAlerta === 'error' && <p style={{ fontSize: 12, color: '#e05', fontFamily: 'Onest, sans-serif' }}>Erro ao criar alerta. Tente novamente.</p>}
                  <button type="submit" disabled={statusAlerta === 'loading'} style={{ background: '#550fed', color: '#fff', fontWeight: 700, fontSize: 14, padding: '16px 24px', borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', width: '100%', marginTop: 8, letterSpacing: '-0.14px', opacity: statusAlerta === 'loading' ? 0.7 : 1 }}>
                    {statusAlerta === 'loading' ? 'Criando...' : 'Criar alerta →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
