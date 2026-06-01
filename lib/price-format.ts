export function formatarPrecoProduto(preco: number | null | undefined) {
  if (typeof preco !== 'number' || !Number.isFinite(preco)) return null

  return preco.toLocaleString('pt-BR', Number.isInteger(preco)
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  )
}
