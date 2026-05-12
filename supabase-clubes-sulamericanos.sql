-- Cadastra clubes sul-americanos no menu e na base de identificação.
-- Pode rodar mais de uma vez; registros existentes são atualizados por slug.

begin;

create temporary table _clubes_internacionais (
  nome text,
  slug text,
  categoria text,
  pais text,
  ordem integer
) on commit drop;

insert into _clubes_internacionais (nome, slug, categoria, pais, ordem)
values
-- Argentina
    ('Boca Juniors', 'boca-juniors', 'Clubes Sulamericanos', 'Argentina', 1000),
('River Plate', 'river-plate', 'Clubes Sulamericanos', 'Argentina', 1010),
('Independiente', 'independiente', 'Clubes Sulamericanos', 'Argentina', 1020),
('Racing Club', 'racing-club', 'Clubes Sulamericanos', 'Argentina', 1030),
('San Lorenzo', 'san-lorenzo', 'Clubes Sulamericanos', 'Argentina', 1040),
('Vélez Sarsfield', 'velez-sarsfield', 'Clubes Sulamericanos', 'Argentina', 1050),
('Estudiantes', 'estudiantes-la-plata', 'Clubes Sulamericanos', 'Argentina', 1060),
('Newell''s Old Boys', 'newells-old-boys', 'Clubes Sulamericanos', 'Argentina', 1070),
('Rosario Central', 'rosario-central', 'Clubes Sulamericanos', 'Argentina', 1080),
('Huracán', 'huracan', 'Clubes Sulamericanos', 'Argentina', 1090),
('Lanús', 'lanus', 'Clubes Sulamericanos', 'Argentina', 1100),
('Banfield', 'banfield', 'Clubes Sulamericanos', 'Argentina', 1110),
('Argentinos Juniors', 'argentinos-juniors', 'Clubes Sulamericanos', 'Argentina', 1120),
('Gimnasia La Plata', 'gimnasia-la-plata', 'Clubes Sulamericanos', 'Argentina', 1130),
('Talleres', 'talleres-cordoba', 'Clubes Sulamericanos', 'Argentina', 1140),
('Belgrano', 'belgrano-cordoba', 'Clubes Sulamericanos', 'Argentina', 1150),
('Colón', 'colon-santa-fe', 'Clubes Sulamericanos', 'Argentina', 1160),
('Unión Santa Fe', 'union-santa-fe', 'Clubes Sulamericanos', 'Argentina', 1170),
('Godoy Cruz', 'godoy-cruz', 'Clubes Sulamericanos', 'Argentina', 1180),
('Defensa y Justicia', 'defensa-y-justicia', 'Clubes Sulamericanos', 'Argentina', 1190),
('Tigre', 'tigre-argentina', 'Clubes Sulamericanos', 'Argentina', 1200),
('Platense', 'platense-argentina', 'Clubes Sulamericanos', 'Argentina', 1210),
('Chacarita Juniors', 'chacarita-juniors', 'Clubes Sulamericanos', 'Argentina', 1220),
('Ferro Carril Oeste', 'ferro-carril-oeste', 'Clubes Sulamericanos', 'Argentina', 1230),
('Quilmes', 'quilmes', 'Clubes Sulamericanos', 'Argentina', 1240),
('All Boys', 'all-boys', 'Clubes Sulamericanos', 'Argentina', 1250),
('Atlanta', 'atlanta-argentina', 'Clubes Sulamericanos', 'Argentina', 1260),
('Nueva Chicago', 'nueva-chicago', 'Clubes Sulamericanos', 'Argentina', 1270),
-- Uruguai
    ('Peñarol', 'penarol', 'Clubes Sulamericanos', 'Uruguai', 1300),
('Nacional (Uruguai)', 'nacional-uruguay', 'Clubes Sulamericanos', 'Uruguai', 1310),
('Defensor Sporting', 'defensor-sporting', 'Clubes Sulamericanos', 'Uruguai', 1320),
('Danubio', 'danubio', 'Clubes Sulamericanos', 'Uruguai', 1330),
('Liverpool Montevideo', 'liverpool-montevideo', 'Clubes Sulamericanos', 'Uruguai', 1340),
('Montevideo Wanderers', 'montevideo-wanderers', 'Clubes Sulamericanos', 'Uruguai', 1350),
('River Plate Montevideo', 'river-plate-montevideo', 'Clubes Sulamericanos', 'Uruguai', 1360),
('Cerro (Uruguai)', 'cerro-uruguay', 'Clubes Sulamericanos', 'Uruguai', 1370),
('Cerro Largo', 'cerro-largo', 'Clubes Sulamericanos', 'Uruguai', 1380),
('Rampla Juniors', 'rampla-juniors', 'Clubes Sulamericanos', 'Uruguai', 1390),
('Bella Vista', 'bella-vista', 'Clubes Sulamericanos', 'Uruguai', 1400),
('Progreso (Uruguai)', 'progreso-uruguay', 'Clubes Sulamericanos', 'Uruguai', 1410),
('Fénix (Uruguai)', 'fenix-uruguay', 'Clubes Sulamericanos', 'Uruguai', 1420),
('Racing Montevideo', 'racing-montevideo', 'Clubes Sulamericanos', 'Uruguai', 1430),
-- Chile
    ('Colo-Colo', 'colo-colo', 'Clubes Sulamericanos', 'Chile', 1500),
('Universidad de Chile', 'universidad-de-chile', 'Clubes Sulamericanos', 'Chile', 1510),
('Universidad Católica', 'universidad-catolica', 'Clubes Sulamericanos', 'Chile', 1520),
('Cobreloa', 'cobreloa', 'Clubes Sulamericanos', 'Chile', 1530),
('Unión Española', 'union-espanola', 'Clubes Sulamericanos', 'Chile', 1540),
('Palestino', 'palestino', 'Clubes Sulamericanos', 'Chile', 1550),
('Audax Italiano', 'audax-italiano', 'Clubes Sulamericanos', 'Chile', 1560),
('Everton de Viña del Mar', 'everton-vina-del-mar', 'Clubes Sulamericanos', 'Chile', 1570),
('Santiago Wanderers', 'santiago-wanderers', 'Clubes Sulamericanos', 'Chile', 1580),
('O''Higgins', 'ohiggins', 'Clubes Sulamericanos', 'Chile', 1590),
-- Paraguai
    ('Olimpia (Paraguai)', 'olimpia-paraguay', 'Clubes Sulamericanos', 'Paraguai', 1600),
('Cerro Porteño', 'cerro-porteno', 'Clubes Sulamericanos', 'Paraguai', 1610),
('Libertad (Paraguai)', 'libertad-paraguay', 'Clubes Sulamericanos', 'Paraguai', 1620),
('Guaraní (Paraguai)', 'guarani-paraguay', 'Clubes Sulamericanos', 'Paraguai', 1630),
('Nacional-PAR', 'nacional-paraguay', 'Clubes Sulamericanos', 'Paraguai', 1640),
('Sol de América', 'sol-de-america', 'Clubes Sulamericanos', 'Paraguai', 1650),
('Sportivo Luqueño', 'sportivo-luqueno', 'Clubes Sulamericanos', 'Paraguai', 1660),
-- Equador
    ('LDU', 'ldu-quito', 'Clubes Sulamericanos', 'Equador', 1700),
('Barcelona SC', 'barcelona-sc', 'Clubes Sulamericanos', 'Equador', 1710),
('Emelec', 'emelec', 'Clubes Sulamericanos', 'Equador', 1720),
('Independiente del Valle', 'independiente-del-valle', 'Clubes Sulamericanos', 'Equador', 1730),
('Deportivo Quito', 'deportivo-quito', 'Clubes Sulamericanos', 'Equador', 1740),
('El Nacional', 'el-nacional', 'Clubes Sulamericanos', 'Equador', 1750),
('Aucas', 'aucas', 'Clubes Sulamericanos', 'Equador', 1760),
-- Colômbia
    ('Atlético Nacional', 'atletico-nacional', 'Clubes Sulamericanos', 'Colômbia', 1800),
('Millonarios', 'millonarios', 'Clubes Sulamericanos', 'Colômbia', 1810),
('América de Cali', 'america-de-cali', 'Clubes Sulamericanos', 'Colômbia', 1820),
('Deportivo Cali', 'deportivo-cali', 'Clubes Sulamericanos', 'Colômbia', 1830),
('Santa Fe', 'independiente-santa-fe', 'Clubes Sulamericanos', 'Colômbia', 1840),
('Junior Barranquilla', 'junior-barranquilla', 'Clubes Sulamericanos', 'Colômbia', 1850),
('Once Caldas', 'once-caldas', 'Clubes Sulamericanos', 'Colômbia', 1860),
('Deportes Tolima', 'deportes-tolima', 'Clubes Sulamericanos', 'Colômbia', 1870),
('Independiente Medellín', 'independiente-medellin', 'Clubes Sulamericanos', 'Colômbia', 1880),
-- Peru
    ('Alianza Lima', 'alianza-lima', 'Clubes Sulamericanos', 'Peru', 1900),
('Universitario (Peru)', 'universitario-peru', 'Clubes Sulamericanos', 'Peru', 1910),
('Sporting Cristal', 'sporting-cristal', 'Clubes Sulamericanos', 'Peru', 1920),
('Melgar', 'melgar', 'Clubes Sulamericanos', 'Peru', 1930),
('Cienciano', 'cienciano', 'Clubes Sulamericanos', 'Peru', 1940),
('Sport Boys', 'sport-boys', 'Clubes Sulamericanos', 'Peru', 1950),
-- Bolívia
    ('Bolívar', 'bolivar', 'Clubes Sulamericanos', 'Bolívia', 2000),
('The Strongest', 'the-strongest', 'Clubes Sulamericanos', 'Bolívia', 2010),
('Oriente Petrolero', 'oriente-petrolero', 'Clubes Sulamericanos', 'Bolívia', 2020),
('Blooming', 'blooming', 'Clubes Sulamericanos', 'Bolívia', 2030),
('Jorge Wilstermann', 'jorge-wilstermann', 'Clubes Sulamericanos', 'Bolívia', 2040),
-- Venezuela
    ('Caracas FC', 'caracas-fc', 'Clubes Sulamericanos', 'Venezuela', 2100),
('Deportivo Táchira', 'deportivo-tachira', 'Clubes Sulamericanos', 'Venezuela', 2110),
('Zamora', 'zamora-venezuela', 'Clubes Sulamericanos', 'Venezuela', 2120),
('Mineros de Guayana', 'mineros-de-guayana', 'Clubes Sulamericanos', 'Venezuela', 2130);

update clubes c
set
  nome = ci.nome,
  categoria = ci.categoria,
  pais = ci.pais,
  ativo = true,
  destaque = false,
  ordem = ci.ordem
from _clubes_internacionais ci
where c.slug = ci.slug;

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select ci.nome, ci.slug, ci.categoria, ci.pais, false, true, ci.ordem
from _clubes_internacionais ci
where not exists (
  select 1 from clubes c where c.slug = ci.slug
);

commit;
