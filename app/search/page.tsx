import SearchClient from './SearchClient'
import { carregarSearchData } from '@/lib/search-data'

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function valor(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const initialParams = {
    q: valor(params?.q) || '',
    categoria: valor(params?.categoria) || null,
    clube: valor(params?.clube) || '',
    decada: valor(params?.decada) || null,
    ordenar: valor(params?.ordenar) || null,
    de_jogo: valor(params?.de_jogo) || null,
    pagina: valor(params?.pagina) || '1',
  }
  const initialData = await carregarSearchData(initialParams)

  return <SearchClient initialParams={initialParams} initialData={initialData} />
}
