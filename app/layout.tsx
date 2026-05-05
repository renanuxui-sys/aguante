import type { Metadata } from 'next'
import './globals.css'
import ClubePreferenceModal from '@/components/ClubePreferenceModal'

export const metadata: Metadata = {
  title: 'Aguante — O buscador do colecionador',
  description: 'A maneira mais inteligente de descobrir camisas de futebol colecionáveis.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <ClubePreferenceModal />
      </body>
    </html>
  )
}
