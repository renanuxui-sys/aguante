type ProductDescriptionInput = {
  titulo?: string | null
  clube?: string | null
  ano?: string | null
  tags?: string[] | null
}

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function produtoEhRetro(produto: ProductDescriptionInput) {
  const textoBusca = normalizarTexto([
    produto.titulo,
    ...(produto.tags || []),
  ].filter(Boolean).join(' '))

  return /\bretro\b/.test(textoBusca)
}

export function formatarResumoProduto(produto: ProductDescriptionInput) {
  const base = produto.clube ? `Camisa do ${produto.clube}` : produto.titulo || 'Camisa de futebol colecionável'

  if (!produto.ano) return base

  const qualificacao = produtoEhRetro(produto) ? 'retrô' : 'original da época'

  return `${base} da temporada de ${produto.ano}, ${qualificacao}.`
}
