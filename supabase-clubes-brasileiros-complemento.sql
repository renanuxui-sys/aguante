-- Complementa clubes brasileiros usados no menu e na identificação.

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
values
  ('Paysandu', 'paysandu', 'Clubes Brasileiros', 'Brasil', false, true, 560),
  ('Guarani', 'guarani', 'Clubes Brasileiros', 'Brasil', false, true, 570),
  ('Santa Cruz', 'santa-cruz', 'Clubes Brasileiros', 'Brasil', false, true, 580),
  ('Figueirense', 'figueirense', 'Clubes Brasileiros', 'Brasil', false, true, 590)
on conflict (slug) do update
set
  nome = excluded.nome,
  categoria = excluded.categoria,
  pais = excluded.pais,
  ativo = true,
  ordem = excluded.ordem;
