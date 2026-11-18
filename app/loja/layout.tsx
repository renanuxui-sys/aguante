import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './loja.css'

export const metadata: Metadata = {
  title: 'Loja Aguante — Colecionáveis de futebol',
  description: 'Uma nova forma de viver o futebol está chegando à Aguante.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/loja' },
}

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <><Navbar />{children}<Footer /></>
}
