'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ProdutoMetrica = {
  id: string
  titulo: string
  clube: string
  imagem_url: string | null
  views: number
  likes: number
  cliques_anuncio: number
  fonte_nome: string
}

type ClubeContagem = {
  clube: string
  total: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [maisVistos, setMaisVistos]         = useState<ProdutoMetrica[]>([])
  const [maisClicados, setMaisClicados]     = useState<ProdutoMetrica[]>([])
  const [maisCurtidos, setMaisCurtidos]     = useState<ProdutoMetrica[]>([])
  const [clubesRanking, setClubesRanking]   = useState<ClubeContagem[]>([])
  const [totalProdutos, setTotalProdutos]   = useState(0)
  const [totalFontes, setTotalFontes]       = useState(0)
  const [totalCadastros, setTotalCadastros] = useState(0)
  const [totalAlertas, setTotalAlertas]     = useState(0)
  const [totalEscolhas, setTotalEscolhas]   = useState(0)
  const [carregando, setCarregando]         = useState(true)

  useEffect(() => {
    async function carregar() {
      const [
        { count: totProd },
        { count: totFontes },
        metricasRes,
      ] = await Promise.all([
        supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('fontes').select('id', { count: 'exact', head: true }).eq('ativa', true),
        fetch('/api/admin/cms/metricas', { cache: 'no-store' }),
      ])

      const resumoRes = await fetch('/api/admin/cms/resumo', { cache: 'no-store' })
      const resumo = resumoRes.ok ? await resumoRes.json() : { cadastros: 0, alertas: 0, escolhas: 0 }
      const metricas = metricasRes.ok
        ? await metricasRes.json()
        : { views: { produtos: [] }, cliques: { produtos: [] }, likes: { produtos: [] } }

      // Ranking de clubes com paginação — Supabase retorna max 1000 linhas por query
      const contagem: Record<string, number> = {}
      let offset = 0
      const PAGE = 1000

      while (true) {
        const { data: lote } = await supabase
          .from('produtos')
          .select('clube')
          .eq('ativo', true)
          .not('clube', 'is', null)
          .range(offset, offset + PAGE - 1)

        if (!lote || lote.length === 0) break
        lote.forEach(p => { if (p.clube) contagem[p.clube] = (contagem[p.clube] || 0) + 1 })
        if (lote.length < PAGE) break
        offset += PAGE
      }

      const ranking = Object.entries(contagem)
        .map(([clube, total]) => ({ clube, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)

      setClubesRanking(ranking)
      setMaisVistos(metricas.views?.produtos || [])
      setMaisClicados(metricas.cliques?.produtos || [])
      setMaisCurtidos(metricas.likes?.produtos || [])
      setTotalProdutos(totProd || 0)
      setTotalFontes(totFontes || 0)
      setTotalCadastros(resumo.cadastros || 0)
      setTotalAlertas(resumo.alertas || 0)
      setTotalEscolhas(resumo.escolhas || 0)
      setCarregando(false)
    }

    carregar()
  }, [])

  if (carregando) {
    return <div style={{ color: '#8A8880', fontSize: 14, paddingTop: 40 }}>Carregando dados...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#8A8880', fontSize: 14, marginTop: 4 }}>Visão geral do Aguante</p>
      </div>

      {/* Cards de totais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Produtos indexados', valor: totalProdutos.toLocaleString('pt-BR'), icon: '◈', href: '/admin/produtos' },
          { label: 'Fontes ativas', valor: totalFontes.toLocaleString('pt-BR'), icon: '⊕', href: '/admin/fontes' },
          { label: 'Cadastros CTA', valor: totalCadastros.toLocaleString('pt-BR'), icon: '✉', href: '/admin/cadastros' },
          { label: 'Alertas criados', valor: totalAlertas.toLocaleString('pt-BR'), icon: '◌', href: '/admin/alertas' },
          { label: 'Escolhas de clube', valor: totalEscolhas.toLocaleString('pt-BR'), icon: '▣', href: '/admin/preferencias-clubes' },
        ].map(card => (
          <div
            key={card.label}
            onClick={() => router.push(card.href)}
            style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: '24px 28px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 22, marginBottom: 10, color: '#4A4845' }}>{card.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: '#1A1A1A' }}>{card.valor}</div>
            <div style={{ fontSize: 13, color: '#8A8880', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Grid métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <TabelaMetrica titulo="Mais acessados" subtitulo="por views na página" dados={maisVistos} campo="views" label="views" linkTodos="/admin/mais-acessados" />
        <TabelaMetrica titulo="Mais clicados" subtitulo='cliques em "ir para o anúncio"' dados={maisClicados} campo="cliques_anuncio" label="cliques" linkTodos="/admin/mais-clicados" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <TabelaMetrica titulo="Mais curtidos" subtitulo="likes anônimos" dados={maisCurtidos} campo="likes" label="likes" linkTodos="/admin/mais-curtidos" />

        {/* Clubes */}
        <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>Clubes com mais produtos</div>
              <div style={{ fontSize: 12, color: '#8A8880', marginTop: 2 }}>total de camisas indexadas</div>
            </div>
            <a href="/admin/clubes" style={{ fontSize: 12, color: '#550fed', fontWeight: 600, textDecoration: 'none' }}>Ver todos →</a>
          </div>
          {clubesRanking.length === 0 ? <Vazio /> : (
            <div>
              {clubesRanking.map((item, i) => {
                const pct = Math.round((item.total / clubesRanking[0].total) * 100)
                return (
                  <div key={item.clube} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#1A1A1A' : '#8A8880', width: 16 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 500 }}>{item.clube}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#6B6966', fontWeight: 600 }}>{item.total.toLocaleString('pt-BR')}</span>
                    </div>
                    <div style={{ height: 4, background: '#F0EFEB', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#1A1A1A', borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabelaMetrica({ titulo, subtitulo, dados, campo, label, linkTodos }: {
  titulo: string; subtitulo: string; dados: ProdutoMetrica[]
  campo: keyof ProdutoMetrica; label: string; linkTodos?: string
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DF', borderRadius: 14, padding: '24px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A' }}>{titulo}</div>
          <div style={{ fontSize: 12, color: '#8A8880', marginTop: 2 }}>{subtitulo}</div>
        </div>
        {linkTodos && <a href={linkTodos} style={{ fontSize: 12, color: '#550fed', fontWeight: 600, textDecoration: 'none' }}>Ver todos →</a>}
      </div>
      {dados.length === 0 ? <Vazio /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dados.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < dados.length - 1 ? '1px solid #F0EFEB' : 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? '#1A1A1A' : '#B0AEA8', width: 16, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0EFEB', overflow: 'hidden', flexShrink: 0 }}>
                {p.imagem_url && <img src={p.imagem_url} alt={p.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.titulo}</div>
                <div style={{ fontSize: 11, color: '#8A8880', marginTop: 1 }}>{p.clube || '—'} · {p.fonte_nome}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', flexShrink: 0 }}>
                {Number(p[campo] || 0).toLocaleString('pt-BR')}
                <span style={{ fontSize: 10, fontWeight: 400, color: '#8A8880', marginLeft: 3 }}>{label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Vazio() {
  return <div style={{ textAlign: 'center', padding: '24px 0', color: '#B0AEA8', fontSize: 13 }}>Sem dados ainda</div>
}
