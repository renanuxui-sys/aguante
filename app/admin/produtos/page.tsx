'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Produto = {
  id: string
  titulo: string
  clube: string | null
  preco: number | null
  imagem_url: string | null
  link_original: string
  fonte_nome: string | null
  ativo: boolean
  de_jogo: boolean
  novidade: boolean
  alta_procura: boolean
  views: number
  likes: number
  cliques_anuncio: number
  created_at: string
}

const BADGES = [
  { campo: 'de_jogo', label: 'De jogo', cor: '#1565C0', bg: '#E3F2FD' },
  { campo: 'novidade', label: 'Novidade', cor: '#2E7D32', bg: '#E8F5E9' },
  { campo: 'alta_procura', label: 'Alta procura', cor: '#E65100', bg: '#FFF3E0' },
] as const

const POR_PAGINA = 20

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroClube, setFiltroClube] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'ativos' | 'inativos'>('todos')
  const [clubes, setClubes] = useState<string[]>([])
  const [editando, setEditando] = useState<Produto | null>(null)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)

    let query = supabase
      .from('produtos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1)

    if (busca) query = query.ilike('titulo', `%${busca}%`)
    if (filtroClube) query = query.eq('clube', filtroClube)
    if (filtroAtivo === 'ativos') query = query.eq('ativo', true)
    if (filtroAtivo === 'inativos') query = query.eq('ativo', false)

    const { data, count } = await query
    setProdutos(data || [])
    setTotal(count || 0)
    setCarregando(false)
  }, [pagina, busca, filtroClube, filtroAtivo])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    supabase
      .from('produtos')
      .select('clube')
      .not('clube', 'is', null)
      .eq('ativo', true)
      .then(({ data }) => {
        if (data) {
          const unicos = [...new Set(data.map(p => p.clube).filter(Boolean))] as string[]
          setClubes(unicos.sort())
        }
      })
  }, [])

  async function toggleAtivo(produto: Produto) {
    await supabase
      .from('produtos')
      .update({ ativo: !produto.ativo, updated_at: new Date().toISOString() })
      .eq('id', produto.id)
    carregar()
  }

  async function toggleBadge(produto: Produto, campo: 'de_jogo' | 'novidade' | 'alta_procura') {
    await supabase
      .from('produtos')
      .update({ [campo]: !produto[campo], updated_at: new Date().toISOString() })
      .eq('id', produto.id)
    carregar()
  }

  async function salvarEdicao() {
    if (!editando) return
    setSalvando(true)
    await supabase
      .from('produtos')
      .update({
        ativo: editando.ativo,
        de_jogo: editando.de_jogo,
        novidade: editando.novidade,
        alta_procura: editando.alta_procura,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editando.id)
    setSalvando(false)
    setEditando(null)
    carregar()
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
          color: '#1A1A1A', margin: 0,
        }}>
          Produtos
        </h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>
          {total.toLocaleString('pt-BR')} produtos indexados
        </p>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setPagina(0) }}
          style={{
            padding: '9px 14px',
            border: '1.5px solid #E8E6DF',
            borderRadius: 9, fontSize: 14,
            fontFamily: 'Onest, sans-serif',
            background: '#fff', color: '#1A1A1A',
            outline: 'none', width: 240,
          }}
        />

        <select
          value={filtroClube}
          onChange={e => { setFiltroClube(e.target.value); setPagina(0) }}
          style={{
            padding: '9px 14px',
            border: '1.5px solid #E8E6DF',
            borderRadius: 9, fontSize: 14,
            fontFamily: 'Onest, sans-serif',
            background: '#fff', color: filtroClube ? '#1A1A1A' : '#8A8880',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">Todos os clubes</option>
          {clubes.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ display: 'flex', border: '1.5px solid #E8E6DF', borderRadius: 9, overflow: 'hidden' }}>
          {(['todos', 'ativos', 'inativos'] as const).map(op => (
            <button
              key={op}
              onClick={() => { setFiltroAtivo(op); setPagina(0) }}
              style={{
                padding: '9px 14px',
                background: filtroAtivo === op ? '#1A1A1A' : '#fff',
                color: filtroAtivo === op ? '#fff' : '#6B6966',
                border: 'none', fontSize: 13, fontWeight: 500,
                fontFamily: 'Onest, sans-serif', cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {carregando ? (
        <div style={{ color: '#8A8880', fontSize: 14, paddingTop: 20 }}>Carregando...</div>
      ) : (
        <div style={{
          background: '#fff', border: '1px solid #E8E6DF',
          borderRadius: 14, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E6DF' }}>
                {['Produto', 'Clube', 'Badges', 'Métricas', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#8A8880',
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#8A8880', fontSize: 14 }}>
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : produtos.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: i < produtos.length - 1 ? '1px solid #F0EFEB' : 'none',
                    opacity: p.ativo ? 1 : 0.5,
                  }}
                >
                  {/* Produto */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 7,
                        background: '#F0EFEB', overflow: 'hidden', flexShrink: 0,
                      }}>
                        {p.imagem_url && (
                          <img src={p.imagem_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: '#1A1A1A',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: 220,
                        }}>
                          {p.titulo}
                        </div>
                        <div style={{ fontSize: 11, color: '#8A8880', marginTop: 2 }}>
                          {p.fonte_nome || '—'}
                          {p.preco ? ` · R$ ${p.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Clube */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#4A4845' }}>
                    {p.clube || '—'}
                  </td>

                  {/* Badges */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {BADGES.map(b => (
                        <button
                          key={b.campo}
                          onClick={() => toggleBadge(p, b.campo)}
                          title={`Toggle ${b.label}`}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 99,
                            border: `1.5px solid ${p[b.campo] ? b.cor : '#E8E6DF'}`,
                            background: p[b.campo] ? b.bg : 'transparent',
                            color: p[b.campo] ? b.cor : '#B0AEA8',
                            fontSize: 10, fontWeight: 600,
                            fontFamily: 'Onest, sans-serif',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </td>

                  {/* Métricas */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, color: '#6B6966', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>👁 {(p.views ?? 0).toLocaleString('pt-BR')} views</span>
                      <span>♥ {(p.likes ?? 0).toLocaleString('pt-BR')} likes</span>
                      <span>↗ {(p.cliques_anuncio ?? 0).toLocaleString('pt-BR')} cliques</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => toggleAtivo(p)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 99, border: 'none',
                        fontSize: 11, fontWeight: 600,
                        fontFamily: 'Onest, sans-serif',
                        cursor: 'pointer',
                        background: p.ativo ? '#E8F5E9' : '#F5F4F0',
                        color: p.ativo ? '#2E7D32' : '#8A8880',
                      }}
                    >
                      {p.ativo ? '● Ativo' : '○ Inativo'}
                    </button>
                  </td>

                  {/* Ações */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setEditando(p)}
                        style={{
                          padding: '5px 10px',
                          background: '#F0EFEB', border: 'none',
                          borderRadius: 7, fontSize: 12, fontWeight: 500,
                          fontFamily: 'Onest, sans-serif', cursor: 'pointer', color: '#4A4845',
                        }}
                      >
                        Editar
                      </button>
                      <a
                        href={p.link_original}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '5px 10px',
                          background: 'none',
                          border: '1px solid #E8E6DF',
                          borderRadius: 7, fontSize: 12, fontWeight: 500,
                          fontFamily: 'Onest, sans-serif',
                          color: '#6B6966', textDecoration: 'none',
                        }}
                      >
                        ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, fontSize: 13, color: '#6B6966',
        }}>
          <span>
            Mostrando {pagina * POR_PAGINA + 1}–{Math.min((pagina + 1) * POR_PAGINA, total)} de {total.toLocaleString('pt-BR')}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPagina(p => Math.max(0, p - 1))}
              disabled={pagina === 0}
              style={{
                padding: '7px 14px', background: pagina === 0 ? '#F0EFEB' : '#fff',
                border: '1px solid #E8E6DF', borderRadius: 8,
                fontSize: 13, fontFamily: 'Onest, sans-serif',
                cursor: pagina === 0 ? 'not-allowed' : 'pointer', color: '#4A4845',
              }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
              disabled={pagina >= totalPaginas - 1}
              style={{
                padding: '7px 14px',
                background: pagina >= totalPaginas - 1 ? '#F0EFEB' : '#fff',
                border: '1px solid #E8E6DF', borderRadius: 8,
                fontSize: 13, fontFamily: 'Onest, sans-serif',
                cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer', color: '#4A4845',
              }}
            >
              Próxima →
            </button>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {editando && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16,
            width: '100%', maxWidth: 440, padding: '32px 36px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 24,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                Editar produto
              </h2>
              <button
                onClick={() => setEditando(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8A8880' }}
              >
                ×
              </button>
            </div>

            {/* Preview */}
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: '#F5F4F0', borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8,
                background: '#E8E6DF', overflow: 'hidden', flexShrink: 0,
              }}>
                {editando.imagem_url && (
                  <img src={editando.imagem_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {editando.titulo}
                </div>
                <div style={{ fontSize: 12, color: '#8A8880' }}>{editando.clube || '—'}</div>
              </div>
            </div>

            {/* Badges */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4A4845', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
                Badges
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {BADGES.map(b => (
                  <label key={b.campo} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editando[b.campo]}
                      onChange={() => setEditando(e => e ? { ...e, [b.campo]: !e[b.campo] } : e)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{
                      fontSize: 13,
                      padding: '2px 10px',
                      borderRadius: 99,
                      background: editando[b.campo] ? b.bg : '#F0EFEB',
                      color: editando[b.campo] ? b.cor : '#8A8880',
                      fontWeight: 600,
                    }}>
                      {b.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4A4845', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
                Visibilidade
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <button
                  onClick={() => setEditando(e => e ? { ...e, ativo: !e.ativo } : e)}
                  style={{
                    width: 40, height: 22, borderRadius: 99,
                    background: editando.ativo ? '#1A1A1A' : '#E8E6DF',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: editando.ativo ? 21 : 3,
                    transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ fontSize: 13, color: '#4A4845' }}>
                  {editando.ativo ? 'Produto visível no site' : 'Produto oculto'}
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditando(null)}
                style={{
                  padding: '10px 20px', background: '#F0EFEB', border: 'none',
                  borderRadius: 9, fontSize: 13, fontWeight: 500,
                  fontFamily: 'Onest, sans-serif', cursor: 'pointer', color: '#4A4845',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvando}
                style={{
                  padding: '10px 24px',
                  background: salvando ? '#C8C6BF' : '#1A1A1A',
                  color: '#fff', border: 'none', borderRadius: 9,
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'Onest, sans-serif',
                  cursor: salvando ? 'not-allowed' : 'pointer',
                }}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}