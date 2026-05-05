'use client'
import { useEffect, useState } from 'react'
import { TODOS_CLUBES } from './Navbar'
import { supabase } from '@/lib/supabase'

const imgLogo = "/assets/logo.svg"
const imgChevronDown = "/assets/chevron-down.svg"

type Status = 'idle' | 'loading' | 'success' | 'error' | 'duplicate'

export default function Footer() {
  const [nome, setNome]   = useState('')
  const [clube, setClube] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [clubes, setClubes] = useState<string[]>([])

  useEffect(() => {
    async function carregarClubes() {
      const { data } = await supabase
        .from('clubes')
        .select('nome')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      const nomes = data?.map(c => c.nome).filter(Boolean) || TODOS_CLUBES
      const unicos = Array.from(new Set(nomes)).filter(nome => nome !== 'Outro').sort((a, b) => a.localeCompare(b, 'pt-BR'))
      setClubes([...unicos, 'Outro'])
    }

    carregarClubes()

    const clubeSalvo = localStorage.getItem('aguante_clube_preferencia')
    if (clubeSalvo && clubeSalvo !== 'nao_escolheu') setClube(clubeSalvo)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!nome.trim() || !email.trim()) {
      setStatus('error')
      return
    }

    setStatus('loading')

    const { error } = await supabase
      .from('cadastros_cta')
      .insert({ nome: nome.trim(), clube: clube || null, email: email.trim() })

    if (error) {
      if (error.code === '23505') {
        setStatus('duplicate')
      } else {
        setStatus('error')
      }
      return
    }

    setStatus('success')
    setNome('')
    setClube('')
    setEmail('')
  }

  return (
    <>
      {/* ══ CTA ══ */}
      <section style={{ background: 'transparent', paddingBottom: 0, position: 'relative', zIndex: 2 }}>
        <div className="ag-container">
          <div style={{ background: '#fff', borderRadius: 16, padding: '48px 56px', display: 'flex', flexDirection: 'column', gap: 49, alignItems: 'center', marginBottom: -80 }}>

            <div style={{ textAlign: 'center', letterSpacing: '-0.64px' }}>
              <p style={{ fontWeight: 300, fontSize: 32, color: '#000', lineHeight: 1.2, fontFamily: 'Onest, sans-serif' }}>Estamos só começando.</p>
              <p style={{ fontWeight: 700, fontSize: 32, color: '#000', lineHeight: 1.2, fontFamily: 'Onest, sans-serif' }}>Fique sabendo de todas novidades.</p>
            </div>

            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#550fed', fontFamily: 'Onest, sans-serif', letterSpacing: '-0.02em' }}>
                  Cadastro feito! 🎽
                </p>
                <p style={{ fontSize: 14, color: '#62748c', marginTop: 8, fontFamily: 'Onest, sans-serif' }}>
                  Te avisamos assim que tiver novidade por aqui.
                </p>
              </div>
            ) : (
              <form className="ag-cta-form" onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>Qual o seu nome?</label>
                  <input
                    type="text"
                    className="ag-input"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>Qual o seu clube de coração?</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <select
                      className="ag-select"
                      value={clube}
                      onChange={e => setClube(e.target.value)}
                      style={{ paddingRight: 52 }}
                    >
                      <option value="">selecione</option>
                      {clubes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <img src={imgChevronDown} alt="" style={{ position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: 14, color: '#62748c', letterSpacing: '-0.14px', lineHeight: 1.2 }}>Informe o seu melhor e-mail</label>
                  <input
                    type="email"
                    className="ag-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-end' }}>
                  <button
                    type="submit"
                    className="ag-btn-cadastrar"
                    disabled={status === 'loading'}
                    style={{ opacity: status === 'loading' ? 0.7 : 1 }}
                  >
                    {status === 'loading' ? 'enviando...' : 'cadastrar'}
                    {status !== 'loading' && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14.5 1.5L7 9M14.5 1.5L10 14.5L7 9M14.5 1.5L1.5 5.5L7 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {status === 'duplicate' && (
                    <p style={{ fontSize: 12, color: '#e05', fontFamily: 'Onest, sans-serif', textAlign: 'center' }}>
                      Esse e-mail já está cadastrado.
                    </p>
                  )}
                  {status === 'error' && (
                    <p style={{ fontSize: 12, color: '#e05', fontFamily: 'Onest, sans-serif', textAlign: 'center' }}>
                      Preencha nome e e-mail para continuar.
                    </p>
                  )}
                </div>
              </form>
            )}

          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: '#ecebf0', paddingTop: 165, paddingBottom: 93 }}>
        <div className="ag-container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <img src={imgLogo} alt="Aguante" style={{ width: 136, height: 55, display: 'block' }} />
              <p style={{ fontWeight: 300, fontSize: 14, color: '#000', letterSpacing: '-0.42px', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
                Encontre a peça que falta para a sua coleção
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
                <path d="M2 4h15a1 1 0 011 1v10a1 1 0 01-1 1H2a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="#000" strokeWidth="1.5"/>
                <path d="M1 5l8.5 6L18 5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <a
                href="mailto:contato@aguante.com.br"
                style={{ fontWeight: 700, fontSize: 14, color: '#000', letterSpacing: '-0.42px', lineHeight: 1.4, textDecoration: 'none' }}
                className="ag-link-black"
              >
                contato@aguante.com.br
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
