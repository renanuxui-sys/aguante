type ProdutoComFonte = {
  fonte_nome?: string | null
  cupom_ativo?: boolean
}

function normalizarLoja(loja: string | null | undefined) {
  return loja?.trim().toLowerCase() || ''
}

export async function carregarLojasComCupomAtivo(
  buscarOfertas: () => PromiseLike<{ data: Array<{ loja: string | null }> | null; error: { message: string } | null }>
) {
  try {
    const { data, error } = await buscarOfertas()

    if (error) throw new Error(error.message)

    return new Set((data || []).map(oferta => normalizarLoja(oferta.loja)).filter(Boolean))
  } catch (error) {
    console.warn('Não foi possível carregar lojas com cupom:', error instanceof Error ? error.message : error)
    return new Set<string>()
  }
}

export function aplicarCupomAtivo<T extends ProdutoComFonte>(produtos: T[], lojasComCupom: Set<string>) {
  if (lojasComCupom.size === 0) return produtos

  return produtos.map(produto => ({
    ...produto,
    cupom_ativo: lojasComCupom.has(normalizarLoja(produto.fonte_nome)),
  }))
}
