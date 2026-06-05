'use client'

import { useEffect, useState } from 'react'
import type { OfertaAfiliada } from '@/types'

type Loja = OfertaAfiliada['loja']

const LOJAS: Loja[] = ['Mercado Livre', 'Netshoes']

function moeda(valor: number | null | undefined) {
  return typeof valor === 'number' && Number.isFinite(valor)
    ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '-'
}

export default function AdminOfertas() {
  const [ofertas, setOfertas] = useState<OfertaAfiliada[]>([])
  const [loja, setLoja] = useState<Loja>('Mercado Livre')
  const [link, setLink] = useState('')
  const [ordem, setOrdem] = useState('0')
  const [cupomCodigo, setCupomCodigo] = useState('')
  const [cupomPercentual, setCupomPercentual] = useState('')
  const [cupomDescontoMaximo, setCupomDescontoMaximo] = useState('')
  const [cupomDescricao, setCupomDescricao] = useState('')
  const [cupomNetshoesCodigo, setCupomNetshoesCodigo] = useState('AGUANTE')
  const [cupomNetshoesPercentual, setCupomNetshoesPercentual] = useState('15')
  const [cupomNetshoesDescontoMaximo, setCupomNetshoesDescontoMaximo] = useState('')
  const [cupomNetshoesDescricao, setCupomNetshoesDescricao] = useState('Cupom não válido para produtos com tag SELEÇÃO')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvandoCupomNetshoes, setSalvandoCupomNetshoes] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

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
        const ofertasCarregadas = json.ofertas || []
        const ofertaNetshoes = ofertasCarregadas.find((oferta: OfertaAfiliada) => oferta.loja === 'Netshoes' && oferta.cupom_codigo)
          || ofertasCarregadas.find((oferta: OfertaAfiliada) => oferta.loja === 'Netshoes')
        setOfertas(ofertasCarregadas)
        if (ofertaNetshoes) {
          setCupomNetshoesCodigo(ofertaNetshoes.cupom_codigo || 'AGUANTE')
          setCupomNetshoesPercentual(String(ofertaNetshoes.cupom_percentual || 15))
          setCupomNetshoesDescontoMaximo(ofertaNetshoes.cupom_desconto_maximo ? String(ofertaNetshoes.cupom_desconto_maximo) : '')
          setCupomNetshoesDescricao(ofertaNetshoes.cupom_descricao || 'Cupom não válido para produtos com tag SELEÇÃO')
        }
        setCarregando(false)
      })
      .catch(() => {
        if (!ativo) return
        setErro('Erro ao carregar ofertas.')
        setCarregando(false)
      })

    return () => { ativo = false }
  }, [])

  function selecionarLoja(proximaLoja: Loja) {
    setLoja(proximaLoja)
    if (proximaLoja === 'Netshoes') {
      setCupomCodigo(cupomNetshoesCodigo)
      setCupomPercentual(cupomNetshoesPercentual)
      setCupomDescontoMaximo(cupomNetshoesDescontoMaximo)
      setCupomDescricao(cupomNetshoesDescricao)
      return
    }

    setCupomCodigo('')
    setCupomPercentual('')
    setCupomDescontoMaximo('')
    setCupomDescricao('')
  }

  async function cadastrar(event: React.FormEvent) {
    event.preventDefault()
    setSalvando(true)
    setErro('')

    const res = await fetch('/api/admin/cms/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loja,
        link_afiliado: link,
        ordem,
        cupom_codigo: cupomCodigo,
        cupom_percentual: cupomPercentual,
        cupom_desconto_maximo: cupomDescontoMaximo,
        cupom_descricao: cupomDescricao,
      }),
    })
    const json = await res.json()

    if (!res.ok) {
      setErro(json.error || 'Erro ao importar oferta.')
      setSalvando(false)
      return
    }

    setLink('')
    setOrdem('0')
    selecionarLoja(loja)
    setOfertas(atual => [json.oferta, ...atual])
    setSalvando(false)
  }

  async function atualizar(oferta: OfertaAfiliada, dados: { ativo?: boolean; ordem?: number; cupom_codigo?: string; cupom_percentual?: number | null; cupom_desconto_maximo?: number | null; cupom_descricao?: string }) {
    setErro('')
    setMensagem('')
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

  async function atualizarCupomNetshoes(event: React.FormEvent) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setSalvandoCupomNetshoes(true)

    const res = await fetch('/api/admin/cms/ofertas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'atualizar_cupom_netshoes',
        cupom_codigo: cupomNetshoesCodigo,
        cupom_percentual: cupomNetshoesPercentual,
        cupom_desconto_maximo: cupomNetshoesDescontoMaximo,
        cupom_descricao: cupomNetshoesDescricao,
      }),
    })
    const json = await res.json()
    setSalvandoCupomNetshoes(false)

    if (!res.ok) {
      setErro(json.error || 'Erro ao atualizar cupom Netshoes.')
      return
    }

    const atualizadas = new Map<string, OfertaAfiliada>((json.ofertas || []).map((oferta: OfertaAfiliada) => [oferta.id, oferta]))
    setOfertas(atual => atual.map(oferta => atualizadas.get(oferta.id) || oferta))
    setCupomCodigo(loja === 'Netshoes' ? cupomNetshoesCodigo : cupomCodigo)
    setCupomPercentual(loja === 'Netshoes' ? cupomNetshoesPercentual : cupomPercentual)
    setCupomDescontoMaximo(loja === 'Netshoes' ? cupomNetshoesDescontoMaximo : cupomDescontoMaximo)
    setCupomDescricao(loja === 'Netshoes' ? cupomNetshoesDescricao : cupomDescricao)
    setMensagem(`Cupom Netshoes atualizado em ${json.total || 0} ofertas.`)
  }

  async function reimportar(oferta: OfertaAfiliada) {
    setErro('')
    setSalvando(true)
    const res = await fetch('/api/admin/cms/ofertas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: oferta.id, reimportar: true }),
    })
    const json = await res.json()
    setSalvando(false)

    if (!res.ok) {
      setErro(json.error || 'Erro ao atualizar dados da oferta.')
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
          Cadastre links afiliados de camisas novas. Netshoes usa curadoria manual com cupom AGUANTE.
        </p>
      </div>

      <form onSubmit={atualizarCupomNetshoes} style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ color: '#1A1A1A', fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
              Cupom Netshoes
            </h2>
            <p style={{ color: '#8A8880', fontSize: 13, margin: '4px 0 0' }}>
              Atualiza o percentual e recalcula os preços com cupom nas ofertas elegíveis.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 120px 140px minmax(260px, 1fr) auto', gap: 12, alignItems: 'end', flex: '1 1 780px' }}>
            <Campo label="Cupom">
              <input value={cupomNetshoesCodigo} onChange={event => setCupomNetshoesCodigo(event.target.value.toUpperCase())} style={campoStyle} />
            </Campo>
            <Campo label="Desconto (%)">
              <input value={cupomNetshoesPercentual} onChange={event => setCupomNetshoesPercentual(event.target.value)} min={0} type="number" style={campoStyle} />
            </Campo>
            <Campo label="Desconto máx. (R$)">
              <input value={cupomNetshoesDescontoMaximo} onChange={event => setCupomNetshoesDescontoMaximo(event.target.value)} min={0} placeholder="70" step="0.01" type="number" style={campoStyle} />
            </Campo>
            <Campo label="Regra">
              <input value={cupomNetshoesDescricao} onChange={event => setCupomNetshoesDescricao(event.target.value)} style={campoStyle} />
            </Campo>
            <button disabled={salvandoCupomNetshoes} type="submit" style={{ height: 42, border: 'none', borderRadius: 8, background: '#282828', color: '#fff', cursor: salvandoCupomNetshoes ? 'wait' : 'pointer', font: '700 13px Onest, sans-serif', padding: '0 18px', opacity: salvandoCupomNetshoes ? 0.65 : 1, whiteSpace: 'nowrap' }}>
              {salvandoCupomNetshoes ? 'Aplicando...' : 'Aplicar em todas'}
            </button>
          </div>
        </div>
      </form>

      <form onSubmit={cadastrar} style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(320px, 1fr) 110px auto', gap: 12, alignItems: 'end' }}>
          <Campo label="Loja">
            <select value={loja} onChange={event => selecionarLoja(event.target.value as Loja)} style={campoStyle}>
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
        {loja === 'Netshoes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '160px 120px 140px minmax(260px, 1fr)', gap: 12, marginTop: 14 }}>
            <Campo label="Cupom">
              <input value={cupomCodigo} onChange={event => setCupomCodigo(event.target.value.toUpperCase())} style={campoStyle} />
            </Campo>
            <Campo label="Desconto (%)">
              <input value={cupomPercentual} onChange={event => setCupomPercentual(event.target.value)} min={0} type="number" style={campoStyle} />
            </Campo>
            <Campo label="Desconto máx. (R$)">
              <input value={cupomDescontoMaximo} onChange={event => setCupomDescontoMaximo(event.target.value)} min={0} step="0.01" type="number" style={campoStyle} />
            </Campo>
            <Campo label="Regra">
              <input value={cupomDescricao} onChange={event => setCupomDescricao(event.target.value)} style={campoStyle} />
            </Campo>
          </div>
        )}
        <p style={{ color: '#8A8880', fontSize: 12, lineHeight: 1.35, marginTop: 12 }}>
          Ao cadastrar, o painel busca foto, título e preço do produto. Cupom não válido para produtos com tag SELEÇÃO.
        </p>
      </form>

      {erro && (
        <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', borderRadius: 8, color: '#8A4B00', fontSize: 13, marginBottom: 20, padding: '12px 14px' }}>
          {erro}
        </div>
      )}
      {mensagem && (
        <div style={{ background: '#E8FFF4', border: '1px solid #BDEFD8', borderRadius: 8, color: '#087443', fontSize: 13, marginBottom: 20, padding: '12px 14px' }}>
          {mensagem}
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
                {['Oferta', 'Loja', 'Preço', 'Cupom', 'Ordem', 'Status', 'Link', ''].map(coluna => (
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
                  <td style={celulaStyle}>
                    {moeda(oferta.preco)}
                    {typeof oferta.preco_com_cupom === 'number' && Number.isFinite(oferta.preco_com_cupom) && (
                      <div style={{ color: '#087443', fontSize: 11, fontWeight: 700, marginTop: 3 }}>
                        com cupom {moeda(oferta.preco_com_cupom)}
                      </div>
                    )}
                  </td>
                  <td style={{ ...celulaStyle, minWidth: 190 }}>
                    <div style={{ display: 'grid', gap: 6, gridTemplateColumns: '92px 70px 82px', marginBottom: 6 }}>
                      <input
                        defaultValue={oferta.cupom_codigo || ''}
                        placeholder="Cupom"
                        onBlur={event => {
                          const valor = event.currentTarget.value.trim().toUpperCase()
                          if (valor !== (oferta.cupom_codigo || '')) atualizar(oferta, { cupom_codigo: valor })
                        }}
                        style={{ ...campoStyle, height: 34 }}
                      />
                      <input
                        defaultValue={oferta.cupom_percentual ?? ''}
                        min={0}
                        placeholder="%"
                        type="number"
                        onBlur={event => {
                          const valor = event.currentTarget.value === '' ? null : Math.max(0, Number(event.currentTarget.value) || 0)
                          if (valor !== oferta.cupom_percentual) atualizar(oferta, { cupom_percentual: valor })
                        }}
                        style={{ ...campoStyle, height: 34 }}
                      />
                      <input
                        defaultValue={oferta.cupom_desconto_maximo ?? ''}
                        min={0}
                        placeholder="máx."
                        step="0.01"
                        type="number"
                        onBlur={event => {
                          const valor = event.currentTarget.value === '' ? null : Math.max(0, Number(event.currentTarget.value) || 0)
                          if (valor !== (oferta.cupom_desconto_maximo ?? null)) atualizar(oferta, { cupom_desconto_maximo: valor })
                        }}
                        style={{ ...campoStyle, height: 34 }}
                      />
                    </div>
                    <input
                      defaultValue={oferta.cupom_descricao || ''}
                      placeholder="Regra do cupom"
                      onBlur={event => {
                        const valor = event.currentTarget.value.trim()
                        if (valor !== (oferta.cupom_descricao || '')) atualizar(oferta, { cupom_descricao: valor })
                      }}
                      style={{ ...campoStyle, height: 34, width: '100%' }}
                    />
                  </td>
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
                    <button disabled={salvando} onClick={() => reimportar(oferta)} style={{ background: 'none', border: 'none', color: '#550fed', cursor: salvando ? 'wait' : 'pointer', font: '700 12px Onest, sans-serif', padding: 6, marginRight: 8 }}>
                      atualizar dados
                    </button>
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
