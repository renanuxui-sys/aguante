export function gerarSlugLoja(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function descricaoCurtaLoja(nome: string) {
  return `Camisas antigas, históricas e colecionáveis encontradas em ${nome}`
}
