'use client'

import { useEffect, useState } from 'react'
import type { StoreCoupon } from '@/types'

type Loja = { id: string; nome: string }
type Metricas = Record<string, { reveals: number; copies: number; clicks: number; exitRate: number }>
type Alcance = Record<string, number>
type Exemplos = Record<string, Array<{ id: string; titulo: string | null; fonte_nome: string | null }>>
type RankingItem = { nome: string; total: number; detalhe?: string }
type CampanhaRanking = { nome: string; reveals: number; copies: number; clicks: number; taxa: number }
type PainelCupons = {
  resumo: {
    cuponsRevelados: number
    cuponsCopiados: number
    cliquesAposCupom: number
    leadsCaptados: number
    taxaCliqueAposCupom: number
  }
  rankings: {
    lojasReveladas: RankingItem[]
    cuponsCopiados: RankingItem[]
    clubesInteresse: RankingItem[]
    produtosSaida: RankingItem[]
    campanhas: CampanhaRanking[]
  }
}

const painelVazio: PainelCupons = {
  resumo: {
    cuponsRevelados: 0,
    cuponsCopiados: 0,
    cliquesAposCupom: 0,
    leadsCaptados: 0,
    taxaCliqueAposCupom: 0,
  },
  rankings: {
    lojasReveladas: [],
    cuponsCopiados: [],
    clubesInteresse: [],
    produtosSaida: [],
    campanhas: [],
  },
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

export default function AdminCupons() {
  const [cupons, setCupons] = useState<StoreCoupon[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [metricas, setMetricas] = useState<Metricas>({})
  const [alcance, setAlcance] = useState<Alcance>({})
  const [exemplos, setExemplos] = useState<Exemplos>({})
  const [painel, setPainel] = useState<PainelCupons>(painelVazio)
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
    setExemplos(json.exemplos || {})
    setPainel(json.painel || painelVazio)
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
    setForm(f => ({ ...f, code: '', discount_label: '', description: '', rules: '' }))
    await carregar()
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

  const resumo = painel.resumo

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: 0, color: '#1A1A1A', margin: 0 }}>Cupons teste</h1>
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

      {!carregando && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
            <MetricaCard label="Cupons revelados" valor={formatarNumero(resumo.cuponsRevelados)} />
            <MetricaCard label="Cupons copiados" valor={formatarNumero(resumo.cuponsCopiados)} />
            <MetricaCard label="Cliques após cupom" valor={formatarNumero(resumo.cliquesAposCupom)} />
            <MetricaCard label="Leads captados" valor={formatarNumero(resumo.leadsCaptados)} apoio="pendente" />
            <MetricaCard label="Taxa clique após cupom" valor={formatarPercentual(resumo.taxaCliqueAposCupom)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
            <RankingLista titulo="Lojas com mais cupons revelados" itens={painel.rankings.lojasReveladas} />
            <RankingLista titulo="Cupons mais copiados" itens={painel.rankings.cuponsCopiados} />
            <RankingLista titulo="Clubes com mais interesse" itens={painel.rankings.clubesInteresse} />
            <RankingLista titulo="Produtos com cupom que mais geraram saída" itens={painel.rankings.produtosSaida} />
            <RankingCampanhas itens={painel.rankings.campanhas} />
          </div>
        </>
      )}

      {carregando ? <div style={{ color: '#8A8880', fontSize: 14 }}>Carregando...</div> : (
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['Loja', 'Cupom', 'Benefício', 'Campanha', 'Produtos', 'Exemplos', 'Revelados', 'Copiados', 'Saídas', 'Taxa saída', 'Status'].map(coluna => (
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
                  <td style={{ ...celulaStyle, maxWidth: 280 }}>
                    {(exemplos[cupom.id] || []).length === 0 ? '-' : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(exemplos[cupom.id] || []).map(produto => (
                          <a key={produto.id} href={`/produto/${produto.id}`} target="_blank" rel="noreferrer" style={{ color: '#550fed', fontSize: 12, fontWeight: 700, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                            {produto.titulo || produto.id}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={celulaStyle}>{(metricas[cupom.id]?.reveals || 0).toLocaleString('pt-BR')}</td>
                  <td style={celulaStyle}>{(metricas[cupom.id]?.copies || 0).toLocaleString('pt-BR')}</td>
                  <td style={celulaStyle}>{(metricas[cupom.id]?.clicks || 0).toLocaleString('pt-BR')}</td>
                  <td style={celulaStyle}>{formatarPercentual(metricas[cupom.id]?.exitRate || 0)}</td>
                  <td style={celulaStyle}>
                    <button onClick={() => alternar(cupom)} style={{ background: cupom.is_active ? '#E8FFF4' : '#F0EFEB', border: 'none', borderRadius: 999, color: cupom.is_active ? '#087443' : '#6B6966', cursor: 'pointer', font: '700 12px Onest, sans-serif', padding: '6px 10px' }}>
                      {cupom.is_active ? 'Ativo' : 'Oculto'}
                    </button>
                  </td>
                </tr>
              ))}
              {cupons.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ color: '#8A8880', fontSize: 14, padding: 28 }}>Nenhum cupom cadastrado.</td>
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

function MetricaCard({ label, valor, apoio }: { label: string; valor: string; apoio?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <p style={{ color: '#6B6966', fontSize: 12, fontWeight: 700, margin: 0 }}>{label}</p>
        {apoio && <span style={{ background: '#F5F4F0', borderRadius: 999, color: '#8A8880', fontSize: 10, fontWeight: 800, padding: '3px 7px', textTransform: 'uppercase' }}>{apoio}</span>}
      </div>
      <p style={{ color: '#1A1A1A', fontSize: 28, fontWeight: 850, letterSpacing: 0, lineHeight: 1, margin: '12px 0 0' }}>{valor}</p>
    </div>
  )
}

function RankingLista({ titulo, itens }: { titulo: string; itens: RankingItem[] }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 10, padding: 16 }}>
      <h2 style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 800, letterSpacing: 0, margin: '0 0 12px' }}>{titulo}</h2>
      {itens.length === 0 ? (
        <p style={{ color: '#8A8880', fontSize: 13, margin: 0 }}>Sem dados ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {itens.map((item, index) => (
            <div key={`${item.nome}-${index}`} style={{ alignItems: 'center', display: 'grid', gap: 10, gridTemplateColumns: '24px 1fr auto' }}>
              <span style={{ color: '#8A8880', fontSize: 12, fontWeight: 800 }}>{index + 1}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 750, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome}</p>
                {item.detalhe && <p style={{ color: '#8A8880', fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.detalhe}</p>}
              </div>
              <span style={{ background: '#F5F4F0', borderRadius: 999, color: '#1A1A1A', fontSize: 12, fontWeight: 800, padding: '5px 9px' }}>{formatarNumero(item.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RankingCampanhas({ itens }: { itens: CampanhaRanking[] }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 10, padding: 16 }}>
      <h2 style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 800, letterSpacing: 0, margin: '0 0 12px' }}>Campanha com melhor performance</h2>
      {itens.length === 0 ? (
        <p style={{ color: '#8A8880', fontSize: 13, margin: 0 }}>Sem dados ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {itens.map((item, index) => (
            <div key={`${item.nome}-${index}`} style={{ display: 'grid', gap: 8 }}>
              <div style={{ alignItems: 'center', display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                <p style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 750, margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome}</p>
                <span style={{ background: '#E8FFF4', borderRadius: 999, color: '#087443', fontSize: 12, fontWeight: 800, padding: '5px 9px' }}>{formatarPercentual(item.taxa)}</span>
              </div>
              <p style={{ color: '#8A8880', fontSize: 11, margin: 0 }}>
                {formatarNumero(item.reveals)} revelados · {formatarNumero(item.copies)} copiados · {formatarNumero(item.clicks)} saídas
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatarNumero(valor: number) {
  return valor.toLocaleString('pt-BR')
}

function formatarPercentual(valor: number) {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

const celulaStyle = {
  color: '#6B6966',
  fontSize: 13,
  padding: '12px 16px',
}
