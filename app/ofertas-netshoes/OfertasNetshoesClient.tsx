'use client'

import { useMemo, useState } from 'react'
import CardOferta from '@/components/CardOferta'
import type { OfertaAfiliada } from '@/types'

const TODOS = 'Todos'
type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error'

function embaralhar<T>(itens: T[]) {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function ordenarPorClubesEmbaralhados(ofertas: OfertaAfiliada[]) {
  const grupos = new Map<string, OfertaAfiliada[]>()

  ofertas.forEach(oferta => {
    const clube = oferta.clube || 'Outros'
    grupos.set(clube, [...(grupos.get(clube) || []), oferta])
  })

  return embaralhar(Array.from(grupos.keys())).flatMap(clube => grupos.get(clube) || [])
}

export default function OfertasNetshoesClient({ ofertas }: { ofertas: OfertaAfiliada[] }) {
  const [clubeSelecionado, setClubeSelecionado] = useState(TODOS)
  const [ofertasOrdenadas] = useState(() => ordenarPorClubesEmbaralhados(ofertas))
  const [emailNewsletter, setEmailNewsletter] = useState('')
  const [todosClubesNewsletter, setTodosClubesNewsletter] = useState(true)
  const [clubesNewsletter, setClubesNewsletter] = useState<string[]>([])
  const [newsletterStatus, setNewsletterStatus] = useState<NewsletterStatus>('idle')
  const [newsletterMensagem, setNewsletterMensagem] = useState('')

  const clubes = useMemo(() => {
    return [TODOS, ...Array.from(new Set(ofertas.map(oferta => oferta.clube).filter((clube): clube is string => Boolean(clube)))).sort((a, b) => a.localeCompare(b, 'pt-BR'))]
  }, [ofertas])

  const ofertasFiltradas = clubeSelecionado === TODOS
    ? ofertasOrdenadas
    : ofertasOrdenadas.filter(oferta => oferta.clube === clubeSelecionado)

  const clubesParaNewsletter = clubes.filter(clube => clube !== TODOS)

  function alternarClubeNewsletter(clube: string) {
    setClubesNewsletter(atuais => atuais.includes(clube)
      ? atuais.filter(item => item !== clube)
      : [...atuais, clube]
    )
  }

  async function cadastrarNewsletter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewsletterStatus('loading')
    setNewsletterMensagem('')

    const res = await fetch('/api/newsletter-netshoes', {
      body: JSON.stringify({
        email: emailNewsletter,
        clubes: clubesNewsletter,
        todosClubes: todosClubesNewsletter,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      setNewsletterStatus('error')
      setNewsletterMensagem(payload.error || 'Não foi possível cadastrar agora.')
      return
    }

    setNewsletterStatus('success')
    setNewsletterMensagem('Cadastro feito. Vamos avisar quando uma camisa dos seus clubes baixar de preço.')
  }

  if (ofertas.length === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: '#62748c', fontSize: 15, fontWeight: 600, padding: 28 }}>
        Nenhuma oferta Netshoes ativa no momento.
      </div>
    )
  }

  return (
    <>
      <section
        style={{
          background: '#fff',
          border: '1px solid #E8E6DF',
          borderRadius: 12,
          display: 'grid',
          gap: 22,
          gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)',
          marginBottom: 28,
          padding: 24,
        }}
        className="ag-newsletter-netshoes"
      >
        <div>
          <p style={{ color: '#550fed', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1, marginBottom: 12, textTransform: 'uppercase' }}>
            Alertas por e-mail
          </p>
          <h2 style={{ color: '#282828', fontSize: 26, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1.12, margin: 0 }}>
            Receba quando as camisas baixarem de preço.
          </h2>
          <p style={{ color: '#62748c', fontSize: 14, fontWeight: 400, lineHeight: 1.45, marginTop: 12 }}>
            Você escolhe os clubes e a gente envia os produtos que ficaram mais baratos, com link afiliado e indicação de cupom AGUANTE quando disponível.
          </p>
        </div>

        <form onSubmit={cadastrarNewsletter} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <label htmlFor="newsletter-netshoes-email" style={{ color: '#62748c', fontSize: 13, fontWeight: 700 }}>
              Seu e-mail
            </label>
            <input
              id="newsletter-netshoes-email"
              onChange={event => setEmailNewsletter(event.target.value)}
              placeholder="voce@email.com"
              required
              style={{ background: '#f8f8f8', border: '1px solid #E8E6DF', borderRadius: 8, color: '#282828', font: '500 14px Onest, sans-serif', height: 44, outline: 'none', padding: '0 14px' }}
              type="email"
              value={emailNewsletter}
            />
          </div>

          <label style={{ alignItems: 'center', color: '#282828', cursor: 'pointer', display: 'flex', fontSize: 13, fontWeight: 800, gap: 8 }}>
            <input
              checked={todosClubesNewsletter}
              onChange={event => setTodosClubesNewsletter(event.target.checked)}
              type="checkbox"
            />
            Receber alertas de todos os clubes
          </label>

          {!todosClubesNewsletter && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {clubesParaNewsletter.map(clube => {
                const ativo = clubesNewsletter.includes(clube)
                return (
                  <button
                    key={clube}
                    onClick={() => alternarClubeNewsletter(clube)}
                    type="button"
                    style={{
                      background: ativo ? '#282828' : '#fff',
                      border: `1px solid ${ativo ? '#282828' : '#E8E6DF'}`,
                      borderRadius: 999,
                      color: ativo ? '#fff' : '#282828',
                      cursor: 'pointer',
                      font: '800 12px Onest, sans-serif',
                      padding: '8px 11px',
                    }}
                  >
                    {clube}
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button
              disabled={newsletterStatus === 'loading'}
              style={{ background: '#282828', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', font: '800 13px Onest, sans-serif', minHeight: 42, opacity: newsletterStatus === 'loading' ? 0.7 : 1, padding: '0 18px' }}
              type="submit"
            >
              {newsletterStatus === 'loading' ? 'cadastrando...' : 'receber alertas'}
            </button>
            {newsletterMensagem && (
              <p style={{ color: newsletterStatus === 'error' ? '#b42318' : '#087443', fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>
                {newsletterMensagem}
              </p>
            )}
          </div>
        </form>
      </section>

      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        {clubes.map(clube => {
          const ativo = clube === clubeSelecionado
          return (
            <button
              key={clube}
              onClick={() => setClubeSelecionado(clube)}
              type="button"
              style={{
                background: ativo ? '#282828' : '#fff',
                border: `1px solid ${ativo ? '#282828' : '#E8E6DF'}`,
                borderRadius: 999,
                color: ativo ? '#fff' : '#282828',
                cursor: 'pointer',
                font: '800 12px Onest, sans-serif',
                letterSpacing: '-0.01em',
                padding: '9px 12px',
              }}
            >
              {clube}
            </button>
          )
        })}
      </div>

      {ofertasFiltradas.length > 0 ? (
        <div className="ag-cards">
          {ofertasFiltradas.map(oferta => <CardOferta key={oferta.id} oferta={oferta} />)}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 8, color: '#62748c', fontSize: 15, fontWeight: 600, padding: 28 }}>
          Nenhuma oferta ativa para este clube.
        </div>
      )}
    </>
  )
}
