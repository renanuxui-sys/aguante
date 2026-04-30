'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Fonte = {
  id: string
  nome: string
  url: string
  ativa: boolean
  ultimo_scraping: string | null
  total_produtos: number
  seletor_produto: string | null
  seletor_titulo: string | null
  seletor_preco: string | null
  seletor_imagem: string | null
  seletor_link: string | null
  observacoes: string | null
}

const FONTE_VAZIA: Omit<Fonte, 'id'> = {
  nome: '',
  url: '',
  ativa: true,
  ultimo_scraping: null,
  total_produtos: 0,
  seletor_produto: '',
  seletor_titulo: '',
  seletor_preco: '',
  seletor_imagem: '',
  seletor_link: '',
  observacoes: '',
}

export default function AdminFontes() {
  const [fontes, setFontes] = useState<Fonte[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Fonte | null>(null)
  const [form, setForm] = useState<Omit<Fonte, 'id'>>(FONTE_VAZIA)
  const [salvando, setSalvando] = useState(false)
  const [confirmarDelete, setConfirmarDelete] = useState<string | null>(null)

  async function carregar() {
    const { data } = await supabase
      .from('fontes')
      .select('*')
      .order('created_at', { ascending: false })
    setFontes(data || [])
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  function abrirNova() {
    setEditando(null)
    setForm(FONTE_VAZIA)
    setModalAberto(true)
  }

  function abrirEditar(fonte: Fonte) {
    setEditando(fonte)
    setForm({
      nome: fonte.nome,
      url: fonte.url,
      ativa: fonte.ativa,
      ultimo_scraping: fonte.ultimo_scraping,
      total_produtos: fonte.total_produtos,
      seletor_produto: fonte.seletor_produto || '',
      seletor_titulo: fonte.seletor_titulo || '',
      seletor_preco: fonte.seletor_preco || '',
      seletor_imagem: fonte.seletor_imagem || '',
      seletor_link: fonte.seletor_link || '',
      observacoes: fonte.observacoes || '',
    })
    setModalAberto(true)
  }

  async function salvar() {
    if (!form.nome || !form.url) return
    setSalvando(true)

    const dados = {
      nome: form.nome,
      url: form.url,
      ativa: form.ativa,
      seletor_produto: form.seletor_produto || null,
      seletor_titulo: form.seletor_titulo || null,
      seletor_preco: form.seletor_preco || null,
      seletor_imagem: form.seletor_imagem || null,
      seletor_link: form.seletor_link || null,
      observacoes: form.observacoes || null,
      updated_at: new Date().toISOString(),
    }

    if (editando) {
      await supabase.from('fontes').update(dados).eq('id', editando.id)
    } else {
      await supabase.from('fontes').insert(dados)
    }

    setSalvando(false)
    setModalAberto(false)
    carregar()
  }

  async function toggleAtiva(fonte: Fonte) {
    await supabase
      .from('fontes')
      .update({ ativa: !fonte.ativa, updated_at: new Date().toISOString() })
      .eq('id', fonte.id)
    carregar()
  }

  async function deletar(id: string) {
    await supabase.from('fontes').delete().eq('id', id)
    setConfirmarDelete(null)
    carregar()
  }

  function formatarData(iso: string | null) {
    if (!iso) return 'Nunca'
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
      }}>
        <div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
            color: '#1A1A1A', margin: 0,
          }}>
            Fontes
          </h1>
          <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
            Sites rastreados pelo scraper
          </p>
        </div>
        <button
          onClick={abrirNova}
          style={{
            padding: '10px 20px',
            background: '#1A1A1A',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'Onest, sans-serif',
            cursor: 'pointer',
          }}
        >
          + Nova fonte
        </button>
      </div>

      {/* Tabela */}
      {carregando ? (
        <div style={{ color: '#8A8880', fontSize: 14 }}>Carregando...</div>
      ) : fontes.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14,
          padding: '48px', textAlign: 'center', color: '#8A8880', fontSize: 14,
        }}>
          Nenhuma fonte cadastrada ainda.{' '}
          <button
            onClick={abrirNova}
            style={{ background: 'none', border: 'none', color: '#1A1A1A', fontWeight: 600, cursor: 'pointer', fontFamily: 'Onest, sans-serif', fontSize: 14 }}
          >
            Adicionar agora →
          </button>
        </div>
      ) : (
        <div style={{
          background: '#fff', border: '1px solid #E8E6DF',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['Site', 'Status', 'Último scraping', 'Produtos', 'Ações'].map(h => (
                  <th key={h} style={{
                    padding: '12px 20px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#8A8880',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fontes.map((fonte, i) => (
                <tr
                  key={fonte.id}
                  style={{
                    borderBottom: i < fontes.length - 1 ? '1px solid #F0EFEB' : 'none',
                  }}
                >
                  {/* Site */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                      {fonte.nome}
                    </div>
                    <div style={{ fontSize: 12, color: '#8A8880', marginTop: 2 }}>
                      {fonte.url}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      onClick={() => toggleAtiva(fonte)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 99,
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: 'Onest, sans-serif',
                        cursor: 'pointer',
                        background: fonte.ativa ? '#E8F5E9' : '#F5F4F0',
                        color: fonte.ativa ? '#2E7D32' : '#8A8880',
                      }}
                    >
                      {fonte.ativa ? '● Ativa' : '○ Inativa'}
                    </button>
                  </td>

                  {/* Último scraping */}
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B6966' }}>
                    {formatarData(fonte.ultimo_scraping)}
                  </td>

                  {/* Produtos */}
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                    {fonte.total_produtos.toLocaleString('pt-BR')}
                  </td>

                  {/* Ações */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => abrirEditar(fonte)}
                        style={{
                          padding: '5px 12px',
                          background: '#F0EFEB',
                          border: 'none',
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: 'Onest, sans-serif',
                          cursor: 'pointer',
                          color: '#4A4845',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmarDelete(fonte.id)}
                        style={{
                          padding: '5px 12px',
                          background: 'none',
                          border: '1px solid #E8E6DF',
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: 'Onest, sans-serif',
                          cursor: 'pointer',
                          color: '#C0392B',
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal adicionar/editar */}
      {modalAberto && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16,
            width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto',
            padding: '32px 36px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 28,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                {editando ? 'Editar fonte' : 'Nova fonte'}
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8A8880' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Campo label="Nome do site *" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} placeholder="ex: Memórias do Esporte" />
              <Campo label="URL *" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://exemplo.com.br" />

              <div style={{ borderTop: '1px solid #E8E6DF', paddingTop: 20, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4A4845', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Seletores CSS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Campo label="Produto (container)" value={form.seletor_produto || ''} onChange={v => setForm(f => ({ ...f, seletor_produto: v }))} placeholder="ul.products li.product" mono />
                  <Campo label="Título" value={form.seletor_titulo || ''} onChange={v => setForm(f => ({ ...f, seletor_titulo: v }))} placeholder="h2" mono />
                  <Campo label="Preço" value={form.seletor_preco || ''} onChange={v => setForm(f => ({ ...f, seletor_preco: v }))} placeholder=".price .amount" mono />
                  <Campo label="Imagem" value={form.seletor_imagem || ''} onChange={v => setForm(f => ({ ...f, seletor_imagem: v }))} placeholder="img" mono />
                  <Campo label="Link" value={form.seletor_link || ''} onChange={v => setForm(f => ({ ...f, seletor_link: v }))} placeholder="a.woocommerce-loop-product__link" mono />
                </div>
              </div>

              <Campo label="Observações" value={form.observacoes || ''} onChange={v => setForm(f => ({ ...f, observacoes: v }))} placeholder="Notas sobre este site..." textarea />

              {/* Toggle ativa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <button
                  onClick={() => setForm(f => ({ ...f, ativa: !f.ativa }))}
                  style={{
                    width: 40, height: 22, borderRadius: 99,
                    background: form.ativa ? '#1A1A1A' : '#E8E6DF',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: form.ativa ? 21 : 3,
                    transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ fontSize: 13, color: '#4A4845' }}>
                  {form.ativa ? 'Fonte ativa (será rastreada)' : 'Fonte inativa (não será rastreada)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalAberto(false)}
                style={{
                  padding: '10px 20px', background: '#F0EFEB', border: 'none',
                  borderRadius: 9, fontSize: 13, fontWeight: 500,
                  fontFamily: 'Onest, sans-serif', cursor: 'pointer', color: '#4A4845',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome || !form.url}
                style={{
                  padding: '10px 24px',
                  background: salvando || !form.nome || !form.url ? '#C8C6BF' : '#1A1A1A',
                  color: '#fff', border: 'none', borderRadius: 9,
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'Onest, sans-serif',
                  cursor: salvando || !form.nome || !form.url ? 'not-allowed' : 'pointer',
                }}
              >
                {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar fonte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação delete */}
      {confirmarDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14,
            padding: '32px 36px', maxWidth: 360, width: '100%',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 10 }}>
              Remover fonte?
            </h2>
            <p style={{ fontSize: 14, color: '#6B6966', marginBottom: 24 }}>
              Os produtos já indexados não serão removidos, mas a fonte não será mais rastreada.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmarDelete(null)}
                style={{
                  padding: '9px 18px', background: '#F0EFEB', border: 'none',
                  borderRadius: 8, fontSize: 13, fontWeight: 500,
                  fontFamily: 'Onest, sans-serif', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => deletar(confirmarDelete)}
                style={{
                  padding: '9px 18px', background: '#C0392B', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  fontFamily: 'Onest, sans-serif', cursor: 'pointer',
                }}
              >
                Sim, remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({
  label, value, onChange, placeholder, mono = false, textarea = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  textarea?: boolean
}) {
  const base: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #E8E6DF',
    borderRadius: 8,
    fontSize: mono ? 12 : 14,
    fontFamily: mono ? 'monospace' : 'Onest, sans-serif',
    background: '#FAFAF8',
    color: '#1A1A1A',
    outline: 'none',
    boxSizing: 'border-box',
    resize: textarea ? 'vertical' : undefined,
  }
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600,
        color: '#4A4845', marginBottom: 5,
        letterSpacing: '0.02em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={base}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={base}
        />
      )}
    </div>
  )
}
