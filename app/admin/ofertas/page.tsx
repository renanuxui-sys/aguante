'use client'

import { useEffect, useState } from 'react'
import type { OfertaAfiliada } from '@/types'

type Loja = OfertaAfiliada['loja']

const LOJAS: Loja[] = ['Mercado Livre', 'Netshoes']

export default function AdminOfertas() {
  const [ofertas, setOfertas] = useState<OfertaAfiliada[]>([])
  const [loja, setLoja] = useState<Loja>('Mercado Livre')
  const [link, setLink] = useState('')
  const [ordem, setOrdem] = useState('0')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    fetch('/api/admin/cms/ofertas', { cache: 'no-store' })
      .then(async res => ({ res, json: await res.json() }))
      .then(({ res, json }) => {
        if (!ativo) return
        if (!res.ok) {
          setErro(json.error || 'Erro ao carregar ofertas.')
          setCarregando(false)
          return
        }
        setOfertas(json.ofertas || [])
        setCarregando(false)
      })
      .catch(() => {
        if (!ativo) return
        setErro('Erro ao carregar ofertas.')
        setCarregando(false)
      })

    return () => { ativo = false }
  }, [])

  async function cadastrar(event: React.FormEvent) {
    event.preventDefault()
    setSalvando(true)
    setErro('')

    const res = await fetch('/api/admin/cms/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loja, link_afiliado: link, ordem }),
    })
    const json = await res.json()

    if (!res.ok) {
      setErro(json.error || 'Erro ao importar oferta.')
      setSalvando(false)
      return
    }

    setLink('')
    setOrdem('0')
    setOfertas(atual => [json.oferta, ...atual])
    setSalvando(false)
  }

  async function atualizar(oferta: OfertaAfiliada, dados: { ativo?: boolean; ordem?: number }) {
    setErro('')
    const res = await fetch('/api/admin/cms/ofertas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: oferta.id, ...dados }),
    })
    const json = await res.json()
    if (!res.ok) {
      setErro(json.error || 'Erro ao atualizar oferta.')
      return
    }
    setOfertas(atual => atual.map(item => item.id === oferta.id ? json.oferta : item))
  }

  async function remover(oferta: OfertaAfiliada) {
    if (!window.confirm(`Remover "${oferta.titulo}"?`)) return
    setErro('')
    const res = await fetch(`/api/admin/cms/ofertas?id=${encodeURIComponent(oferta.id)}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setErro(json.error || 'Erro ao remover oferta.')
      return
    }
    setOfertas(atual => atual.filter(item => item.id !== oferta.id))
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>
          Ofertas
        </h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
          Cadastre links afiliados de camisas novas do Mercado Livre ou Netshoes para a vitrine da home.
        </p>
      </div>

      <form onSubmit={cadastrar} style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(320px, 1fr) 110px auto', gap: 12, alignItems: 'end' }}>
          <Campo label="Loja">
            <select value={loja} onChange={event => setLoja(event.target.value as Loja)} style={campoStyle}>
              {LOJAS.map(item => <option key={item}>{item}</option>)}
            </select>
          </Campo>
          <Campo label="Link afiliado">
            <input value={link} onChange={event => setLink(event.target.value)} required type="url" placeholder="https://..." style={campoStyle} />
          </Campo>
          <Campo label="Ordem">
            <input value={ordem} onChange={event => setOrdem(event.target.value)} min={0} type="number" style={campoStyle} />
          </Campo>
          <button disabled={salvando} type="submit" style={{ height: 42, border: 'none', borderRadius: 8, background: '#550fed', color: '#fff', cursor: salvando ? 'wait' : 'pointer', font: '700 13px Onest, sans-serif', padding: '0 18px', opacity: salvando ? 0.65 : 1 }}>
            {salvando ? 'Buscando...' : 'Cadastrar'}
          </button>
        </div>
        <p style={{ color: '#8A8880', fontSize: 12, lineHeight: 1.35, marginTop: 12 }}>
          Ao cadastrar, o painel busca foto, título e preço do produto. Para links encurtados, prefira o link final do produto se a importação falhar.
        </p>
      </form>

      {erro && (
        <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', borderRadius: 8, color: '#8A4B00', fontSize: 13, marginBottom: 20, padding: '12px 14px' }}>
          {erro}
        </div>
      )}

      {carregando ? (
        <div style={{ color: '#8A8880', fontSize: 14, paddingTop: 20 }}>Carregando ofertas...</div>
      ) : ofertas.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, color: '#8A8880', fontSize: 14, padding: 28 }}>
          Nenhuma oferta cadastrada.
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['Oferta', 'Loja', 'Preço', 'Ordem', 'Status', 'Link', ''].map(coluna => (
                  <th key={coluna} style={{ color: '#8A8880', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '12px 16px', textAlign: 'left', textTransform: 'uppercase' }}>{coluna}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ofertas.map((oferta, index) => (
                <tr key={oferta.id} style={{ borderBottom: index < ofertas.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={{ padding: '12px 16px', minWidth: 340 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 54, height: 54, borderRadius: 8, background: '#F0EFEB', backgroundImage: oferta.imagem_url ? `url(${oferta.imagem_url})` : undefined, backgroundPosition: 'center', backgroundSize: 'cover', flexShrink: 0 }} />
                      <div style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{oferta.titulo}</div>
                    </div>
                  </td>
                  <td style={celulaStyle}>{oferta.loja}</td>
                  <td style={celulaStyle}>{oferta.preco === null ? '-' : oferta.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td style={{ ...celulaStyle, width: 92 }}>
                    <input
                      defaultValue={oferta.ordem}
                      min={0}
                      type="number"
                      onBlur={event => {
                        const proximaOrdem = Math.max(0, Number(event.currentTarget.value) || 0)
                        if (proximaOrdem !== oferta.ordem) atualizar(oferta, { ordem: proximaOrdem })
                      }}
                      style={{ ...campoStyle, height: 34, width: 70 }}
                    />
                  </td>
                  <td style={celulaStyle}>
                    <button onClick={() => atualizar(oferta, { ativo: !oferta.ativo })} style={{ background: oferta.ativo ? '#E8FFF4' : '#F0EFEB', border: 'none', borderRadius: 999, color: oferta.ativo ? '#087443' : '#6B6966', cursor: 'pointer', font: '700 12px Onest, sans-serif', padding: '6px 10px' }}>
                      {oferta.ativo ? 'Ativa' : 'Oculta'}
                    </button>
                  </td>
                  <td style={celulaStyle}>
                    <a href={oferta.link_afiliado} target="_blank" rel="noreferrer" style={{ color: '#550fed', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      abrir
                    </a>
                  </td>
                  <td style={{ ...celulaStyle, textAlign: 'right' }}>
                    <button onClick={() => remover(oferta)} style={{ background: 'none', border: 'none', color: '#A23B3B', cursor: 'pointer', font: '700 12px Onest, sans-serif', padding: 6 }}>
                      remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ color: '#6B6966', display: 'flex', flexDirection: 'column', fontSize: 12, fontWeight: 700, gap: 6 }}>
      {label}
      {children}
    </label>
  )
}

const campoStyle = {
  background: '#fff',
  border: '1px solid #D9D6CD',
  borderRadius: 8,
  color: '#1A1A1A',
  font: '400 13px Onest, sans-serif',
  height: 42,
  minWidth: 0,
  outline: 'none',
  padding: '0 12px',
  width: '100%',
}

const celulaStyle = {
  color: '#6B6966',
  fontSize: 13,
  padding: '12px 16px',
}
