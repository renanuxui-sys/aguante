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
  return `Encontre camisas antigas, retrô, históricas e colecionáveis encontradas em ${nome}. A Aguante monitora anúncios e lojas diariamente para ajudar torcedores e colecionadores a descobrir novas peças disponíveis em diferentes acervos, lojas especializadas e marketplaces.`
}
