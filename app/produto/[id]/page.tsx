'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import { supabase } from '@/lib/supabase'
import type { Produto } from '@/types'

const imgArrowLeft    = "https://www.figma.com/api/mcp/asset/831e5e5f-8569-4e5b-b098-78cb374b69e4"
const imgLightning    = "https://www.figma.com/api/mcp/asset/7d7e1469-42a4-4078-be97-1e683db9145c"
const imgIconNotify   = "https://www.figma.com/api/mcp/asset/ba5c9909-f3ae-47f5-80eb-735928779f1f"
const imgIconArrowUp  = "https://www.figma.com/api/mcp/asset/ed00e220-3253-48d0-8161-aca410d4a7ec"
const imgChevronRight = "https://www.figma.com/api/mcp/asset/cd20f991-1979-4d24-9e5d-6733cfb02c5b"
const imgBgHero       = "https://www.figma.com/api/mcp/asset/4a126ff7-6c3a-4b92-8bbe-01319a538714"

type ProdutoComStats = Produto & { views?: number; likes?: number }
type StatusAlerta = 'idle' | 'loading' | 'success' | 'error'

export default function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [produto, setProduto]           = useState<ProdutoComStats | null>(null)
  const [relacionados, setRelacionados] = useState<Produto[]>([])
  const [alertaAberto, setAlertaAberto] = useState(false)
  const [favoritado, setFavoritado]     = useState(false)
  const [likes, setLikes]               = useState(0)
  const [nomeAlerta, setNomeAlerta]     = useState('')
  const [emailAlerta, setEmailAlerta]   = useState('')
  const [statusAlerta, setStatusAlerta] = useState<StatusAlerta>('idle')
  const [imgCarregada, setImgCarregada] = useState(false)
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    setLoading(true)
    setImgCarregada(false)
    setProduto(null)
    setRelacionados([])
    setFavoritado(false)

    async function carregar() {
      const { data: prod } = await supabase
        .from('produtos').select('*').eq('id', id).single()

      setProduto(prod)
      setLikes(prod?.likes || 0)

      // Verifica se já curtiu este produto (controle local por aba)
      if (typeof window !== 'undefined') {
        const curtidos = JSON.parse(sessionStorage.getItem('aguante_curtidos') || '[]')
        setFavoritado(curtidos.includes(id))
      }

      setLoading(false)

      if (prod) {
        // Incrementa views (não bloqueia o render)
        supabase.rpc('incrementar_views', { produto_id: id })

        const query = supabase.from('produtos').select('*').neq('id', id).eq('ativo', true).limit(5)
        if (prod.clube) query.eq('clube', prod.clube)
        const { data: rel } = await query
        setRelacionados(rel || [])
      }
    }

    carregar()
  }, [id])

  async function toggleCurtida() {
    if (!produto) return

    const novoEstado = !favoritado
    const delta = novoEstado ? 1 : -1

    // Atualização otimista
    setFavoritado(novoEstado)
    setLikes(l => Math.max(0, l + delta))

    // Persiste no banco
    const { data } = await supabase.rpc('ajustar_likes', { produto_id: id, delta })
    if (typeof data === 'number') setLikes(data)

    // Salva localmente para evitar duplicação na mesma sessão
    if (typeof window !== 'undefined') {
      const curtidos: string[] = JSON.parse(sessionStorage.getItem('aguante_curtidos') || '[]')
      if (novoEstado && !curtidos.includes(id)) curtidos.push(id)
      if (!novoEstado) {
        const idx = curtidos.indexOf(id)
        if (idx !== -1) curtidos.splice(idx, 1)
      }
      sessionStorage.setItem('aguante_curtidos', JSON.stringify(curtidos))
    }
  }

  async function handleCriarAlerta(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeAlerta.trim() || !emailAlerta.trim() || !produto) return
    setStatusAlerta('loading')
    const { error } = await supabase.from('alertas').insert({
      email: emailAlerta.trim(),
      clube: produto.clube,
      palavra_chave: produto.titulo,
      ativo: true,
    })
    if (error) { setStatusAlerta('error'); return }
    setStatusAlerta('success')
    setNomeAlerta('')
    setEmailAlerta('')
  }

  function fecharAlerta() {
    setAlertaAberto(false)
    setStatusAlerta('idle')
    setNomeAlerta('')
    setEmailAlerta('')
  }

  const todosPrecos = produto ? [produto.preco, ...relacionados.map(r => r.preco)].filter(Boolean) as number[] : []
  const mediaPreco = todosPrecos.length > 1 ? Math.round(todosPrecos.reduce((a, b) => a + b, 0) / todosPrecos.length) : null
  const diferencaPercent = mediaPreco && produto?.preco ? Math.round(((produto.preco - mediaPreco) / mediaPreco) * 100) : null
  const acimaDaMedia = diferencaPercent !== null && diferencaPercent > 0

  if (loading) return (
    <main style={{ fontFamily: 'Onest, sans-serif', background: '#f8f8f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #ecebf0', borderTopColor: '#550fed', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  )

  if (!produto) return (
    <main style={{ fontFamily: 'Onest, sans-serif', background: '#f8f8f8', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 20, fontWeight: 700, color: '#282828' }}>Produto não encontrado</p>
        <button onClick={() => router.back()} style={{ background: '#550fed', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Onest, sans-serif', fontWeight: 700 }}>Voltar</button>
      </div>
    </main>
  )

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ag-container { max-width: 1140px; margin: 0 auto; padding: 0 24px; width: 100%; }
        .ag-card { width: 218px; height: 325px; border-radius: 16px; overflow: visible; flex-shrink: 0; transition: transform 0.2s; cursor: pointer; }
        .ag-card:hover { transform: translateY(-3px); }
        .ag-cta-form { display: flex; gap: 16px; align-items: flex-end; width: 100%; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .ag-produto-grid { flex-direction: column !important; }
          .ag-produto-img  { width: 100% !important; }
          .ag-produto-info { width: 100% !important; }
          .ag-card { width: 100% !important; height: auto !important; }
          .ag-cta-form { flex-direction: column !important; }
          .ag-relacionados { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      <main style={{ fontFamily: 'Onest, sans-serif', background: '#f8f8f8', minHeight: '100vh' }}>
        <Navbar />

        <section style={{ paddingTop: 76, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 897, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '115%', top: '-15%', objectFit: 'cover', opacity: 0.4 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 56%, #f8f8f8)' }} />
          </div>

          <div className="ag-container" style={{ paddingTop: 75, paddingBottom: 48, position: 'relative', zIndex: 1 }}>
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', marginBottom: 24 }}>
              <img src={imgArrowLeft} alt="" style={{ width: 24, height: 24 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#000', letterSpacing: '-0.14px', lineHeight: 1.2 }}>voltar</span>
            </button>

            <div className="ag-produto-grid" style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
              <div className="ag-produto-img" style={{ width: 557, flexShrink: 0 }}>
                <div style={{ width: '100%', height: 625, borderRadius: 16, overflow: 'hidden', background: '#ecebf0', position: 'relative', padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                  {!imgCarregada && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: '#ecebf0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {!produto.imagem_url && (
                        <span style={{ fontSize: 13, color: '#62748c', fontFamily: 'Onest, sans-serif' }}>Sem foto disponível</span>
                      )}
                    </div>
                  )}

                  {produto.imagem_url && (
                    <img
                      key={produto.imagem_url}
                      src={produto.imagem_url}
                      alt={produto.titulo}
                      onLoad={() => setImgCarregada(true)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', borderRadius: 16, opacity: imgCarregada ? 1 : 0, transition: 'opacity 0.3s ease', zIndex: 2 }}
                    />
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

                <div style={{ background: '#fff', borderRadius: 16, padding: '8px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
                  <p style={{ fontWeight: 300, fontSize: 18, color: '#000', letterSpacing: '-0.9px', lineHeight: 1.2, maxWidth: 264 }}>
                    <strong style={{ fontWeight: 700 }}>Quer ser avisado </strong>quando aparecer outra igual a essa?
                  </p>
                  <div style={{ padding: 8, width: 168, flexShrink: 0 }}>
                    <button onClick={() => setAlertaAberto(true)} style={{ width: '100%', border: '1px solid #550fed', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 24px', background: 'transparent', cursor: 'pointer', fontFamily: 'Onest, sans-serif' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#000', letterSpacing: '-0.14px', whiteSpace: 'nowrap' }}>criar alerta</span>
                      <img src={imgIconNotify} alt="" style={{ width: 24, height: 24 }} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="ag-produto-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 66 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <p style={{ fontWeight: 700, fontSize: 32, color: '#000', letterSpacing: '-0.64px', lineHeight: 1 }}>{produto.titulo}</p>
                      {produto.ano && <p style={{ fontWeight: 300, fontSize: 18, color: '#000', letterSpacing: '-0.36px', lineHeight: 1.2 }}>Ano {produto.ano}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {produto.novidade && (
                          <div style={{ background: '#000', borderRadius: 16, padding: '2px 8px', display: 'inline-flex', alignItems: 'center' }}>
                            <span style={{ fontWeight: 300, fontSize: 16, color: '#fff', letterSpacing: '-0.16px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>novidade</span>
                          </div>
                        )}
                        {produto.preco && <p style={{ fontWeight: 300, fontSize: 24, color: '#62748c', letterSpacing: '-0.48px', lineHeight: 1.2, textAlign: 'right', marginLeft: 'auto' }}>R$ {produto.preco.toLocaleString('pt-BR')}</p>}
                      </div>
                    </div>

                    <div style={{ height: 1, background: '#e0dee7', width: '100%' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontWeight: 700, fontSize: 12, color: '#000', letterSpacing: '-0.12px', lineHeight: 1.2 }}>Resumo do produto</p>
                      <p style={{ fontWeight: 300, fontSize: 16, color: '#000', letterSpacing: '-0.16px', lineHeight: 1.2 }}>
                        {produto.clube ? `Camisa do ${produto.clube}` : produto.titulo}{produto.ano ? ` da temporada de ${produto.ano}, original da época` : ''}
                      </p>
                      <p style={{ fontWeight: 700, fontSize: 12, color: '#000', letterSpacing: '-0.12px', lineHeight: 1.2, opacity: 0.4 }}>
                        Este anúncio foi encontrado em <span style={{ textDecoration: 'underline' }}>{produto.fonte_nome}</span>
                      </p>
                    </div>
                  </div>

                  <a href={produto.link_original} target="_blank" rel="noopener noreferrer" style={{ background: '#550fed', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 48px', textDecoration: 'none' }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.16px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Ver anúncio original</span>
                  </a>
                </div>

                <div style={{ background: '#e0dee7', borderRadius: 16, padding: '32px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 21, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                      <p style={{ fontWeight: 700, fontSize: 18, color: '#62748c', letterSpacing: '-0.36px', lineHeight: 1.2 }}>Histórico de preço</p>
                      <p style={{ fontWeight: 400, fontSize: 14, color: '#000', letterSpacing: '-0.14px', lineHeight: 1.2 }}>{produto.titulo}{produto.ano ? ` ${produto.ano}` : ''}</p>
                    </div>
                    {mediaPreco ? (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                          <div style={{ position: 'relative', height: 16, width: '100%' }}>
                            <div style={{ position: 'absolute', inset: 0, background: '#ecebf0', borderRadius: 8 }} />
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min((mediaPreco / (produto.preco || mediaPreco)) * 100, 100)}%`, background: '#745cff', borderRadius: 8 }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', lineHeight: 1.2 }}>
                            <p style={{ fontWeight: 400, fontSize: 14, color: '#000', letterSpacing: '-0.14px', whiteSpace: 'nowrap' }}>Média dos anúncios similares</p>
                            <p style={{ fontWeight: 700, fontSize: 16, color: '#62748c', letterSpacing: '-0.16px', whiteSpace: 'nowrap' }}>R$ {mediaPreco.toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                          <div style={{ height: 16, width: '100%', background: acimaDaMedia ? '#bf2d53' : '#1beaa0', borderRadius: 8 }} />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 300, fontSize: 14, color: '#000', letterSpacing: '-0.14px', lineHeight: 1.2 }}>
                              <p>O preço deste produto está</p>
                              <p>{Math.abs(diferencaPercent!)}% {acimaDaMedia ? 'acima' : 'abaixo'} da média</p>
                            </div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {acimaDaMedia && <img src={imgIconArrowUp} alt="" style={{ width: 20, height: 20 }} />}
                                <p style={{ fontWeight: 700, fontSize: 14, color: acimaDaMedia ? '#bf2d53' : '#1beaa0', letterSpacing: '-0.14px', lineHeight: 1.2 }}>{diferencaPercent}%</p>
                              </div>
                              <p style={{ fontWeight: 700, fontSize: 16, color: acimaDaMedia ? '#bf2d53' : '#1beaa0', letterSpacing: '-0.16px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>R$ {produto.preco?.toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: 14, color: '#62748c', fontStyle: 'italic', width: '100%' }}>Ainda sem dados suficientes para comparar preços deste produto.</p>
                    )}
                    <div style={{ width: '100%' }}>
                      <p style={{ fontWeight: 700, fontSize: 12, color: '#000', letterSpacing: '-0.12px', lineHeight: 1.2 }}>IMPORTANTE</p>
                      <p style={{ fontWeight: 400, fontSize: 12, color: '#62748c', letterSpacing: '-0.12px', lineHeight: 1.2, marginTop: 21 }}>Ao comparar o preço de uma peça, você deve considerar as características dela, como se a camisa é de jogo, o estado de conservação, etc. Uma análise somente por ano/versão x preço pode não condizer com a realidade.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {relacionados.length > 0 && (
          <section style={{ position: 'relative', zIndex: 1, paddingTop: 112, paddingBottom: 48 }}>
            <div className="ag-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                <p style={{ fontWeight: 300, fontSize: 24, color: '#000', letterSpacing: '-0.48px', lineHeight: 1.2 }}>Você <strong style={{ fontWeight: 700 }}>pode se interessar</strong></p>
                <div style={{ width: 20, height: 20, transform: 'rotate(-90deg)', flexShrink: 0 }}>
                  <img src={imgChevronRight} alt="" style={{ width: 20, height: 20 }} />
                </div>
              </div>
              <div className="ag-relacionados" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 218px)', gap: 12 }}>
                {relacionados.map(r => <CardProduto key={r.id} produto={r} />)}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </main>

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
                    <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>Qual o seu nome?</label>
                    <input type="text" value={nomeAlerta} onChange={e => setNomeAlerta(e.target.value)} required style={{ background: '#fff', border: '1px solid #e0dee7', borderRadius: 16, padding: '14px 24px', height: 48, fontSize: 14, outline: 'none', fontFamily: 'Onest, sans-serif', width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>Digite o seu melhor e-mail</label>
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
