import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import ClubePreferenceModal from '@/components/ClubePreferenceModal'

export const metadata: Metadata = {
  metadataBase: new URL('https://aguante.com.br'),
  title: 'Aguante — O buscador do colecionador',
  description: 'A maneira mais inteligente de descobrir camisas de futebol colecionáveis.',
  icons: {
    icon: '/assets/favicon.svg',
    shortcut: '/assets/favicon.svg',
  },
  openGraph: {
    title: 'Aguante — O buscador do colecionador',
    description: 'A maneira mais inteligente de descobrir camisas de futebol colecionáveis.',
    url: 'https://aguante.com.br',
    siteName: 'Aguante',
    images: [
      {
        url: '/assets/compartilhamento.jpg',
        width: 1200,
        height: 600,
        alt: 'Aguante — O buscador do colecionador',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aguante — O buscador do colecionador',
    description: 'A maneira mais inteligente de descobrir camisas de futebol colecionáveis.',
    images: ['/assets/compartilhamento.jpg'],
  },
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
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wngdz8sa3k");
          `}
        </Script>
      </body>
    </html>
  )
}
