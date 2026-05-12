-- Cadastra clubes sul-americanos.
-- Versão segura: cada clube é processado sem listas longas com vírgulas.
-- Pode rodar mais de uma vez.

begin;

update clubes
set
  nome = 'Boca Juniors',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1000
where slug = 'boca-juniors';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Boca Juniors', 'boca-juniors', 'Clubes Sulamericanos', 'Argentina', false, true, 1000
where not exists (
  select 1 from clubes where slug = 'boca-juniors'
);

update clubes
set
  nome = 'River Plate',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1010
where slug = 'river-plate';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'River Plate', 'river-plate', 'Clubes Sulamericanos', 'Argentina', false, true, 1010
where not exists (
  select 1 from clubes where slug = 'river-plate'
);

update clubes
set
  nome = 'Independiente',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1020
where slug = 'independiente';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Independiente', 'independiente', 'Clubes Sulamericanos', 'Argentina', false, true, 1020
where not exists (
  select 1 from clubes where slug = 'independiente'
);

update clubes
set
  nome = 'Racing Club',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1030
where slug = 'racing-club';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Racing Club', 'racing-club', 'Clubes Sulamericanos', 'Argentina', false, true, 1030
where not exists (
  select 1 from clubes where slug = 'racing-club'
);

update clubes
set
  nome = 'San Lorenzo',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1040
where slug = 'san-lorenzo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'San Lorenzo', 'san-lorenzo', 'Clubes Sulamericanos', 'Argentina', false, true, 1040
where not exists (
  select 1 from clubes where slug = 'san-lorenzo'
);

update clubes
set
  nome = 'Vélez Sarsfield',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1050
where slug = 'velez-sarsfield';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Vélez Sarsfield', 'velez-sarsfield', 'Clubes Sulamericanos', 'Argentina', false, true, 1050
where not exists (
  select 1 from clubes where slug = 'velez-sarsfield'
);

update clubes
set
  nome = 'Estudiantes',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1060
where slug = 'estudiantes-la-plata';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Estudiantes', 'estudiantes-la-plata', 'Clubes Sulamericanos', 'Argentina', false, true, 1060
where not exists (
  select 1 from clubes where slug = 'estudiantes-la-plata'
);

update clubes
set
  nome = 'Newell''''s Old Boys',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1070
where slug = 'newells-old-boys';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Newell''''s Old Boys', 'newells-old-boys', 'Clubes Sulamericanos', 'Argentina', false, true, 1070
where not exists (
  select 1 from clubes where slug = 'newells-old-boys'
);

update clubes
set
  nome = 'Rosario Central',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1080
where slug = 'rosario-central';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Rosario Central', 'rosario-central', 'Clubes Sulamericanos', 'Argentina', false, true, 1080
where not exists (
  select 1 from clubes where slug = 'rosario-central'
);

update clubes
set
  nome = 'Huracán',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1090
where slug = 'huracan';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Huracán', 'huracan', 'Clubes Sulamericanos', 'Argentina', false, true, 1090
where not exists (
  select 1 from clubes where slug = 'huracan'
);

update clubes
set
  nome = 'Lanús',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1100
where slug = 'lanus';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Lanús', 'lanus', 'Clubes Sulamericanos', 'Argentina', false, true, 1100
where not exists (
  select 1 from clubes where slug = 'lanus'
);

update clubes
set
  nome = 'Banfield',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1110
where slug = 'banfield';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Banfield', 'banfield', 'Clubes Sulamericanos', 'Argentina', false, true, 1110
where not exists (
  select 1 from clubes where slug = 'banfield'
);

update clubes
set
  nome = 'Argentinos Juniors',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1120
where slug = 'argentinos-juniors';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Argentinos Juniors', 'argentinos-juniors', 'Clubes Sulamericanos', 'Argentina', false, true, 1120
where not exists (
  select 1 from clubes where slug = 'argentinos-juniors'
);

update clubes
set
  nome = 'Gimnasia La Plata',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1130
where slug = 'gimnasia-la-plata';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Gimnasia La Plata', 'gimnasia-la-plata', 'Clubes Sulamericanos', 'Argentina', false, true, 1130
where not exists (
  select 1 from clubes where slug = 'gimnasia-la-plata'
);

update clubes
set
  nome = 'Talleres',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1140
where slug = 'talleres-cordoba';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Talleres', 'talleres-cordoba', 'Clubes Sulamericanos', 'Argentina', false, true, 1140
where not exists (
  select 1 from clubes where slug = 'talleres-cordoba'
);

update clubes
set
  nome = 'Belgrano',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1150
where slug = 'belgrano-cordoba';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Belgrano', 'belgrano-cordoba', 'Clubes Sulamericanos', 'Argentina', false, true, 1150
where not exists (
  select 1 from clubes where slug = 'belgrano-cordoba'
);

update clubes
set
  nome = 'Colón',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1160
where slug = 'colon-santa-fe';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Colón', 'colon-santa-fe', 'Clubes Sulamericanos', 'Argentina', false, true, 1160
where not exists (
  select 1 from clubes where slug = 'colon-santa-fe'
);

update clubes
set
  nome = 'Unión Santa Fe',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1170
where slug = 'union-santa-fe';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Unión Santa Fe', 'union-santa-fe', 'Clubes Sulamericanos', 'Argentina', false, true, 1170
where not exists (
  select 1 from clubes where slug = 'union-santa-fe'
);

update clubes
set
  nome = 'Godoy Cruz',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1180
where slug = 'godoy-cruz';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Godoy Cruz', 'godoy-cruz', 'Clubes Sulamericanos', 'Argentina', false, true, 1180
where not exists (
  select 1 from clubes where slug = 'godoy-cruz'
);

update clubes
set
  nome = 'Defensa y Justicia',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1190
where slug = 'defensa-y-justicia';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Defensa y Justicia', 'defensa-y-justicia', 'Clubes Sulamericanos', 'Argentina', false, true, 1190
where not exists (
  select 1 from clubes where slug = 'defensa-y-justicia'
);

update clubes
set
  nome = 'Tigre',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1200
where slug = 'tigre-argentina';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Tigre', 'tigre-argentina', 'Clubes Sulamericanos', 'Argentina', false, true, 1200
where not exists (
  select 1 from clubes where slug = 'tigre-argentina'
);

update clubes
set
  nome = 'Platense',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1210
where slug = 'platense-argentina';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Platense', 'platense-argentina', 'Clubes Sulamericanos', 'Argentina', false, true, 1210
where not exists (
  select 1 from clubes where slug = 'platense-argentina'
);

update clubes
set
  nome = 'Chacarita Juniors',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1220
where slug = 'chacarita-juniors';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Chacarita Juniors', 'chacarita-juniors', 'Clubes Sulamericanos', 'Argentina', false, true, 1220
where not exists (
  select 1 from clubes where slug = 'chacarita-juniors'
);

update clubes
set
  nome = 'Ferro Carril Oeste',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1230
where slug = 'ferro-carril-oeste';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Ferro Carril Oeste', 'ferro-carril-oeste', 'Clubes Sulamericanos', 'Argentina', false, true, 1230
where not exists (
  select 1 from clubes where slug = 'ferro-carril-oeste'
);

update clubes
set
  nome = 'Quilmes',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1240
where slug = 'quilmes';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Quilmes', 'quilmes', 'Clubes Sulamericanos', 'Argentina', false, true, 1240
where not exists (
  select 1 from clubes where slug = 'quilmes'
);

update clubes
set
  nome = 'All Boys',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1250
where slug = 'all-boys';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'All Boys', 'all-boys', 'Clubes Sulamericanos', 'Argentina', false, true, 1250
where not exists (
  select 1 from clubes where slug = 'all-boys'
);

update clubes
set
  nome = 'Atlanta',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1260
where slug = 'atlanta-argentina';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Atlanta', 'atlanta-argentina', 'Clubes Sulamericanos', 'Argentina', false, true, 1260
where not exists (
  select 1 from clubes where slug = 'atlanta-argentina'
);

update clubes
set
  nome = 'Nueva Chicago',
  categoria = 'Clubes Sulamericanos',
  pais = 'Argentina',
  ativo = true,
  destaque = false,
  ordem = 1270
where slug = 'nueva-chicago';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Nueva Chicago', 'nueva-chicago', 'Clubes Sulamericanos', 'Argentina', false, true, 1270
where not exists (
  select 1 from clubes where slug = 'nueva-chicago'
);

update clubes
set
  nome = 'Peñarol',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1300
where slug = 'penarol';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Peñarol', 'penarol', 'Clubes Sulamericanos', 'Uruguai', false, true, 1300
where not exists (
  select 1 from clubes where slug = 'penarol'
);

update clubes
set
  nome = 'Nacional (Uruguai)',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1310
where slug = 'nacional-uruguay';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Nacional (Uruguai)', 'nacional-uruguay', 'Clubes Sulamericanos', 'Uruguai', false, true, 1310
where not exists (
  select 1 from clubes where slug = 'nacional-uruguay'
);

update clubes
set
  nome = 'Defensor Sporting',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1320
where slug = 'defensor-sporting';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Defensor Sporting', 'defensor-sporting', 'Clubes Sulamericanos', 'Uruguai', false, true, 1320
where not exists (
  select 1 from clubes where slug = 'defensor-sporting'
);

update clubes
set
  nome = 'Danubio',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1330
where slug = 'danubio';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Danubio', 'danubio', 'Clubes Sulamericanos', 'Uruguai', false, true, 1330
where not exists (
  select 1 from clubes where slug = 'danubio'
);

update clubes
set
  nome = 'Liverpool Montevideo',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1340
where slug = 'liverpool-montevideo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Liverpool Montevideo', 'liverpool-montevideo', 'Clubes Sulamericanos', 'Uruguai', false, true, 1340
where not exists (
  select 1 from clubes where slug = 'liverpool-montevideo'
);

update clubes
set
  nome = 'Montevideo Wanderers',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1350
where slug = 'montevideo-wanderers';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Montevideo Wanderers', 'montevideo-wanderers', 'Clubes Sulamericanos', 'Uruguai', false, true, 1350
where not exists (
  select 1 from clubes where slug = 'montevideo-wanderers'
);

update clubes
set
  nome = 'River Plate Montevideo',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1360
where slug = 'river-plate-montevideo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'River Plate Montevideo', 'river-plate-montevideo', 'Clubes Sulamericanos', 'Uruguai', false, true, 1360
where not exists (
  select 1 from clubes where slug = 'river-plate-montevideo'
);

update clubes
set
  nome = 'Cerro (Uruguai)',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1370
where slug = 'cerro-uruguay';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Cerro (Uruguai)', 'cerro-uruguay', 'Clubes Sulamericanos', 'Uruguai', false, true, 1370
where not exists (
  select 1 from clubes where slug = 'cerro-uruguay'
);

update clubes
set
  nome = 'Cerro Largo',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1380
where slug = 'cerro-largo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Cerro Largo', 'cerro-largo', 'Clubes Sulamericanos', 'Uruguai', false, true, 1380
where not exists (
  select 1 from clubes where slug = 'cerro-largo'
);

update clubes
set
  nome = 'Rampla Juniors',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1390
where slug = 'rampla-juniors';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Rampla Juniors', 'rampla-juniors', 'Clubes Sulamericanos', 'Uruguai', false, true, 1390
where not exists (
  select 1 from clubes where slug = 'rampla-juniors'
);

update clubes
set
  nome = 'Bella Vista',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1400
where slug = 'bella-vista';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Bella Vista', 'bella-vista', 'Clubes Sulamericanos', 'Uruguai', false, true, 1400
where not exists (
  select 1 from clubes where slug = 'bella-vista'
);

update clubes
set
  nome = 'Progreso (Uruguai)',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1410
where slug = 'progreso-uruguay';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Progreso (Uruguai)', 'progreso-uruguay', 'Clubes Sulamericanos', 'Uruguai', false, true, 1410
where not exists (
  select 1 from clubes where slug = 'progreso-uruguay'
);

update clubes
set
  nome = 'Fénix (Uruguai)',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1420
where slug = 'fenix-uruguay';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Fénix (Uruguai)', 'fenix-uruguay', 'Clubes Sulamericanos', 'Uruguai', false, true, 1420
where not exists (
  select 1 from clubes where slug = 'fenix-uruguay'
);

update clubes
set
  nome = 'Racing Montevideo',
  categoria = 'Clubes Sulamericanos',
  pais = 'Uruguai',
  ativo = true,
  destaque = false,
  ordem = 1430
where slug = 'racing-montevideo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Racing Montevideo', 'racing-montevideo', 'Clubes Sulamericanos', 'Uruguai', false, true, 1430
where not exists (
  select 1 from clubes where slug = 'racing-montevideo'
);

update clubes
set
  nome = 'Colo-Colo',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1500
where slug = 'colo-colo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Colo-Colo', 'colo-colo', 'Clubes Sulamericanos', 'Chile', false, true, 1500
where not exists (
  select 1 from clubes where slug = 'colo-colo'
);

update clubes
set
  nome = 'Universidad de Chile',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1510
where slug = 'universidad-de-chile';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Universidad de Chile', 'universidad-de-chile', 'Clubes Sulamericanos', 'Chile', false, true, 1510
where not exists (
  select 1 from clubes where slug = 'universidad-de-chile'
);

update clubes
set
  nome = 'Universidad Católica',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1520
where slug = 'universidad-catolica';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Universidad Católica', 'universidad-catolica', 'Clubes Sulamericanos', 'Chile', false, true, 1520
where not exists (
  select 1 from clubes where slug = 'universidad-catolica'
);

update clubes
set
  nome = 'Cobreloa',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1530
where slug = 'cobreloa';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Cobreloa', 'cobreloa', 'Clubes Sulamericanos', 'Chile', false, true, 1530
where not exists (
  select 1 from clubes where slug = 'cobreloa'
);

update clubes
set
  nome = 'Unión Española',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1540
where slug = 'union-espanola';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Unión Española', 'union-espanola', 'Clubes Sulamericanos', 'Chile', false, true, 1540
where not exists (
  select 1 from clubes where slug = 'union-espanola'
);

update clubes
set
  nome = 'Palestino',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1550
where slug = 'palestino';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Palestino', 'palestino', 'Clubes Sulamericanos', 'Chile', false, true, 1550
where not exists (
  select 1 from clubes where slug = 'palestino'
);

update clubes
set
  nome = 'Audax Italiano',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1560
where slug = 'audax-italiano';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Audax Italiano', 'audax-italiano', 'Clubes Sulamericanos', 'Chile', false, true, 1560
where not exists (
  select 1 from clubes where slug = 'audax-italiano'
);

update clubes
set
  nome = 'Everton de Viña del Mar',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1570
where slug = 'everton-vina-del-mar';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Everton de Viña del Mar', 'everton-vina-del-mar', 'Clubes Sulamericanos', 'Chile', false, true, 1570
where not exists (
  select 1 from clubes where slug = 'everton-vina-del-mar'
);

update clubes
set
  nome = 'Santiago Wanderers',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1580
where slug = 'santiago-wanderers';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Santiago Wanderers', 'santiago-wanderers', 'Clubes Sulamericanos', 'Chile', false, true, 1580
where not exists (
  select 1 from clubes where slug = 'santiago-wanderers'
);

update clubes
set
  nome = 'O''''Higgins',
  categoria = 'Clubes Sulamericanos',
  pais = 'Chile',
  ativo = true,
  destaque = false,
  ordem = 1590
where slug = 'ohiggins';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'O''''Higgins', 'ohiggins', 'Clubes Sulamericanos', 'Chile', false, true, 1590
where not exists (
  select 1 from clubes where slug = 'ohiggins'
);

update clubes
set
  nome = 'Olimpia (Paraguai)',
  categoria = 'Clubes Sulamericanos',
  pais = 'Paraguai',
  ativo = true,
  destaque = false,
  ordem = 1600
where slug = 'olimpia-paraguay';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Olimpia (Paraguai)', 'olimpia-paraguay', 'Clubes Sulamericanos', 'Paraguai', false, true, 1600
where not exists (
  select 1 from clubes where slug = 'olimpia-paraguay'
);

update clubes
set
  nome = 'Cerro Porteño',
  categoria = 'Clubes Sulamericanos',
  pais = 'Paraguai',
  ativo = true,
  destaque = false,
  ordem = 1610
where slug = 'cerro-porteno';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Cerro Porteño', 'cerro-porteno', 'Clubes Sulamericanos', 'Paraguai', false, true, 1610
where not exists (
  select 1 from clubes where slug = 'cerro-porteno'
);

update clubes
set
  nome = 'Libertad (Paraguai)',
  categoria = 'Clubes Sulamericanos',
  pais = 'Paraguai',
  ativo = true,
  destaque = false,
  ordem = 1620
where slug = 'libertad-paraguay';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Libertad (Paraguai)', 'libertad-paraguay', 'Clubes Sulamericanos', 'Paraguai', false, true, 1620
where not exists (
  select 1 from clubes where slug = 'libertad-paraguay'
);

update clubes
set
  nome = 'Guaraní (Paraguai)',
  categoria = 'Clubes Sulamericanos',
  pais = 'Paraguai',
  ativo = true,
  destaque = false,
  ordem = 1630
where slug = 'guarani-paraguay';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Guaraní (Paraguai)', 'guarani-paraguay', 'Clubes Sulamericanos', 'Paraguai', false, true, 1630
where not exists (
  select 1 from clubes where slug = 'guarani-paraguay'
);

update clubes
set
  nome = 'Nacional-PAR',
  categoria = 'Clubes Sulamericanos',
  pais = 'Paraguai',
  ativo = true,
  destaque = false,
  ordem = 1640
where slug = 'nacional-paraguay';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Nacional-PAR', 'nacional-paraguay', 'Clubes Sulamericanos', 'Paraguai', false, true, 1640
where not exists (
  select 1 from clubes where slug = 'nacional-paraguay'
);

update clubes
set
  nome = 'Sol de América',
  categoria = 'Clubes Sulamericanos',
  pais = 'Paraguai',
  ativo = true,
  destaque = false,
  ordem = 1650
where slug = 'sol-de-america';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Sol de América', 'sol-de-america', 'Clubes Sulamericanos', 'Paraguai', false, true, 1650
where not exists (
  select 1 from clubes where slug = 'sol-de-america'
);

update clubes
set
  nome = 'Sportivo Luqueño',
  categoria = 'Clubes Sulamericanos',
  pais = 'Paraguai',
  ativo = true,
  destaque = false,
  ordem = 1660
where slug = 'sportivo-luqueno';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Sportivo Luqueño', 'sportivo-luqueno', 'Clubes Sulamericanos', 'Paraguai', false, true, 1660
where not exists (
  select 1 from clubes where slug = 'sportivo-luqueno'
);

update clubes
set
  nome = 'LDU',
  categoria = 'Clubes Sulamericanos',
  pais = 'Equador',
  ativo = true,
  destaque = false,
  ordem = 1700
where slug = 'ldu-quito';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'LDU', 'ldu-quito', 'Clubes Sulamericanos', 'Equador', false, true, 1700
where not exists (
  select 1 from clubes where slug = 'ldu-quito'
);

update clubes
set
  nome = 'Barcelona SC',
  categoria = 'Clubes Sulamericanos',
  pais = 'Equador',
  ativo = true,
  destaque = false,
  ordem = 1710
where slug = 'barcelona-sc';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Barcelona SC', 'barcelona-sc', 'Clubes Sulamericanos', 'Equador', false, true, 1710
where not exists (
  select 1 from clubes where slug = 'barcelona-sc'
);

update clubes
set
  nome = 'Emelec',
  categoria = 'Clubes Sulamericanos',
  pais = 'Equador',
  ativo = true,
  destaque = false,
  ordem = 1720
where slug = 'emelec';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Emelec', 'emelec', 'Clubes Sulamericanos', 'Equador', false, true, 1720
where not exists (
  select 1 from clubes where slug = 'emelec'
);

update clubes
set
  nome = 'Independiente del Valle',
  categoria = 'Clubes Sulamericanos',
  pais = 'Equador',
  ativo = true,
  destaque = false,
  ordem = 1730
where slug = 'independiente-del-valle';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Independiente del Valle', 'independiente-del-valle', 'Clubes Sulamericanos', 'Equador', false, true, 1730
where not exists (
  select 1 from clubes where slug = 'independiente-del-valle'
);

update clubes
set
  nome = 'Deportivo Quito',
  categoria = 'Clubes Sulamericanos',
  pais = 'Equador',
  ativo = true,
  destaque = false,
  ordem = 1740
where slug = 'deportivo-quito';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Deportivo Quito', 'deportivo-quito', 'Clubes Sulamericanos', 'Equador', false, true, 1740
where not exists (
  select 1 from clubes where slug = 'deportivo-quito'
);

update clubes
set
  nome = 'El Nacional',
  categoria = 'Clubes Sulamericanos',
  pais = 'Equador',
  ativo = true,
  destaque = false,
  ordem = 1750
where slug = 'el-nacional';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'El Nacional', 'el-nacional', 'Clubes Sulamericanos', 'Equador', false, true, 1750
where not exists (
  select 1 from clubes where slug = 'el-nacional'
);

update clubes
set
  nome = 'Aucas',
  categoria = 'Clubes Sulamericanos',
  pais = 'Equador',
  ativo = true,
  destaque = false,
  ordem = 1760
where slug = 'aucas';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Aucas', 'aucas', 'Clubes Sulamericanos', 'Equador', false, true, 1760
where not exists (
  select 1 from clubes where slug = 'aucas'
);

update clubes
set
  nome = 'Atlético Nacional',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1800
where slug = 'atletico-nacional';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Atlético Nacional', 'atletico-nacional', 'Clubes Sulamericanos', 'Colômbia', false, true, 1800
where not exists (
  select 1 from clubes where slug = 'atletico-nacional'
);

update clubes
set
  nome = 'Millonarios',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1810
where slug = 'millonarios';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Millonarios', 'millonarios', 'Clubes Sulamericanos', 'Colômbia', false, true, 1810
where not exists (
  select 1 from clubes where slug = 'millonarios'
);

update clubes
set
  nome = 'América de Cali',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1820
where slug = 'america-de-cali';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'América de Cali', 'america-de-cali', 'Clubes Sulamericanos', 'Colômbia', false, true, 1820
where not exists (
  select 1 from clubes where slug = 'america-de-cali'
);

update clubes
set
  nome = 'Deportivo Cali',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1830
where slug = 'deportivo-cali';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Deportivo Cali', 'deportivo-cali', 'Clubes Sulamericanos', 'Colômbia', false, true, 1830
where not exists (
  select 1 from clubes where slug = 'deportivo-cali'
);

update clubes
set
  nome = 'Santa Fe',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1840
where slug = 'independiente-santa-fe';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Santa Fe', 'independiente-santa-fe', 'Clubes Sulamericanos', 'Colômbia', false, true, 1840
where not exists (
  select 1 from clubes where slug = 'independiente-santa-fe'
);

update clubes
set
  nome = 'Junior Barranquilla',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1850
where slug = 'junior-barranquilla';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Junior Barranquilla', 'junior-barranquilla', 'Clubes Sulamericanos', 'Colômbia', false, true, 1850
where not exists (
  select 1 from clubes where slug = 'junior-barranquilla'
);

update clubes
set
  nome = 'Once Caldas',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1860
where slug = 'once-caldas';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Once Caldas', 'once-caldas', 'Clubes Sulamericanos', 'Colômbia', false, true, 1860
where not exists (
  select 1 from clubes where slug = 'once-caldas'
);

update clubes
set
  nome = 'Deportes Tolima',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1870
where slug = 'deportes-tolima';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Deportes Tolima', 'deportes-tolima', 'Clubes Sulamericanos', 'Colômbia', false, true, 1870
where not exists (
  select 1 from clubes where slug = 'deportes-tolima'
);

update clubes
set
  nome = 'Independiente Medellín',
  categoria = 'Clubes Sulamericanos',
  pais = 'Colômbia',
  ativo = true,
  destaque = false,
  ordem = 1880
where slug = 'independiente-medellin';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Independiente Medellín', 'independiente-medellin', 'Clubes Sulamericanos', 'Colômbia', false, true, 1880
where not exists (
  select 1 from clubes where slug = 'independiente-medellin'
);

update clubes
set
  nome = 'Alianza Lima',
  categoria = 'Clubes Sulamericanos',
  pais = 'Peru',
  ativo = true,
  destaque = false,
  ordem = 1900
where slug = 'alianza-lima';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Alianza Lima', 'alianza-lima', 'Clubes Sulamericanos', 'Peru', false, true, 1900
where not exists (
  select 1 from clubes where slug = 'alianza-lima'
);

update clubes
set
  nome = 'Universitario (Peru)',
  categoria = 'Clubes Sulamericanos',
  pais = 'Peru',
  ativo = true,
  destaque = false,
  ordem = 1910
where slug = 'universitario-peru';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Universitario (Peru)', 'universitario-peru', 'Clubes Sulamericanos', 'Peru', false, true, 1910
where not exists (
  select 1 from clubes where slug = 'universitario-peru'
);

update clubes
set
  nome = 'Sporting Cristal',
  categoria = 'Clubes Sulamericanos',
  pais = 'Peru',
  ativo = true,
  destaque = false,
  ordem = 1920
where slug = 'sporting-cristal';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Sporting Cristal', 'sporting-cristal', 'Clubes Sulamericanos', 'Peru', false, true, 1920
where not exists (
  select 1 from clubes where slug = 'sporting-cristal'
);

update clubes
set
  nome = 'Melgar',
  categoria = 'Clubes Sulamericanos',
  pais = 'Peru',
  ativo = true,
  destaque = false,
  ordem = 1930
where slug = 'melgar';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Melgar', 'melgar', 'Clubes Sulamericanos', 'Peru', false, true, 1930
where not exists (
  select 1 from clubes where slug = 'melgar'
);

update clubes
set
  nome = 'Cienciano',
  categoria = 'Clubes Sulamericanos',
  pais = 'Peru',
  ativo = true,
  destaque = false,
  ordem = 1940
where slug = 'cienciano';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Cienciano', 'cienciano', 'Clubes Sulamericanos', 'Peru', false, true, 1940
where not exists (
  select 1 from clubes where slug = 'cienciano'
);

update clubes
set
  nome = 'Sport Boys',
  categoria = 'Clubes Sulamericanos',
  pais = 'Peru',
  ativo = true,
  destaque = false,
  ordem = 1950
where slug = 'sport-boys';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Sport Boys', 'sport-boys', 'Clubes Sulamericanos', 'Peru', false, true, 1950
where not exists (
  select 1 from clubes where slug = 'sport-boys'
);

update clubes
set
  nome = 'Bolívar',
  categoria = 'Clubes Sulamericanos',
  pais = 'Bolívia',
  ativo = true,
  destaque = false,
  ordem = 2000
where slug = 'bolivar';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Bolívar', 'bolivar', 'Clubes Sulamericanos', 'Bolívia', false, true, 2000
where not exists (
  select 1 from clubes where slug = 'bolivar'
);

update clubes
set
  nome = 'The Strongest',
  categoria = 'Clubes Sulamericanos',
  pais = 'Bolívia',
  ativo = true,
  destaque = false,
  ordem = 2010
where slug = 'the-strongest';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'The Strongest', 'the-strongest', 'Clubes Sulamericanos', 'Bolívia', false, true, 2010
where not exists (
  select 1 from clubes where slug = 'the-strongest'
);

update clubes
set
  nome = 'Oriente Petrolero',
  categoria = 'Clubes Sulamericanos',
  pais = 'Bolívia',
  ativo = true,
  destaque = false,
  ordem = 2020
where slug = 'oriente-petrolero';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Oriente Petrolero', 'oriente-petrolero', 'Clubes Sulamericanos', 'Bolívia', false, true, 2020
where not exists (
  select 1 from clubes where slug = 'oriente-petrolero'
);

update clubes
set
  nome = 'Blooming',
  categoria = 'Clubes Sulamericanos',
  pais = 'Bolívia',
  ativo = true,
  destaque = false,
  ordem = 2030
where slug = 'blooming';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Blooming', 'blooming', 'Clubes Sulamericanos', 'Bolívia', false, true, 2030
where not exists (
  select 1 from clubes where slug = 'blooming'
);

update clubes
set
  nome = 'Jorge Wilstermann',
  categoria = 'Clubes Sulamericanos',
  pais = 'Bolívia',
  ativo = true,
  destaque = false,
  ordem = 2040
where slug = 'jorge-wilstermann';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Jorge Wilstermann', 'jorge-wilstermann', 'Clubes Sulamericanos', 'Bolívia', false, true, 2040
where not exists (
  select 1 from clubes where slug = 'jorge-wilstermann'
);

update clubes
set
  nome = 'Caracas FC',
  categoria = 'Clubes Sulamericanos',
  pais = 'Venezuela',
  ativo = true,
  destaque = false,
  ordem = 2100
where slug = 'caracas-fc';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Caracas FC', 'caracas-fc', 'Clubes Sulamericanos', 'Venezuela', false, true, 2100
where not exists (
  select 1 from clubes where slug = 'caracas-fc'
);

update clubes
set
  nome = 'Deportivo Táchira',
  categoria = 'Clubes Sulamericanos',
  pais = 'Venezuela',
  ativo = true,
  destaque = false,
  ordem = 2110
where slug = 'deportivo-tachira';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Deportivo Táchira', 'deportivo-tachira', 'Clubes Sulamericanos', 'Venezuela', false, true, 2110
where not exists (
  select 1 from clubes where slug = 'deportivo-tachira'
);

update clubes
set
  nome = 'Zamora',
  categoria = 'Clubes Sulamericanos',
  pais = 'Venezuela',
  ativo = true,
  destaque = false,
  ordem = 2120
where slug = 'zamora-venezuela';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Zamora', 'zamora-venezuela', 'Clubes Sulamericanos', 'Venezuela', false, true, 2120
where not exists (
  select 1 from clubes where slug = 'zamora-venezuela'
);

update clubes
set
  nome = 'Mineros de Guayana',
  categoria = 'Clubes Sulamericanos',
  pais = 'Venezuela',
  ativo = true,
  destaque = false,
  ordem = 2130
where slug = 'mineros-de-guayana';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Mineros de Guayana', 'mineros-de-guayana', 'Clubes Sulamericanos', 'Venezuela', false, true, 2130
where not exists (
  select 1 from clubes where slug = 'mineros-de-guayana'
);

commit;
