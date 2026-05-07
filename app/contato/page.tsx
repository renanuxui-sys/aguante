import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const imgEnvelope = '/assets/fi-rr-envelope.svg'
const imgBgHero = '/assets/bg-hero.png'
const emailContato = 'contato@aguante.com.br'

export const metadata: Metadata = {
  title: 'Contato — Aguante',
  description: 'Fale com a equipe da Aguante para dúvidas, sugestões, parcerias e feedbacks.',
  alternates: {
    canonical: '/contato',
  },
  openGraph: {
    title: 'Contato — Aguante',
    description: 'Fale com a equipe da Aguante para dúvidas, sugestões, parcerias e feedbacks.',
    url: '/contato',
    images: ['/assets/compartilhamento.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contato — Aguante',
    description: 'Fale com a equipe da Aguante para dúvidas, sugestões, parcerias e feedbacks.',
    images: ['/assets/compartilhamento.jpg'],
  },
}

function EmailLink() {
  return (
    <a className="contato-email" href={`mailto:${emailContato}`}>
      <img src={imgEnvelope} alt="" />
      <span>{emailContato}</span>
    </a>
  )
}

export default function ContatoPage() {
  return (
    <>
      <style>{`
        .contato-page {
          min-height: 100vh;
          background:
            linear-gradient(to bottom, transparent 60%, #f5f5f5 100%) top center / 100% 700px no-repeat,
            url('${imgBgHero}') top center / 100% 700px no-repeat,
            #f5f5f5;
          color: #0b0b0d;
          font-family: Onest, sans-serif;
          padding: 154px 0 120px;
        }

        .contato-container {
          width: min(100% - 48px, 1140px);
          margin: 0 auto;
        }

        .contato-kicker {
          display: inline-flex;
          align-items: center;
          min-height: 31px;
          padding: 5px 13px 6px;
          border: 1px solid rgba(255, 255, 255, 0.48);
          border-radius: 999px;
          background: rgba(200, 196, 213, 0.58);
          color: #15151a;
          font-size: 14px;
          font-weight: 400;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          box-shadow: 0 12px 28px rgba(115, 110, 128, 0.08);
        }

        .contato-hero {
          max-width: 760px;
        }

        .contato-title {
          margin: 23px 0 60px;
          color: #050505;
          font-size: 82px;
          font-weight: 300;
          line-height: 0.92;
          letter-spacing: -0.065em;
        }

        .contato-intro {
          max-width: 480px;
          color: #111116;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.28;
          letter-spacing: -0.02em;
        }

        .contato-intro p,
        .contato-block p {
          margin: 0;
        }

        .contato-intro p + p,
        .contato-block p + p {
          margin-top: 18px;
        }

        .contato-columns {
          display: grid;
          grid-template-columns: minmax(0, 520px) minmax(0, 520px);
          justify-content: space-between;
          gap: 72px;
          margin-top: 118px;
        }

        .contato-block h2 {
          margin: 0 0 34px;
          color: #000;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.045em;
        }

        .contato-block p,
        .contato-block li {
          color: #07070a;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.28;
          letter-spacing: -0.02em;
        }

        .contato-list {
          margin: 18px 0 0;
          padding: 0;
          list-style: none;
        }

        .contato-list li {
          position: relative;
          padding-left: 22px;
        }

        .contato-list li::before {
          content: '';
          position: absolute;
          left: 2px;
          top: 0.62em;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #550fed;
        }

        .contato-email {
          display: inline-flex;
          align-items: center;
          gap: 18px;
          margin-top: 34px;
          color: #06060a;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          text-decoration: none;
          transition: color 150ms ease, transform 150ms ease;
        }

        .contato-email:hover {
          color: #550fed;
          transform: translateY(-1px);
        }

        .contato-email img {
          width: 27px;
          height: 27px;
          opacity: 0.42;
          transition: opacity 150ms ease;
        }

        .contato-email:hover img {
          opacity: 0.78;
        }

        .contato-ending {
          max-width: 620px;
          margin-top: 112px;
        }

        @media (max-width: 900px) {
          .contato-page {
            padding: 118px 0 88px;
          }

          .contato-container {
            width: min(100% - 40px, 640px);
          }

          .contato-title {
            margin-bottom: 42px;
            font-size: clamp(48px, 12vw, 72px);
            line-height: 0.96;
          }

          .contato-columns {
            grid-template-columns: 1fr;
            gap: 58px;
            margin-top: 72px;
          }

          .contato-ending {
            margin-top: 72px;
          }
        }

        @media (max-width: 520px) {
          .contato-page {
            padding-top: 102px;
          }

          .contato-container {
            width: min(100% - 32px, 420px);
          }

          .contato-kicker {
            font-size: 12px;
          }

          .contato-title {
            margin-top: 18px;
            font-size: 48px;
            letter-spacing: -0.06em;
          }

          .contato-intro,
          .contato-block p,
          .contato-block li {
            font-size: 16px;
            line-height: 1.34;
          }

          .contato-block h2 {
            margin-bottom: 22px;
            font-size: 22px;
          }

          .contato-list {
            padding-left: 0;
          }

          .contato-email {
            gap: 14px;
            margin-top: 28px;
          }
        }
      `}</style>

      <Navbar />

      <main className="contato-page">
        <div className="contato-container">
          <section className="contato-hero" aria-labelledby="contato-title">
            <span className="contato-kicker">Fale conosco</span>
            <h1 id="contato-title" className="contato-title">
              Entre em contato
              <br />
              com nossa equipe
            </h1>
            <div className="contato-intro">
              <p>
                Tem alguma dúvida, sugestão, parceria ou encontrou uma camisa incrível que deveria aparecer na
                plataforma?
              </p>
              <p>
                Estamos construindo a Aguante junto com a comunidade e queremos ouvir você.
              </p>
            </div>
          </section>

          <section className="contato-columns" aria-label="Canais de contato">
            <div className="contato-block">
              <h2>Entre em contato</h2>
              <p>Se você quiser falar sobre:</p>
              <ul className="contato-list">
                <li>sugestões para a plataforma</li>
                <li>problemas em anúncios ou links</li>
                <li>lojas e parcerias</li>
                <li>imprensa ou colaborações</li>
                <li>feedbacks sobre a experiência</li>
                <li>colecionismo e camisas históricas</li>
              </ul>
              <EmailLink />
            </div>

            <div className="contato-block">
              <h2>Para lojas e vendedores</h2>
              <p>Possui uma loja, perfil ou acervo de camisas colecionáveis?</p>
              <p>
                Estamos expandindo constantemente as fontes monitoradas pela Aguante e buscamos parceiros que
                compartilhem da paixão pelo colecionismo e pela cultura do futebol.
              </p>
              <EmailLink />
            </div>
          </section>

          <section className="contato-ending contato-block" aria-label="Estamos evoluindo constantemente">
            <h2>Estamos evoluindo constantemente</h2>
            <p>
              A Aguante ainda está em fase inicial, e muitos recursos estão sendo construídos junto com os primeiros
              usuários da plataforma.
            </p>
            <p>Seu feedback ajuda diretamente na evolução do projeto.</p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
