'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CardProduto from '@/components/CardProduto'
import { supabase } from '@/lib/supabase'
import { PRODUCT_CARD_SELECT } from '@/lib/product-select'
import type { Produto } from '@/types'

const STORAGE_KEY = 'aguante_curtidos'
const imgBgHero = '/assets/bg-hero.png'

export default function FavoritosClient() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  function abrirBusca() {
    window.dispatchEvent(new CustomEvent('aguante:abrir-busca-mobile'))
  }

  useEffect(() => {
    let ativo = true

    async function carregarFavoritos() {
      try {
        const ids: string[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
        const favoritos = Array.from(new Set(ids.filter(Boolean)))

        if (!favoritos.length) {
          if (ativo) setProdutos([])
          return
        }

        const { data, error } = await supabase
          .from('produtos')
          .select(PRODUCT_CARD_SELECT)
          .in('id', favoritos)
          .eq('ativo', true)
          .returns<Produto[]>()

        if (error) throw error

        const ordem = new Map(favoritos.map((id, index) => [id, index]))
        const ordenados = (data || []).sort((a, b) => (ordem.get(a.id) ?? 0) - (ordem.get(b.id) ?? 0))
        if (ativo) setProdutos(ordenados)
      } catch (error) {
        console.warn('Não foi possível carregar favoritos:', error)
        if (ativo) setProdutos([])
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregarFavoritos()
    return () => { ativo = false }
  }, [])

  return (
    <>
      <style>{`
        .ag-fav-cards {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 218px));
          gap: 22px 12px;
          justify-content: start;
        }
        @media (max-width: 768px) {
          .ag-fav-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .ag-fav-empty {
            padding: 64px 20px 120px !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .ag-fav-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>

      <main style={{ fontFamily: 'Onest, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
        <Navbar />

        <section style={{ paddingTop: 76, position: 'relative', minHeight: 290, background: '#f5f5f5' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img src={imgBgHero} alt="" style={{ position: 'absolute', width: '100%', height: '115%', top: '-15%', objectFit: 'cover', opacity: 1 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(245,245,245,0.7) 80%, #f5f5f5 95%)' }} />
          </div>

          <div className="ag-container" style={{ position: 'relative', zIndex: 2, paddingTop: 56, paddingBottom: 40 }}>
            <p style={{ fontWeight: 300, fontSize: 36, color: '#000', letterSpacing: '-0.04em', lineHeight: 1.05, margin: 0 }}>
              Suas <strong style={{ fontWeight: 700 }}>camisas favoritas</strong>
            </p>
            <p style={{ fontWeight: 300, fontSize: 18, color: '#000', letterSpacing: '-0.02em', lineHeight: 1.35, marginTop: 18, maxWidth: 560 }}>
              Os produtos marcados com coração ficam salvos neste navegador.
            </p>
          </div>
        </section>

        <section style={{ paddingBottom: 56 }}>
          <div className="ag-container">
            {loading ? (
              <div className="ag-fav-cards">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} style={{ height: 325, background: '#ecebf0', borderRadius: 16 }} />
                ))}
              </div>
            ) : produtos.length > 0 ? (
              <div className="ag-fav-cards">
                {produtos.map(produto => <CardProduto key={produto.id} produto={produto} />)}
              </div>
            ) : (
              <div className="ag-fav-empty" style={{ padding: '80px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#000', letterSpacing: '-0.03em', marginBottom: 12 }}>
                  Nenhum favorito ainda
                </p>
                <p style={{ fontSize: 15, color: '#62748c', letterSpacing: '-0.01em', lineHeight: 1.4, marginBottom: 24 }}>
                  Toque no coração de uma camisa para encontrá-la aqui depois.
                </p>
                <button type="button" onClick={abrirBusca} className="ag-btn-primary" style={{ minHeight: 48, padding: '0 20px', border: 0, cursor: 'pointer' }}>
                  Procurar camisas
                </button>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
