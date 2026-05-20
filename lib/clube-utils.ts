export function gerarSlugClube(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function descricaoCurtaClube(nome: string) {
  return `Encontre camisas do ${nome} antigas, retrô, históricas e colecionáveis reunidas em um só lugar. A Aguante monitora anúncios e lojas diariamente para ajudar torcedores e colecionadores a descobrir novas peças do ${nome} em diferentes lojas especializadas e marketplaces.`
}
