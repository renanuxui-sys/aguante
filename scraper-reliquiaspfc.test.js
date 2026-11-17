import test from 'node:test'
import assert from 'node:assert/strict'
import { extrairPagina, coletarCatalogo, sincronizarCatalogo } from './scraper-reliquiaspfc.js'

// Estrutura observada no catálogo Nuvemshop; preços de parcela e comparação
// não devem substituir o preço da variante disponível.
function card(id, titulo = 'Camisa São Paulo 2005', variantes = [{ available: true, price_number: 449.9, image_url: '//cdn.example.com/camisa.webp' }]) {
  return `<div class="js-item-product">
    <div class="js-product-container" data-variants='${JSON.stringify(variantes)}'></div>
    <a class="js-product-item-image-link-private" href="/produtos/${id}/?entry_path=category"></a>
    <div class="js-item-name">${titulo}</div>
    <span class="js-installment-price">R$149,97</span>
    <span class="js-compare-price-display">R$0,00</span>
    <span class="js-price-display">R$449,90</span>
    <div class="js-stock-label" data-label="Esgotado" style="display:none"></div>
  </div>`
}

function pagina(cards, total) {
  return `<script>LS.productsCount = ${total};</script><section class="category-body"><div class="js-product-table">${cards.join('')}</div></section>`
}

const fim = '<script>LS.productsCount = 0;</script><section class="category-body">Não temos resultados para sua pesquisa.</section>'

test('extrai preço integral, imagem, clube, ano e URL canônica; exclui peças que não são camisas e esgotados', () => {
  const html = pagina([
    card('camisa'), card('meiao', 'Meião São Paulo'), card('jaqueta', 'Jaqueta São Paulo'),
    card('vendida', 'Camisa São Paulo', [{ available: false, stock: 1, price_number: 0 }]),
    card('kit', 'Kit Camisa + Calção Goleiro São Paulo 2021'),
  ], 5)
  const resultado = extrairPagina(html)
  assert.equal(resultado.links.length, 5)
  assert.equal(resultado.produtos.length, 2)
  assert.equal(resultado.produtos[0].preco, 449.9)
  assert.equal(resultado.produtos[0].link_original, 'https://reliquiaspfc.com.br/produtos/camisa/')
  assert.equal(resultado.produtos[0].imagem_url, 'https://cdn.example.com/camisa.webp')
  assert.equal(resultado.produtos[0].clube, 'São Paulo')
  assert.equal(resultado.produtos[0].ano, '2005')
})

test('usa menor preço somente entre variantes disponíveis e visíveis', () => {
  const resultado = extrairPagina(pagina([card('variantes', 'Camisa São Paulo', [
    { available: false, price_number: 99 },
    { available: true, is_visible: false, price_number: 50 },
    { available: true, price_number: 500, image_url: '//cdn.example.com/a.webp' },
    { available: true, price_number_raw: 24990, image_url: '//cdn.example.com/b.webp' },
  ])], 1))
  assert.equal(resultado.produtos[0].preco, 249.9)
  assert.equal(resultado.produtos[0].imagem_url, 'https://cdn.example.com/b.webp')
})

test('preserva preço sob consulta sem publicar preço zero', () => {
  const resultado = extrairPagina(pagina([card('consulta', 'Camisa São Paulo', [
    { available: true, contact: true, price_number: null, price_number_raw: null, image_url: '//cdn.example.com/a.webp' },
  ])], 1))
  assert.equal(resultado.produtos.length, 1)
  assert.equal(resultado.produtos[0].preco, null)
})

test('interrompe mudanças na estrutura, estoque desconhecido e preço inválido', () => {
  assert.throws(() => extrairPagina('<h1>Indisponível</h1>'), /Total/)
  assert.throws(() => extrairPagina(pagina([card('x', 'Camisa', [])], 1)), /Estoque/)
  assert.throws(() => extrairPagina(pagina([card('x', 'Camisa', [{ available: true, price_number: 0 }])], 1)), /Preço/)
})

test('percorre páginas sem camisas disponíveis até o fim explícito', async () => {
  const pages = [pagina([card('a')], 3), pagina([card('vendida', 'Camisa', [{ available: false }])], 3), pagina([card('b')], 3), fim]
  const produtos = await coletarCatalogo({ buscar: async () => pages.shift(), esperar: async () => {} })
  assert.equal(produtos.length, 2)
  assert.equal(pages.length, 0)
})

test('rejeita final prematuro, páginas repetidas e falhas de rede', async () => {
  let pages = [pagina([card('a')], 3), fim]
  await assert.rejects(coletarCatalogo({ buscar: async () => pages.shift(), esperar: async () => {} }), /Coleta incompleta/)
  await assert.rejects(coletarCatalogo({ buscar: async () => pagina([card('a')], 3), esperar: async () => {} }), /repetida/)
  pages = [pagina([card('a')], 3), pagina([card('b')], 4)]
  await assert.rejects(coletarCatalogo({ buscar: async () => pages.shift(), esperar: async () => {} }), /mudou durante/)
  pages = [pagina([card('a')], 1), fim.replace('= 0', '= 2')]
  await assert.rejects(coletarCatalogo({ buscar: async () => pages.shift(), esperar: async () => {} }), /mudou durante/)
  pages = [pagina([card('a')], 3)]
  await assert.rejects(coletarCatalogo({ buscar: async () => {
    if (pages.length) return pages.shift()
    throw new Error('HTTP 503')
  }, esperar: async () => {} }), /HTTP 503/)
})

function bancoFalso({ ativa = true } = {}) {
  const chamadas = []
  return {
    chamadas,
    from(tabela) {
      const chamada = { tabela, operacao: 'select', filtros: [] }
      const query = {
        select() { return query },
        eq(...filtro) { chamada.filtros.push(filtro); return query },
        in(...filtro) { chamada.filtros.push(filtro); return query },
        order() { return query }, range() { return query }, maybeSingle() { return query },
        update(valores) { chamada.operacao = 'update'; chamada.valores = valores; return query },
        then(resolve, reject) {
          chamadas.push(chamada)
          const data = tabela === 'fontes' ? { id: 'fonte', ativa } : [{ id: 'antigo', link_original: 'https://reliquiaspfc.com.br/produtos/antigo/' }]
          return Promise.resolve({ data, error: null }).then(resolve, reject)
        },
      }
      return query
    },
  }
}

test('falha ao salvar preserva anúncios anteriores ativos', async () => {
  const banco = bancoFalso()
  const produtos = extrairPagina(pagina([card('novo')], 1)).produtos
  await assert.rejects(sincronizarCatalogo(banco, produtos, { salvar: async () => 0 }), /não foram desativados/)
  assert.equal(banco.chamadas.filter(c => c.tabela === 'produtos' && c.operacao === 'update').length, 0)
})

test('fonte pausada no CMS não recebe escritas', async () => {
  const banco = bancoFalso({ ativa: false })
  await sincronizarCatalogo(banco, extrairPagina(pagina([card('novo')], 1)).produtos, {
    salvar: async () => { throw new Error('Não deveria salvar') },
  })
  assert.equal(banco.chamadas.filter(c => c.operacao !== 'select').length, 0)
})
