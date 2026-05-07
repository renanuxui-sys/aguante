import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const imgPele = '/assets/pele.jpg'
const imgBgHero = '/assets/bg-hero.png'

export const metadata: Metadata = {
  title: 'Conheça Aguante — Aguante',
  description: 'A paixão pelo futebol continua nas histórias, nas memórias e nas camisas que marcaram gerações.',
}

export default function SobrePage() {
  return (
    <>
      <style>{`
        .sobre-page {
          min-height: 100vh;
          background:
            linear-gradient(to bottom, transparent 60%, #f5f5f5 100%) top center / 100% 700px no-repeat,
            url('${imgBgHero}') top center / 100% 700px no-repeat,
            #f5f5f5;
          color: #0b0b0d;
          font-family: Onest, sans-serif;
          padding: 154px 0 120px;
        }

        .sobre-container {
          width: min(100% - 48px, 1140px);
          margin: 0 auto;
        }

        .sobre-kicker {
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

        .sobre-hero {
          max-width: 760px;
        }

        .sobre-title {
          margin: 23px 0 26px;
          color: #050505;
          font-size: 82px;
          font-weight: 300;
          line-height: 0.92;
          letter-spacing: -0.065em;
        }

        .sobre-title-emphasis {
          font-family: 'Instrument Serif', serif;
          font-style: italic;
          font-weight: 400;
          letter-spacing: -0.075em;
        }

        .sobre-subtitle {
          max-width: 520px;
          margin: 0;
          color: rgba(0, 0, 0, 0.58);
          font-size: 24px;
          font-weight: 300;
          line-height: 1.14;
          letter-spacing: -0.04em;
        }

        .sobre-intro-grid {
          display: grid;
          grid-template-columns: minmax(0, 520px) minmax(320px, 470px);
          justify-content: space-between;
          align-items: center;
          gap: 72px;
          margin-top: 102px;
        }

        .sobre-copy {
          color: #08080b;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.28;
          letter-spacing: -0.02em;
        }

        .sobre-copy p {
          margin: 0;
        }

        .sobre-copy p + p {
          margin-top: 18px;
        }

        .sobre-photo {
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-radius: 17px;
          box-shadow: 0 38px 46px rgba(74, 69, 82, 0.16);
        }

        .sobre-photo img {
          display: block;
          width: 125%;
          height: 125%;
          object-fit: cover;
          max-width: none;
          transform: translate(-10.6%, -2.6%);
          transform-origin: top left;
        }

        .sobre-columns {
          display: grid;
          grid-template-columns: minmax(0, 520px) minmax(0, 470px);
          justify-content: space-between;
          gap: 72px;
          margin-top: 110px;
        }

        .sobre-block h2 {
          margin: 0 0 34px;
          color: #000;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.045em;
        }

        .sobre-block p,
        .sobre-block li {
          color: #07070a;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.28;
          letter-spacing: -0.02em;
        }

        .sobre-block p {
          margin: 0;
        }

        .sobre-block p + p {
          margin-top: 18px;
        }

        .sobre-list {
          margin: 18px 0 0;
          padding: 0;
          list-style: none;
        }

        .sobre-list li {
          position: relative;
          padding-left: 22px;
        }

        .sobre-list li::before {
          content: '';
          position: absolute;
          left: 2px;
          top: 0.62em;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #550fed;
        }

        .sobre-ending {
          max-width: 580px;
          margin-top: 108px;
        }

        @media (max-width: 900px) {
          .sobre-page {
            padding: 118px 0 88px;
          }

          .sobre-container {
            width: min(100% - 40px, 640px);
          }

          .sobre-title {
            font-size: clamp(48px, 12vw, 72px);
            line-height: 0.96;
          }

          .sobre-subtitle {
            font-size: 21px;
          }

          .sobre-intro-grid,
          .sobre-columns {
            grid-template-columns: 1fr;
            gap: 42px;
          }

          .sobre-intro-grid {
            margin-top: 64px;
          }

          .sobre-columns,
          .sobre-ending {
            margin-top: 72px;
          }

          .sobre-photo {
            max-width: 470px;
          }
        }

        @media (max-width: 520px) {
          .sobre-page {
            padding-top: 102px;
          }

          .sobre-container {
            width: min(100% - 32px, 420px);
          }

          .sobre-kicker {
            font-size: 12px;
          }

          .sobre-title {
            margin-top: 18px;
            font-size: 48px;
            letter-spacing: -0.06em;
          }

          .sobre-subtitle,
          .sobre-copy,
          .sobre-block p,
          .sobre-block li {
            font-size: 16px;
            line-height: 1.34;
          }

          .sobre-block h2 {
            margin-bottom: 22px;
            font-size: 22px;
          }

          .sobre-list {
            padding-left: 0;
          }
        }
      `}</style>

      <Navbar />

      <main className="sobre-page">
        <div className="sobre-container">
          <section className="sobre-hero" aria-labelledby="sobre-title">
            <span className="sobre-kicker">Conheça Aguante</span>
            <h1 id="sobre-title" className="sobre-title">
              A paixão pelo futebol
              <br />
              <span className="sobre-title-emphasis">não termina</span> no apito
              <br />
              final.
            </h1>
            <p className="sobre-subtitle">
              Ela continua nas histórias, nas memórias e nas camisas que marcaram gerações.
            </p>
          </section>

          <section className="sobre-intro-grid" aria-label="A origem da Aguante">
            <div className="sobre-copy">
              <p>
                A Aguante nasceu para ajudar colecionadores e apaixonados por futebol a encontrar peças raras,
                históricas e especiais espalhadas pela internet, de forma mais simples, inteligente e organizada.
              </p>
              <p>
                Hoje, quem procura uma camisa antiga precisa vasculhar dezenas de marketplaces, grupos, lojas e
                anúncios diferentes. Muitas vezes sem saber se a peça é original, se o preço faz sentido ou até
                mesmo se ainda está disponível.
              </p>
              <p>
                Acreditamos que descobrir uma camisa histórica deveria ser tão especial quanto colecioná-la.
              </p>
              <p>
                Por isso criamos a Aguante: uma plataforma que reúne anúncios de diferentes fontes, organizando
                camisas de futebol colecionáveis em um único lugar.
              </p>
            </div>

            <figure className="sobre-photo" aria-label="Jogador histórico levantando o punho em um estádio">
              <img src={imgPele} alt="Jogador histórico de camisa 10 em um estádio" />
            </figure>
          </section>

          <section className="sobre-columns" aria-label="O que fazemos e por que Aguante">
            <div className="sobre-block">
              <h2>O que fazemos</h2>
              <p>
                Queremos construir a principal plataforma brasileira para descoberta e acompanhamento de camisas de
                futebol colecionáveis.
              </p>
              <p>No futuro, a Aguante também pretende oferecer:</p>
              <ul className="sobre-list">
                <li>Alertas personalizados por clube e época</li>
                <li>Histórico e comparação de preços</li>
                <li>Ferramentas para colecionadores</li>
                <li>Espaços para comunidade e troca de experiências</li>
              </ul>
            </div>

            <div className="sobre-block">
              <h2>Por que “Aguante”?</h2>
              <p>
                “Aguante” é uma expressão muito presente na cultura das torcidas latino-americanas. Ela representa
                resistência, apoio, paixão e pertencimento.
              </p>
              <p>
                Para nós, o colecionismo também carrega esse significado: preservar histórias, memórias e identidades
                através das camisas.
              </p>
            </div>
          </section>

          <section className="sobre-ending sobre-block" aria-label="Estamos só começando">
            <h2>Estamos só começando</h2>
            <p>
              A Aguante ainda está em fase inicial, evoluindo junto com a comunidade de colecionadores.
            </p>
            <p>
              Se você também acredita que futebol vai muito além dos 90 minutos, seja bem-vindo.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
