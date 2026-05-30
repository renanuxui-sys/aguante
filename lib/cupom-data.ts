import { cuponsTesteAtivos } from '@/lib/coupon-config'

type ProdutoComFonte = {
  fonte_id?: string | null
  fonte_nome?: string | null
  cupom_ativo?: boolean
}

type CupomLojaAtivo = {
  store_id: string | null
  store_name: string | null
  valid_from?: string | null
  valid_until?: string | null
}

type ControleCuponsAtivos = {
  storeIds: Set<string>
  storeNames: string[]
}

function textoComparavel(valor: string | null | undefined) {
  return (valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function nomesParecidos(a: string | null | undefined, b: string | null | undefined) {
  const textoA = textoComparavel(a)
  const textoB = textoComparavel(b)

  if (!textoA || !textoB) return false
  if (textoA === textoB) return true
  return textoA.includes(textoB) || textoB.includes(textoA)
}

function cupomVigente(cupom: CupomLojaAtivo, agora: Date) {
  const inicioOk = !cupom.valid_from || new Date(cupom.valid_from) <= agora
  const fimOk = !cupom.valid_until || new Date(cupom.valid_until) >= agora
  return inicioOk && fimOk
}

export async function carregarLojasComCupomAtivo(
  buscarCupons: () => PromiseLike<{ data: CupomLojaAtivo[] | null; error: { message: string } | null }>
) {
  if (!cuponsTesteAtivos()) return { storeIds: new Set<string>(), storeNames: [] }

  try {
    const { data, error } = await buscarCupons()

    if (error) throw new Error(error.message)

    const agora = new Date()
    const cuponsVigentes = (data || []).filter(cupom => cupomVigente(cupom, agora))

    return {
      storeIds: new Set(cuponsVigentes.map(cupom => cupom.store_id).filter((id): id is string => Boolean(id))),
      storeNames: cuponsVigentes.map(cupom => cupom.store_name).filter((nome): nome is string => Boolean(nome)),
    }
  } catch (error) {
    console.warn('Não foi possível carregar lojas com cupom:', error instanceof Error ? error.message : error)
    return { storeIds: new Set<string>(), storeNames: [] }
  }
}

export function aplicarCupomAtivo<T extends ProdutoComFonte>(produtos: T[], lojasComCupom: ControleCuponsAtivos) {
  if (lojasComCupom.storeIds.size === 0 && lojasComCupom.storeNames.length === 0) return produtos

  return produtos.map(produto => ({
    ...produto,
    cupom_ativo: Boolean(
      (produto.fonte_id && lojasComCupom.storeIds.has(produto.fonte_id))
      || lojasComCupom.storeNames.some(nome => nomesParecidos(nome, produto.fonte_nome))
    ),
  }))
}
