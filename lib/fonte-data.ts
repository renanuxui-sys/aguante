import type { SupabaseClient } from '@supabase/supabase-js'

type QueryComNot = {
  not: (column: string, operator: string, value: string) => QueryComNot
}

function valorInPostgrest(valores: string[]) {
  return `(${valores.map(valor => `"${valor.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')})`
}

export async function carregarNomesFontesOcultas(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('fontes')
    .select('nome')
    .eq('visivel_site', false)

  if (error) {
    if (error.message.toLowerCase().includes('visivel_site')) return []
    throw error
  }

  return (data || [])
    .map(fonte => fonte.nome)
    .filter((nome): nome is string => Boolean(nome))
}

export function aplicarFiltroFontesVisiveis<T>(query: T, nomesOcultos: string[]) {
  if (nomesOcultos.length === 0) return query
  return (query as T & QueryComNot).not('fonte_nome', 'in', valorInPostgrest(nomesOcultos)) as T
}
