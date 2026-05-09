-- Cadastra seleções como itens da categoria "Seleções" no menu.
-- Pode rodar mais de uma vez; registros existentes são atualizados.

with selecoes(nome, slug, ordem) as (
  values
    ('Brasil', 'brasil', 10),
    ('Argentina', 'argentina', 20),
    ('Uruguai', 'uruguai', 30),
    ('Chile', 'chile', 40),
    ('Colômbia', 'colombia', 50),
    ('Paraguai', 'paraguai', 60),
    ('Peru', 'peru', 70),
    ('Equador', 'equador', 80),
    ('México', 'mexico', 90),
    ('Estados Unidos', 'estados-unidos', 100),
    ('Canadá', 'canada', 110),
    ('Alemanha', 'alemanha', 120),
    ('Espanha', 'espanha', 130),
    ('França', 'franca', 140),
    ('Inglaterra', 'inglaterra', 150),
    ('Itália', 'italia', 160),
    ('Holanda', 'holanda', 170),
    ('Portugal', 'portugal', 180),
    ('Bélgica', 'belgica', 190),
    ('Croácia', 'croacia', 200),
    ('Japão', 'japao', 210),
    ('Coreia do Sul', 'coreia-do-sul', 220),
    ('Nigéria', 'nigeria', 230),
    ('Camarões', 'camaroes', 240),
    ('Marrocos', 'marrocos', 250)
),
atualizados as (
  update clubes c
  set
    nome = s.nome,
    categoria = 'Seleções',
    pais = 'Internacional',
    ativo = true,
    destaque = false,
    ordem = s.ordem
  from selecoes s
  where c.slug = s.slug
  returning c.slug
)
insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select s.nome, s.slug, 'Seleções', 'Internacional', false, true, s.ordem
from selecoes s
where not exists (
  select 1 from atualizados a where a.slug = s.slug
)
and not exists (
  select 1 from clubes c where c.slug = s.slug
);
