import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Busca — Aguante',
  description: 'Resultados de busca da Aguante.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
