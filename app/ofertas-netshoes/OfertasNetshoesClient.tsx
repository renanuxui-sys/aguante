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
  const [preferenciasAbertas, setPreferenciasAbertas] = useState(false)
  const [newsletterOculta, setNewsletterOculta] = useState(false)

  const clubes = useMemo(() => {
    return [TODOS, ...Array.from(new Set(ofertas.map(oferta => oferta.clube).filter((clube): clube is string => Boolean(clube)))).sort((a, b) => a.localeCompare(b, 'pt-BR'))]
  }, [ofertas])

  const ofertasFiltradas = clubeSelecionado === TODOS
    ? ofertasOrdenadas
    : ofertasOrdenadas.filter(oferta => oferta.clube === clubeSelecionado)

  const clubesParaNewsletter = clubes.filter(clube => clube !== TODOS)
  const labelClubesNewsletter = todosClubesNewsletter
    ? 'todos os clubes'
    : clubesNewsletter.length === 1
      ? clubesNewsletter[0]
      : `${clubesNewsletter.length || 0} clube${clubesNewsletter.length === 1 ? '' : 's'}`

  function alternarClubeNewsletter(clube: string) {
    if (todosClubesNewsletter) setTodosClubesNewsletter(false)
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
    setPreferenciasAbertas(false)
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

      <div className={`ag-newsletter-spacer${newsletterOculta ? ' ag-newsletter-hidden' : ''}`} />
      <aside className={`ag-newsletter-netshoes${newsletterOculta ? ' ag-newsletter-hidden' : ''}`}>
        <form className="ag-newsletter-form" onSubmit={cadastrarNewsletter}>
          <button
            aria-label="Ocultar alertas Netshoes"
            className="ag-newsletter-close"
            onClick={() => setNewsletterOculta(true)}
            type="button"
          >
            ×
          </button>

          <div className="ag-newsletter-copy">
            <strong>Receba Alertas Netshoes</strong>
            <span>Camisas que baixaram de preço, e com cupom, no seu e-mail.</span>
          </div>

          {newsletterStatus === 'success' ? (
            <p className="ag-newsletter-success">
              {newsletterMensagem}
            </p>
          ) : (
            <>
              <button
                className="ag-newsletter-clubes-toggle"
                onClick={() => setPreferenciasAbertas(aberto => !aberto)}
                type="button"
              >
                <span className="ag-newsletter-toggle-check" aria-hidden="true">
                  ✓
                </span>
                <span>{labelClubesNewsletter}</span>
                <span className="ag-newsletter-toggle-arrow" aria-hidden="true">
                  ▾
                </span>
              </button>

              {preferenciasAbertas && (
                <div className="ag-newsletter-clubes">
                  <label>
                    <input
                      checked={todosClubesNewsletter}
                      onChange={event => setTodosClubesNewsletter(event.target.checked)}
                      type="checkbox"
                    />
                    Todos os clubes
                  </label>

                  <div className="ag-newsletter-clubes-grid">
                    {clubesParaNewsletter.map(clube => (
                      <label key={clube}>
                        <input
                          checked={clubesNewsletter.includes(clube)}
                          onChange={() => alternarClubeNewsletter(clube)}
                          type="checkbox"
                        />
                        {clube}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="ag-newsletter-actions">
                <input
                  aria-label="E-mail para receber alertas"
                  id="newsletter-netshoes-email"
                  onChange={event => setEmailNewsletter(event.target.value)}
                  placeholder="seu e-mail"
                  required
                  type="email"
                  value={emailNewsletter}
                />
                <button disabled={newsletterStatus === 'loading'} type="submit">
                  {newsletterStatus === 'loading' ? 'enviando...' : 'receber ofertas'}
                </button>
              </div>

              {newsletterMensagem && (
                <p className={`ag-newsletter-status ag-newsletter-status-${newsletterStatus}`}>
                  {newsletterMensagem}
                </p>
              )}
            </>
          )}
        </form>
      </aside>
    </>
  )
}
