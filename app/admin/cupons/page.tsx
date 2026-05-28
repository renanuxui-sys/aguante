'use client'

import { useEffect, useState } from 'react'
import type { StoreCoupon } from '@/types'

type Loja = { id: string; nome: string }
type Metricas = Record<string, { reveals: number; copies: number }>
type Alcance = Record<string, number>

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

export default function AdminCupons() {
  const [cupons, setCupons] = useState<StoreCoupon[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [metricas, setMetricas] = useState<Metricas>({})
  const [alcance, setAlcance] = useState<Alcance>({})
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    store_id: '',
    store_name: '',
    code: '',
    discount_label: '',
    description: '',
    rules: '',
    valid_from: '',
    valid_until: '',
    campaign: 'semana-cupom-free',
  })

  async function carregar() {
    setCarregando(true)
    setErro('')
    const res = await fetch('/api/admin/cms/cupons', { cache: 'no-store' })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      setErro(json?.error || 'Erro ao carregar cupons.')
      setCarregando(false)
      return
    }
    setCupons(json.cupons || [])
    setLojas(json.lojas || [])
    setMetricas(json.metricas || {})
    setAlcance(json.alcance || {})
    setCarregando(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { carregar() }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  async function cadastrar(event: React.FormEvent) {
    event.preventDefault()
    setSalvando(true)
    setErro('')
    const res = await fetch('/api/admin/cms/cupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json().catch(() => null)
    setSalvando(false)
    if (!res.ok) {
      setErro(json?.error || 'Erro ao criar cupom.')
      return
    }
    setCupons(atual => [json.cupom, ...atual])
    setForm(f => ({ ...f, code: '', discount_label: '', description: '', rules: '' }))
  }

  async function alternar(cupom: StoreCoupon) {
    const res = await fetch('/api/admin/cms/cupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cupom.id, is_active: !cupom.is_active }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      setErro(json?.error || 'Erro ao atualizar cupom.')
      return
    }
    setCupons(atual => atual.map(item => item.id === cupom.id ? json.cupom : item))
  }

  function selecionarLoja(id: string) {
    const loja = lojas.find(item => item.id === id)
    setForm(f => ({ ...f, store_id: id, store_name: loja?.nome || '' }))
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Cupons teste</h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>Cadastro simples por loja, habilitado apenas em ambiente de teste/preview.</p>
      </div>

      <form onSubmit={cadastrar} style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 150px 180px 1fr', gap: 12, alignItems: 'end', marginBottom: 12 }}>
          <Campo label="Loja">
            <select value={form.store_id} onChange={event => selecionarLoja(event.target.value)} style={campoStyle}>
              <option value="">Selecionar</option>
              {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
            </select>
          </Campo>
          <Campo label="Cupom">
            <input value={form.code} onChange={event => setForm(f => ({ ...f, code: event.target.value }))} required placeholder="AGUANTE10" style={campoStyle} />
          </Campo>
          <Campo label="Benefício">
            <input value={form.discount_label} onChange={event => setForm(f => ({ ...f, discount_label: event.target.value }))} required placeholder="10% OFF" style={campoStyle} />
          </Campo>
          <Campo label="Campanha">
            <input value={form.campaign} onChange={event => setForm(f => ({ ...f, campaign: event.target.value }))} style={campoStyle} />
          </Campo>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px 150px auto', gap: 12, alignItems: 'end' }}>
          <Campo label="Descrição">
            <input value={form.description} onChange={event => setForm(f => ({ ...f, description: event.target.value }))} placeholder="Ganhe desconto na loja" style={campoStyle} />
          </Campo>
          <Campo label="Regras">
            <input value={form.rules} onChange={event => setForm(f => ({ ...f, rules: event.target.value }))} placeholder="Válido para selecionados" style={campoStyle} />
          </Campo>
          <Campo label="Início">
            <input type="date" value={form.valid_from} onChange={event => setForm(f => ({ ...f, valid_from: event.target.value }))} style={campoStyle} />
          </Campo>
          <Campo label="Fim">
            <input type="date" value={form.valid_until} onChange={event => setForm(f => ({ ...f, valid_until: event.target.value }))} style={campoStyle} />
          </Campo>
          <button disabled={salvando} type="submit" style={{ height: 42, border: 'none', borderRadius: 8, background: '#550fed', color: '#fff', cursor: salvando ? 'wait' : 'pointer', font: '700 13px Onest, sans-serif', padding: '0 18px', opacity: salvando ? 0.65 : 1 }}>
            Cadastrar
          </button>
        </div>
      </form>

      {erro && <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', borderRadius: 8, color: '#8A4B00', fontSize: 13, marginBottom: 20, padding: '12px 14px' }}>{erro}</div>}

      {carregando ? <div style={{ color: '#8A8880', fontSize: 14 }}>Carregando...</div> : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['Loja', 'Cupom', 'Benefício', 'Campanha', 'Produtos', 'Revelados', 'Copiados', 'Status'].map(coluna => (
                  <th key={coluna} style={{ color: '#8A8880', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', padding: '12px 16px', textAlign: 'left', textTransform: 'uppercase' }}>{coluna}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cupons.map((cupom, index) => (
                <tr key={cupom.id} style={{ borderBottom: index < cupons.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
                  <td style={celulaStyle}>{cupom.store_name}</td>
                  <td style={{ ...celulaStyle, color: '#1A1A1A', fontWeight: 800, letterSpacing: '0.04em' }}>{cupom.code}</td>
                  <td style={celulaStyle}>{cupom.discount_label}</td>
                  <td style={celulaStyle}>{cupom.campaign || '-'}</td>
                  <td style={{ ...celulaStyle, color: (alcance[cupom.id] || 0) > 0 ? '#087443' : '#A23B3B', fontWeight: 700 }}>
                    {(alcance[cupom.id] || 0).toLocaleString('pt-BR')}
                  </td>
                  <td style={celulaStyle}>{(metricas[cupom.id]?.reveals || 0).toLocaleString('pt-BR')}</td>
                  <td style={celulaStyle}>{(metricas[cupom.id]?.copies || 0).toLocaleString('pt-BR')}</td>
                  <td style={celulaStyle}>
                    <button onClick={() => alternar(cupom)} style={{ background: cupom.is_active ? '#E8FFF4' : '#F0EFEB', border: 'none', borderRadius: 999, color: cupom.is_active ? '#087443' : '#6B6966', cursor: 'pointer', font: '700 12px Onest, sans-serif', padding: '6px 10px' }}>
                      {cupom.is_active ? 'Ativo' : 'Oculto'}
                    </button>
                  </td>
                </tr>
              ))}
              {cupons.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: '#8A8880', fontSize: 14, padding: 28 }}>Nenhum cupom cadastrado.</td>
                </tr>
              )}
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

const celulaStyle = {
  color: '#6B6966',
  fontSize: 13,
  padding: '12px 16px',
}
