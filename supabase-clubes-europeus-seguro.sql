-- Cadastra clubes europeus.
-- Versão segura: cada clube é processado sem listas longas com vírgulas.
-- Pode rodar mais de uma vez.

begin;

update clubes
set
  nome = 'Real Madrid',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3000
where slug = 'real-madrid';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Real Madrid', 'real-madrid', 'Clubes Europeus', 'Espanha', false, true, 3000
where not exists (
  select 1 from clubes where slug = 'real-madrid'
);

update clubes
set
  nome = 'Barcelona',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3010
where slug = 'barcelona';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Barcelona', 'barcelona', 'Clubes Europeus', 'Espanha', false, true, 3010
where not exists (
  select 1 from clubes where slug = 'barcelona'
);

update clubes
set
  nome = 'Atlético de Madrid',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3020
where slug = 'atletico-madrid';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Atlético de Madrid', 'atletico-madrid', 'Clubes Europeus', 'Espanha', false, true, 3020
where not exists (
  select 1 from clubes where slug = 'atletico-madrid'
);

update clubes
set
  nome = 'Valencia',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3030
where slug = 'valencia';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Valencia', 'valencia', 'Clubes Europeus', 'Espanha', false, true, 3030
where not exists (
  select 1 from clubes where slug = 'valencia'
);

update clubes
set
  nome = 'Sevilla',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3040
where slug = 'sevilla';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Sevilla', 'sevilla', 'Clubes Europeus', 'Espanha', false, true, 3040
where not exists (
  select 1 from clubes where slug = 'sevilla'
);

update clubes
set
  nome = 'Betis',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3050
where slug = 'real-betis';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Betis', 'real-betis', 'Clubes Europeus', 'Espanha', false, true, 3050
where not exists (
  select 1 from clubes where slug = 'real-betis'
);

update clubes
set
  nome = 'Villarreal',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3060
where slug = 'villarreal';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Villarreal', 'villarreal', 'Clubes Europeus', 'Espanha', false, true, 3060
where not exists (
  select 1 from clubes where slug = 'villarreal'
);

update clubes
set
  nome = 'Athletic Bilbao',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3070
where slug = 'athletic-bilbao';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Athletic Bilbao', 'athletic-bilbao', 'Clubes Europeus', 'Espanha', false, true, 3070
where not exists (
  select 1 from clubes where slug = 'athletic-bilbao'
);

update clubes
set
  nome = 'Real Sociedad',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3080
where slug = 'real-sociedad';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Real Sociedad', 'real-sociedad', 'Clubes Europeus', 'Espanha', false, true, 3080
where not exists (
  select 1 from clubes where slug = 'real-sociedad'
);

update clubes
set
  nome = 'Deportivo La Coruña',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3090
where slug = 'deportivo-la-coruna';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Deportivo La Coruña', 'deportivo-la-coruna', 'Clubes Europeus', 'Espanha', false, true, 3090
where not exists (
  select 1 from clubes where slug = 'deportivo-la-coruna'
);

update clubes
set
  nome = 'Celta de Vigo',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3100
where slug = 'celta-de-vigo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Celta de Vigo', 'celta-de-vigo', 'Clubes Europeus', 'Espanha', false, true, 3100
where not exists (
  select 1 from clubes where slug = 'celta-de-vigo'
);

update clubes
set
  nome = 'Espanyol',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3110
where slug = 'espanyol';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Espanyol', 'espanyol', 'Clubes Europeus', 'Espanha', false, true, 3110
where not exists (
  select 1 from clubes where slug = 'espanyol'
);

update clubes
set
  nome = 'Málaga',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3120
where slug = 'malaga';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Málaga', 'malaga', 'Clubes Europeus', 'Espanha', false, true, 3120
where not exists (
  select 1 from clubes where slug = 'malaga'
);

update clubes
set
  nome = 'Real Zaragoza',
  categoria = 'Clubes Europeus',
  pais = 'Espanha',
  ativo = true,
  destaque = false,
  ordem = 3130
where slug = 'real-zaragoza';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Real Zaragoza', 'real-zaragoza', 'Clubes Europeus', 'Espanha', false, true, 3130
where not exists (
  select 1 from clubes where slug = 'real-zaragoza'
);

update clubes
set
  nome = 'Manchester United',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3200
where slug = 'manchester-united';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Manchester United', 'manchester-united', 'Clubes Europeus', 'Inglaterra', false, true, 3200
where not exists (
  select 1 from clubes where slug = 'manchester-united'
);

update clubes
set
  nome = 'Manchester City',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3210
where slug = 'manchester-city';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Manchester City', 'manchester-city', 'Clubes Europeus', 'Inglaterra', false, true, 3210
where not exists (
  select 1 from clubes where slug = 'manchester-city'
);

update clubes
set
  nome = 'Liverpool',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3220
where slug = 'liverpool-fc';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Liverpool', 'liverpool-fc', 'Clubes Europeus', 'Inglaterra', false, true, 3220
where not exists (
  select 1 from clubes where slug = 'liverpool-fc'
);

update clubes
set
  nome = 'Chelsea',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3230
where slug = 'chelsea';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Chelsea', 'chelsea', 'Clubes Europeus', 'Inglaterra', false, true, 3230
where not exists (
  select 1 from clubes where slug = 'chelsea'
);

update clubes
set
  nome = 'Arsenal',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3240
where slug = 'arsenal';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Arsenal', 'arsenal', 'Clubes Europeus', 'Inglaterra', false, true, 3240
where not exists (
  select 1 from clubes where slug = 'arsenal'
);

update clubes
set
  nome = 'Tottenham',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3250
where slug = 'tottenham-hotspur';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Tottenham', 'tottenham-hotspur', 'Clubes Europeus', 'Inglaterra', false, true, 3250
where not exists (
  select 1 from clubes where slug = 'tottenham-hotspur'
);

update clubes
set
  nome = 'Newcastle',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3260
where slug = 'newcastle-united';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Newcastle', 'newcastle-united', 'Clubes Europeus', 'Inglaterra', false, true, 3260
where not exists (
  select 1 from clubes where slug = 'newcastle-united'
);

update clubes
set
  nome = 'Aston Villa',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3270
where slug = 'aston-villa';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Aston Villa', 'aston-villa', 'Clubes Europeus', 'Inglaterra', false, true, 3270
where not exists (
  select 1 from clubes where slug = 'aston-villa'
);

update clubes
set
  nome = 'Everton',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3280
where slug = 'everton-fc';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Everton', 'everton-fc', 'Clubes Europeus', 'Inglaterra', false, true, 3280
where not exists (
  select 1 from clubes where slug = 'everton-fc'
);

update clubes
set
  nome = 'Leeds United',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3290
where slug = 'leeds-united';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Leeds United', 'leeds-united', 'Clubes Europeus', 'Inglaterra', false, true, 3290
where not exists (
  select 1 from clubes where slug = 'leeds-united'
);

update clubes
set
  nome = 'West Ham',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3300
where slug = 'west-ham-united';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'West Ham', 'west-ham-united', 'Clubes Europeus', 'Inglaterra', false, true, 3300
where not exists (
  select 1 from clubes where slug = 'west-ham-united'
);

update clubes
set
  nome = 'Nottingham Forest',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3310
where slug = 'nottingham-forest';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Nottingham Forest', 'nottingham-forest', 'Clubes Europeus', 'Inglaterra', false, true, 3310
where not exists (
  select 1 from clubes where slug = 'nottingham-forest'
);

update clubes
set
  nome = 'Leicester City',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3320
where slug = 'leicester-city';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Leicester City', 'leicester-city', 'Clubes Europeus', 'Inglaterra', false, true, 3320
where not exists (
  select 1 from clubes where slug = 'leicester-city'
);

update clubes
set
  nome = 'Blackburn Rovers',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3330
where slug = 'blackburn-rovers';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Blackburn Rovers', 'blackburn-rovers', 'Clubes Europeus', 'Inglaterra', false, true, 3330
where not exists (
  select 1 from clubes where slug = 'blackburn-rovers'
);

update clubes
set
  nome = 'Sunderland',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3340
where slug = 'sunderland';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Sunderland', 'sunderland', 'Clubes Europeus', 'Inglaterra', false, true, 3340
where not exists (
  select 1 from clubes where slug = 'sunderland'
);

update clubes
set
  nome = 'Wolverhampton',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3350
where slug = 'wolverhampton-wanderers';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Wolverhampton', 'wolverhampton-wanderers', 'Clubes Europeus', 'Inglaterra', false, true, 3350
where not exists (
  select 1 from clubes where slug = 'wolverhampton-wanderers'
);

update clubes
set
  nome = 'Crystal Palace',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3360
where slug = 'crystal-palace';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Crystal Palace', 'crystal-palace', 'Clubes Europeus', 'Inglaterra', false, true, 3360
where not exists (
  select 1 from clubes where slug = 'crystal-palace'
);

update clubes
set
  nome = 'Fulham',
  categoria = 'Clubes Europeus',
  pais = 'Inglaterra',
  ativo = true,
  destaque = false,
  ordem = 3370
where slug = 'fulham';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Fulham', 'fulham', 'Clubes Europeus', 'Inglaterra', false, true, 3370
where not exists (
  select 1 from clubes where slug = 'fulham'
);

update clubes
set
  nome = 'Milan',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3400
where slug = 'ac-milan';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Milan', 'ac-milan', 'Clubes Europeus', 'Itália', false, true, 3400
where not exists (
  select 1 from clubes where slug = 'ac-milan'
);

update clubes
set
  nome = 'Inter de Milão',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3410
where slug = 'inter-milan';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Inter de Milão', 'inter-milan', 'Clubes Europeus', 'Itália', false, true, 3410
where not exists (
  select 1 from clubes where slug = 'inter-milan'
);

update clubes
set
  nome = 'Juventus',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3420
where slug = 'juventus';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Juventus', 'juventus', 'Clubes Europeus', 'Itália', false, true, 3420
where not exists (
  select 1 from clubes where slug = 'juventus'
);

update clubes
set
  nome = 'Roma',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3430
where slug = 'as-roma';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Roma', 'as-roma', 'Clubes Europeus', 'Itália', false, true, 3430
where not exists (
  select 1 from clubes where slug = 'as-roma'
);

update clubes
set
  nome = 'Lazio',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3440
where slug = 'lazio';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Lazio', 'lazio', 'Clubes Europeus', 'Itália', false, true, 3440
where not exists (
  select 1 from clubes where slug = 'lazio'
);

update clubes
set
  nome = 'Napoli',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3450
where slug = 'napoli';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Napoli', 'napoli', 'Clubes Europeus', 'Itália', false, true, 3450
where not exists (
  select 1 from clubes where slug = 'napoli'
);

update clubes
set
  nome = 'Fiorentina',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3460
where slug = 'fiorentina';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Fiorentina', 'fiorentina', 'Clubes Europeus', 'Itália', false, true, 3460
where not exists (
  select 1 from clubes where slug = 'fiorentina'
);

update clubes
set
  nome = 'Parma',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3470
where slug = 'parma';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Parma', 'parma', 'Clubes Europeus', 'Itália', false, true, 3470
where not exists (
  select 1 from clubes where slug = 'parma'
);

update clubes
set
  nome = 'Sampdoria',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3480
where slug = 'sampdoria';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Sampdoria', 'sampdoria', 'Clubes Europeus', 'Itália', false, true, 3480
where not exists (
  select 1 from clubes where slug = 'sampdoria'
);

update clubes
set
  nome = 'Genoa',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3490
where slug = 'genoa';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Genoa', 'genoa', 'Clubes Europeus', 'Itália', false, true, 3490
where not exists (
  select 1 from clubes where slug = 'genoa'
);

update clubes
set
  nome = 'Torino',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3500
where slug = 'torino';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Torino', 'torino', 'Clubes Europeus', 'Itália', false, true, 3500
where not exists (
  select 1 from clubes where slug = 'torino'
);

update clubes
set
  nome = 'Atalanta',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3510
where slug = 'atalanta';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Atalanta', 'atalanta', 'Clubes Europeus', 'Itália', false, true, 3510
where not exists (
  select 1 from clubes where slug = 'atalanta'
);

update clubes
set
  nome = 'Bologna',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3520
where slug = 'bologna';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Bologna', 'bologna', 'Clubes Europeus', 'Itália', false, true, 3520
where not exists (
  select 1 from clubes where slug = 'bologna'
);

update clubes
set
  nome = 'Udinese',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3530
where slug = 'udinese';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Udinese', 'udinese', 'Clubes Europeus', 'Itália', false, true, 3530
where not exists (
  select 1 from clubes where slug = 'udinese'
);

update clubes
set
  nome = 'Palermo',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3540
where slug = 'palermo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Palermo', 'palermo', 'Clubes Europeus', 'Itália', false, true, 3540
where not exists (
  select 1 from clubes where slug = 'palermo'
);

update clubes
set
  nome = 'Cagliari',
  categoria = 'Clubes Europeus',
  pais = 'Itália',
  ativo = true,
  destaque = false,
  ordem = 3550
where slug = 'cagliari';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Cagliari', 'cagliari', 'Clubes Europeus', 'Itália', false, true, 3550
where not exists (
  select 1 from clubes where slug = 'cagliari'
);

update clubes
set
  nome = 'Bayern de Munique',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3600
where slug = 'bayern-munich';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Bayern de Munique', 'bayern-munich', 'Clubes Europeus', 'Alemanha', false, true, 3600
where not exists (
  select 1 from clubes where slug = 'bayern-munich'
);

update clubes
set
  nome = 'Borussia Dortmund',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3610
where slug = 'borussia-dortmund';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Borussia Dortmund', 'borussia-dortmund', 'Clubes Europeus', 'Alemanha', false, true, 3610
where not exists (
  select 1 from clubes where slug = 'borussia-dortmund'
);

update clubes
set
  nome = 'Bayer Leverkusen',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3620
where slug = 'bayer-leverkusen';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Bayer Leverkusen', 'bayer-leverkusen', 'Clubes Europeus', 'Alemanha', false, true, 3620
where not exists (
  select 1 from clubes where slug = 'bayer-leverkusen'
);

update clubes
set
  nome = 'Schalke 04',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3630
where slug = 'schalke-04';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Schalke 04', 'schalke-04', 'Clubes Europeus', 'Alemanha', false, true, 3630
where not exists (
  select 1 from clubes where slug = 'schalke-04'
);

update clubes
set
  nome = 'Werder Bremen',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3640
where slug = 'werder-bremen';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Werder Bremen', 'werder-bremen', 'Clubes Europeus', 'Alemanha', false, true, 3640
where not exists (
  select 1 from clubes where slug = 'werder-bremen'
);

update clubes
set
  nome = 'Hamburgo',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3650
where slug = 'hamburg-sv';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Hamburgo', 'hamburg-sv', 'Clubes Europeus', 'Alemanha', false, true, 3650
where not exists (
  select 1 from clubes where slug = 'hamburg-sv'
);

update clubes
set
  nome = 'Stuttgart',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3660
where slug = 'vfb-stuttgart';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Stuttgart', 'vfb-stuttgart', 'Clubes Europeus', 'Alemanha', false, true, 3660
where not exists (
  select 1 from clubes where slug = 'vfb-stuttgart'
);

update clubes
set
  nome = 'Borussia Mönchengladbach',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3670
where slug = 'borussia-monchengladbach';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Borussia Mönchengladbach', 'borussia-monchengladbach', 'Clubes Europeus', 'Alemanha', false, true, 3670
where not exists (
  select 1 from clubes where slug = 'borussia-monchengladbach'
);

update clubes
set
  nome = 'Eintracht Frankfurt',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3680
where slug = 'eintracht-frankfurt';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Eintracht Frankfurt', 'eintracht-frankfurt', 'Clubes Europeus', 'Alemanha', false, true, 3680
where not exists (
  select 1 from clubes where slug = 'eintracht-frankfurt'
);

update clubes
set
  nome = 'Wolfsburg',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3690
where slug = 'wolfsburg';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Wolfsburg', 'wolfsburg', 'Clubes Europeus', 'Alemanha', false, true, 3690
where not exists (
  select 1 from clubes where slug = 'wolfsburg'
);

update clubes
set
  nome = 'RB Leipzig',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3700
where slug = 'rb-leipzig';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'RB Leipzig', 'rb-leipzig', 'Clubes Europeus', 'Alemanha', false, true, 3700
where not exists (
  select 1 from clubes where slug = 'rb-leipzig'
);

update clubes
set
  nome = 'Hertha Berlin',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3710
where slug = 'hertha-berlin';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Hertha Berlin', 'hertha-berlin', 'Clubes Europeus', 'Alemanha', false, true, 3710
where not exists (
  select 1 from clubes where slug = 'hertha-berlin'
);

update clubes
set
  nome = 'Köln',
  categoria = 'Clubes Europeus',
  pais = 'Alemanha',
  ativo = true,
  destaque = false,
  ordem = 3720
where slug = 'koln';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Köln', 'koln', 'Clubes Europeus', 'Alemanha', false, true, 3720
where not exists (
  select 1 from clubes where slug = 'koln'
);

update clubes
set
  nome = 'PSG',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3800
where slug = 'psg';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'PSG', 'psg', 'Clubes Europeus', 'França', false, true, 3800
where not exists (
  select 1 from clubes where slug = 'psg'
);

update clubes
set
  nome = 'Olympique de Marseille',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3810
where slug = 'olympique-marseille';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Olympique de Marseille', 'olympique-marseille', 'Clubes Europeus', 'França', false, true, 3810
where not exists (
  select 1 from clubes where slug = 'olympique-marseille'
);

update clubes
set
  nome = 'Lyon',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3820
where slug = 'olympique-lyon';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Lyon', 'olympique-lyon', 'Clubes Europeus', 'França', false, true, 3820
where not exists (
  select 1 from clubes where slug = 'olympique-lyon'
);

update clubes
set
  nome = 'Monaco',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3830
where slug = 'as-monaco';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Monaco', 'as-monaco', 'Clubes Europeus', 'França', false, true, 3830
where not exists (
  select 1 from clubes where slug = 'as-monaco'
);

update clubes
set
  nome = 'Saint-Étienne',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3840
where slug = 'saint-etienne';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Saint-Étienne', 'saint-etienne', 'Clubes Europeus', 'França', false, true, 3840
where not exists (
  select 1 from clubes where slug = 'saint-etienne'
);

update clubes
set
  nome = 'Bordeaux',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3850
where slug = 'bordeaux';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Bordeaux', 'bordeaux', 'Clubes Europeus', 'França', false, true, 3850
where not exists (
  select 1 from clubes where slug = 'bordeaux'
);

update clubes
set
  nome = 'Lille',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3860
where slug = 'lille';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Lille', 'lille', 'Clubes Europeus', 'França', false, true, 3860
where not exists (
  select 1 from clubes where slug = 'lille'
);

update clubes
set
  nome = 'Nantes',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3870
where slug = 'nantes';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Nantes', 'nantes', 'Clubes Europeus', 'França', false, true, 3870
where not exists (
  select 1 from clubes where slug = 'nantes'
);

update clubes
set
  nome = 'Rennes',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3880
where slug = 'rennes';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Rennes', 'rennes', 'Clubes Europeus', 'França', false, true, 3880
where not exists (
  select 1 from clubes where slug = 'rennes'
);

update clubes
set
  nome = 'Lens',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3890
where slug = 'lens';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Lens', 'lens', 'Clubes Europeus', 'França', false, true, 3890
where not exists (
  select 1 from clubes where slug = 'lens'
);

update clubes
set
  nome = 'Nice',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3900
where slug = 'nice';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Nice', 'nice', 'Clubes Europeus', 'França', false, true, 3900
where not exists (
  select 1 from clubes where slug = 'nice'
);

update clubes
set
  nome = 'Toulouse',
  categoria = 'Clubes Europeus',
  pais = 'França',
  ativo = true,
  destaque = false,
  ordem = 3910
where slug = 'toulouse';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Toulouse', 'toulouse', 'Clubes Europeus', 'França', false, true, 3910
where not exists (
  select 1 from clubes where slug = 'toulouse'
);

update clubes
set
  nome = 'Benfica',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4000
where slug = 'benfica';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Benfica', 'benfica', 'Clubes Europeus', 'Portugal', false, true, 4000
where not exists (
  select 1 from clubes where slug = 'benfica'
);

update clubes
set
  nome = 'Porto',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4010
where slug = 'fc-porto';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Porto', 'fc-porto', 'Clubes Europeus', 'Portugal', false, true, 4010
where not exists (
  select 1 from clubes where slug = 'fc-porto'
);

update clubes
set
  nome = 'Sporting CP',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4020
where slug = 'sporting-cp';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Sporting CP', 'sporting-cp', 'Clubes Europeus', 'Portugal', false, true, 4020
where not exists (
  select 1 from clubes where slug = 'sporting-cp'
);

update clubes
set
  nome = 'Braga',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4030
where slug = 'sc-braga';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Braga', 'sc-braga', 'Clubes Europeus', 'Portugal', false, true, 4030
where not exists (
  select 1 from clubes where slug = 'sc-braga'
);

update clubes
set
  nome = 'Vitória de Guimarães',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4040
where slug = 'vitoria-guimaraes';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Vitória de Guimarães', 'vitoria-guimaraes', 'Clubes Europeus', 'Portugal', false, true, 4040
where not exists (
  select 1 from clubes where slug = 'vitoria-guimaraes'
);

update clubes
set
  nome = 'Boavista',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4050
where slug = 'boavista';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Boavista', 'boavista', 'Clubes Europeus', 'Portugal', false, true, 4050
where not exists (
  select 1 from clubes where slug = 'boavista'
);

update clubes
set
  nome = 'Belenenses',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4060
where slug = 'belenenses';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Belenenses', 'belenenses', 'Clubes Europeus', 'Portugal', false, true, 4060
where not exists (
  select 1 from clubes where slug = 'belenenses'
);

update clubes
set
  nome = 'Marítimo',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4070
where slug = 'maritimo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Marítimo', 'maritimo', 'Clubes Europeus', 'Portugal', false, true, 4070
where not exists (
  select 1 from clubes where slug = 'maritimo'
);

update clubes
set
  nome = 'Académica',
  categoria = 'Clubes Europeus',
  pais = 'Portugal',
  ativo = true,
  destaque = false,
  ordem = 4080
where slug = 'academica';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Académica', 'academica', 'Clubes Europeus', 'Portugal', false, true, 4080
where not exists (
  select 1 from clubes where slug = 'academica'
);

update clubes
set
  nome = 'Ajax',
  categoria = 'Clubes Europeus',
  pais = 'Holanda',
  ativo = true,
  destaque = false,
  ordem = 4100
where slug = 'ajax';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Ajax', 'ajax', 'Clubes Europeus', 'Holanda', false, true, 4100
where not exists (
  select 1 from clubes where slug = 'ajax'
);

update clubes
set
  nome = 'PSV',
  categoria = 'Clubes Europeus',
  pais = 'Holanda',
  ativo = true,
  destaque = false,
  ordem = 4110
where slug = 'psv';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'PSV', 'psv', 'Clubes Europeus', 'Holanda', false, true, 4110
where not exists (
  select 1 from clubes where slug = 'psv'
);

update clubes
set
  nome = 'Feyenoord',
  categoria = 'Clubes Europeus',
  pais = 'Holanda',
  ativo = true,
  destaque = false,
  ordem = 4120
where slug = 'feyenoord';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Feyenoord', 'feyenoord', 'Clubes Europeus', 'Holanda', false, true, 4120
where not exists (
  select 1 from clubes where slug = 'feyenoord'
);

update clubes
set
  nome = 'AZ Alkmaar',
  categoria = 'Clubes Europeus',
  pais = 'Holanda',
  ativo = true,
  destaque = false,
  ordem = 4130
where slug = 'az-alkmaar';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'AZ Alkmaar', 'az-alkmaar', 'Clubes Europeus', 'Holanda', false, true, 4130
where not exists (
  select 1 from clubes where slug = 'az-alkmaar'
);

update clubes
set
  nome = 'Twente',
  categoria = 'Clubes Europeus',
  pais = 'Holanda',
  ativo = true,
  destaque = false,
  ordem = 4140
where slug = 'twente';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Twente', 'twente', 'Clubes Europeus', 'Holanda', false, true, 4140
where not exists (
  select 1 from clubes where slug = 'twente'
);

update clubes
set
  nome = 'Utrecht',
  categoria = 'Clubes Europeus',
  pais = 'Holanda',
  ativo = true,
  destaque = false,
  ordem = 4150
where slug = 'utrecht';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Utrecht', 'utrecht', 'Clubes Europeus', 'Holanda', false, true, 4150
where not exists (
  select 1 from clubes where slug = 'utrecht'
);

update clubes
set
  nome = 'Heerenveen',
  categoria = 'Clubes Europeus',
  pais = 'Holanda',
  ativo = true,
  destaque = false,
  ordem = 4160
where slug = 'heerenveen';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Heerenveen', 'heerenveen', 'Clubes Europeus', 'Holanda', false, true, 4160
where not exists (
  select 1 from clubes where slug = 'heerenveen'
);

update clubes
set
  nome = 'Groningen',
  categoria = 'Clubes Europeus',
  pais = 'Holanda',
  ativo = true,
  destaque = false,
  ordem = 4170
where slug = 'groningen';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Groningen', 'groningen', 'Clubes Europeus', 'Holanda', false, true, 4170
where not exists (
  select 1 from clubes where slug = 'groningen'
);

update clubes
set
  nome = 'Celtic',
  categoria = 'Clubes Europeus',
  pais = 'Escócia',
  ativo = true,
  destaque = false,
  ordem = 4200
where slug = 'celtic';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Celtic', 'celtic', 'Clubes Europeus', 'Escócia', false, true, 4200
where not exists (
  select 1 from clubes where slug = 'celtic'
);

update clubes
set
  nome = 'Rangers',
  categoria = 'Clubes Europeus',
  pais = 'Escócia',
  ativo = true,
  destaque = false,
  ordem = 4210
where slug = 'rangers';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Rangers', 'rangers', 'Clubes Europeus', 'Escócia', false, true, 4210
where not exists (
  select 1 from clubes where slug = 'rangers'
);

update clubes
set
  nome = 'Aberdeen',
  categoria = 'Clubes Europeus',
  pais = 'Escócia',
  ativo = true,
  destaque = false,
  ordem = 4220
where slug = 'aberdeen';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Aberdeen', 'aberdeen', 'Clubes Europeus', 'Escócia', false, true, 4220
where not exists (
  select 1 from clubes where slug = 'aberdeen'
);

update clubes
set
  nome = 'Hearts',
  categoria = 'Clubes Europeus',
  pais = 'Escócia',
  ativo = true,
  destaque = false,
  ordem = 4230
where slug = 'heart-of-midlothian';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Hearts', 'heart-of-midlothian', 'Clubes Europeus', 'Escócia', false, true, 4230
where not exists (
  select 1 from clubes where slug = 'heart-of-midlothian'
);

update clubes
set
  nome = 'Hibernian',
  categoria = 'Clubes Europeus',
  pais = 'Escócia',
  ativo = true,
  destaque = false,
  ordem = 4240
where slug = 'hibernian';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Hibernian', 'hibernian', 'Clubes Europeus', 'Escócia', false, true, 4240
where not exists (
  select 1 from clubes where slug = 'hibernian'
);

update clubes
set
  nome = 'Galatasaray',
  categoria = 'Clubes Europeus',
  pais = 'Turquia',
  ativo = true,
  destaque = false,
  ordem = 4300
where slug = 'galatasaray';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Galatasaray', 'galatasaray', 'Clubes Europeus', 'Turquia', false, true, 4300
where not exists (
  select 1 from clubes where slug = 'galatasaray'
);

update clubes
set
  nome = 'Fenerbahçe',
  categoria = 'Clubes Europeus',
  pais = 'Turquia',
  ativo = true,
  destaque = false,
  ordem = 4310
where slug = 'fenerbahce';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Fenerbahçe', 'fenerbahce', 'Clubes Europeus', 'Turquia', false, true, 4310
where not exists (
  select 1 from clubes where slug = 'fenerbahce'
);

update clubes
set
  nome = 'Besiktas',
  categoria = 'Clubes Europeus',
  pais = 'Turquia',
  ativo = true,
  destaque = false,
  ordem = 4320
where slug = 'besiktas';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Besiktas', 'besiktas', 'Clubes Europeus', 'Turquia', false, true, 4320
where not exists (
  select 1 from clubes where slug = 'besiktas'
);

update clubes
set
  nome = 'Trabzonspor',
  categoria = 'Clubes Europeus',
  pais = 'Turquia',
  ativo = true,
  destaque = false,
  ordem = 4330
where slug = 'trabzonspor';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Trabzonspor', 'trabzonspor', 'Clubes Europeus', 'Turquia', false, true, 4330
where not exists (
  select 1 from clubes where slug = 'trabzonspor'
);

update clubes
set
  nome = 'Istanbul Basaksehir',
  categoria = 'Clubes Europeus',
  pais = 'Turquia',
  ativo = true,
  destaque = false,
  ordem = 4340
where slug = 'istanbul-basaksehir';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Istanbul Basaksehir', 'istanbul-basaksehir', 'Clubes Europeus', 'Turquia', false, true, 4340
where not exists (
  select 1 from clubes where slug = 'istanbul-basaksehir'
);

update clubes
set
  nome = 'Olympiacos',
  categoria = 'Clubes Europeus',
  pais = 'Grécia',
  ativo = true,
  destaque = false,
  ordem = 4400
where slug = 'olympiacos';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Olympiacos', 'olympiacos', 'Clubes Europeus', 'Grécia', false, true, 4400
where not exists (
  select 1 from clubes where slug = 'olympiacos'
);

update clubes
set
  nome = 'Panathinaikos',
  categoria = 'Clubes Europeus',
  pais = 'Grécia',
  ativo = true,
  destaque = false,
  ordem = 4410
where slug = 'panathinaikos';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Panathinaikos', 'panathinaikos', 'Clubes Europeus', 'Grécia', false, true, 4410
where not exists (
  select 1 from clubes where slug = 'panathinaikos'
);

update clubes
set
  nome = 'AEK Atenas',
  categoria = 'Clubes Europeus',
  pais = 'Grécia',
  ativo = true,
  destaque = false,
  ordem = 4420
where slug = 'aek-athens';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'AEK Atenas', 'aek-athens', 'Clubes Europeus', 'Grécia', false, true, 4420
where not exists (
  select 1 from clubes where slug = 'aek-athens'
);

update clubes
set
  nome = 'PAOK',
  categoria = 'Clubes Europeus',
  pais = 'Grécia',
  ativo = true,
  destaque = false,
  ordem = 4430
where slug = 'paok';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'PAOK', 'paok', 'Clubes Europeus', 'Grécia', false, true, 4430
where not exists (
  select 1 from clubes where slug = 'paok'
);

update clubes
set
  nome = 'Aris',
  categoria = 'Clubes Europeus',
  pais = 'Grécia',
  ativo = true,
  destaque = false,
  ordem = 4440
where slug = 'aris-thessaloniki';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Aris', 'aris-thessaloniki', 'Clubes Europeus', 'Grécia', false, true, 4440
where not exists (
  select 1 from clubes where slug = 'aris-thessaloniki'
);

update clubes
set
  nome = 'Anderlecht',
  categoria = 'Clubes Europeus',
  pais = 'Bélgica',
  ativo = true,
  destaque = false,
  ordem = 4500
where slug = 'anderlecht';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Anderlecht', 'anderlecht', 'Clubes Europeus', 'Bélgica', false, true, 4500
where not exists (
  select 1 from clubes where slug = 'anderlecht'
);

update clubes
set
  nome = 'Club Brugge',
  categoria = 'Clubes Europeus',
  pais = 'Bélgica',
  ativo = true,
  destaque = false,
  ordem = 4510
where slug = 'club-brugge';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Club Brugge', 'club-brugge', 'Clubes Europeus', 'Bélgica', false, true, 4510
where not exists (
  select 1 from clubes where slug = 'club-brugge'
);

update clubes
set
  nome = 'Standard Liège',
  categoria = 'Clubes Europeus',
  pais = 'Bélgica',
  ativo = true,
  destaque = false,
  ordem = 4520
where slug = 'standard-liege';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Standard Liège', 'standard-liege', 'Clubes Europeus', 'Bélgica', false, true, 4520
where not exists (
  select 1 from clubes where slug = 'standard-liege'
);

update clubes
set
  nome = 'Genk',
  categoria = 'Clubes Europeus',
  pais = 'Bélgica',
  ativo = true,
  destaque = false,
  ordem = 4530
where slug = 'genk';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Genk', 'genk', 'Clubes Europeus', 'Bélgica', false, true, 4530
where not exists (
  select 1 from clubes where slug = 'genk'
);

update clubes
set
  nome = 'Gent',
  categoria = 'Clubes Europeus',
  pais = 'Bélgica',
  ativo = true,
  destaque = false,
  ordem = 4540
where slug = 'gent';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Gent', 'gent', 'Clubes Europeus', 'Bélgica', false, true, 4540
where not exists (
  select 1 from clubes where slug = 'gent'
);

update clubes
set
  nome = 'Royal Antwerp',
  categoria = 'Clubes Europeus',
  pais = 'Bélgica',
  ativo = true,
  destaque = false,
  ordem = 4550
where slug = 'royal-antwerp';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Royal Antwerp', 'royal-antwerp', 'Clubes Europeus', 'Bélgica', false, true, 4550
where not exists (
  select 1 from clubes where slug = 'royal-antwerp'
);

update clubes
set
  nome = 'Dynamo Kyiv',
  categoria = 'Clubes Europeus',
  pais = 'Ucrânia',
  ativo = true,
  destaque = false,
  ordem = 4600
where slug = 'dynamo-kyiv';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Dynamo Kyiv', 'dynamo-kyiv', 'Clubes Europeus', 'Ucrânia', false, true, 4600
where not exists (
  select 1 from clubes where slug = 'dynamo-kyiv'
);

update clubes
set
  nome = 'Shakhtar Donetsk',
  categoria = 'Clubes Europeus',
  pais = 'Ucrânia',
  ativo = true,
  destaque = false,
  ordem = 4610
where slug = 'shakhtar-donetsk';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Shakhtar Donetsk', 'shakhtar-donetsk', 'Clubes Europeus', 'Ucrânia', false, true, 4610
where not exists (
  select 1 from clubes where slug = 'shakhtar-donetsk'
);

update clubes
set
  nome = 'Spartak Moscou',
  categoria = 'Clubes Europeus',
  pais = 'Rússia',
  ativo = true,
  destaque = false,
  ordem = 4620
where slug = 'spartak-moscow';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Spartak Moscou', 'spartak-moscow', 'Clubes Europeus', 'Rússia', false, true, 4620
where not exists (
  select 1 from clubes where slug = 'spartak-moscow'
);

update clubes
set
  nome = 'CSKA Moscou',
  categoria = 'Clubes Europeus',
  pais = 'Rússia',
  ativo = true,
  destaque = false,
  ordem = 4630
where slug = 'cska-moscow';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'CSKA Moscou', 'cska-moscow', 'Clubes Europeus', 'Rússia', false, true, 4630
where not exists (
  select 1 from clubes where slug = 'cska-moscow'
);

update clubes
set
  nome = 'Zenit',
  categoria = 'Clubes Europeus',
  pais = 'Rússia',
  ativo = true,
  destaque = false,
  ordem = 4640
where slug = 'zenit';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Zenit', 'zenit', 'Clubes Europeus', 'Rússia', false, true, 4640
where not exists (
  select 1 from clubes where slug = 'zenit'
);

update clubes
set
  nome = 'Estrela Vermelha',
  categoria = 'Clubes Europeus',
  pais = 'Sérvia',
  ativo = true,
  destaque = false,
  ordem = 4650
where slug = 'red-star-belgrade';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Estrela Vermelha', 'red-star-belgrade', 'Clubes Europeus', 'Sérvia', false, true, 4650
where not exists (
  select 1 from clubes where slug = 'red-star-belgrade'
);

update clubes
set
  nome = 'Partizan',
  categoria = 'Clubes Europeus',
  pais = 'Sérvia',
  ativo = true,
  destaque = false,
  ordem = 4660
where slug = 'partizan-belgrade';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Partizan', 'partizan-belgrade', 'Clubes Europeus', 'Sérvia', false, true, 4660
where not exists (
  select 1 from clubes where slug = 'partizan-belgrade'
);

update clubes
set
  nome = 'Dinamo Zagreb',
  categoria = 'Clubes Europeus',
  pais = 'Croácia',
  ativo = true,
  destaque = false,
  ordem = 4670
where slug = 'dinamo-zagreb';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Dinamo Zagreb', 'dinamo-zagreb', 'Clubes Europeus', 'Croácia', false, true, 4670
where not exists (
  select 1 from clubes where slug = 'dinamo-zagreb'
);

update clubes
set
  nome = 'Hajduk Split',
  categoria = 'Clubes Europeus',
  pais = 'Croácia',
  ativo = true,
  destaque = false,
  ordem = 4680
where slug = 'hajduk-split';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Hajduk Split', 'hajduk-split', 'Clubes Europeus', 'Croácia', false, true, 4680
where not exists (
  select 1 from clubes where slug = 'hajduk-split'
);

update clubes
set
  nome = 'Steaua Bucareste',
  categoria = 'Clubes Europeus',
  pais = 'Romênia',
  ativo = true,
  destaque = false,
  ordem = 4690
where slug = 'steaua-bucharest';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Steaua Bucareste', 'steaua-bucharest', 'Clubes Europeus', 'Romênia', false, true, 4690
where not exists (
  select 1 from clubes where slug = 'steaua-bucharest'
);

update clubes
set
  nome = 'Rapid Viena',
  categoria = 'Clubes Europeus',
  pais = 'Áustria',
  ativo = true,
  destaque = false,
  ordem = 4700
where slug = 'rapid-vienna';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Rapid Viena', 'rapid-vienna', 'Clubes Europeus', 'Áustria', false, true, 4700
where not exists (
  select 1 from clubes where slug = 'rapid-vienna'
);

update clubes
set
  nome = 'Basel',
  categoria = 'Clubes Europeus',
  pais = 'Suíça',
  ativo = true,
  destaque = false,
  ordem = 4710
where slug = 'basel';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Basel', 'basel', 'Clubes Europeus', 'Suíça', false, true, 4710
where not exists (
  select 1 from clubes where slug = 'basel'
);

update clubes
set
  nome = 'Young Boys',
  categoria = 'Clubes Europeus',
  pais = 'Suíça',
  ativo = true,
  destaque = false,
  ordem = 4720
where slug = 'young-boys';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Young Boys', 'young-boys', 'Clubes Europeus', 'Suíça', false, true, 4720
where not exists (
  select 1 from clubes where slug = 'young-boys'
);

update clubes
set
  nome = 'Copenhagen',
  categoria = 'Clubes Europeus',
  pais = 'Dinamarca',
  ativo = true,
  destaque = false,
  ordem = 4730
where slug = 'copenhagen';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Copenhagen', 'copenhagen', 'Clubes Europeus', 'Dinamarca', false, true, 4730
where not exists (
  select 1 from clubes where slug = 'copenhagen'
);

update clubes
set
  nome = 'Brøndby',
  categoria = 'Clubes Europeus',
  pais = 'Dinamarca',
  ativo = true,
  destaque = false,
  ordem = 4740
where slug = 'brondby';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Brøndby', 'brondby', 'Clubes Europeus', 'Dinamarca', false, true, 4740
where not exists (
  select 1 from clubes where slug = 'brondby'
);

update clubes
set
  nome = 'Rosenborg',
  categoria = 'Clubes Europeus',
  pais = 'Noruega',
  ativo = true,
  destaque = false,
  ordem = 4750
where slug = 'rosenborg';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Rosenborg', 'rosenborg', 'Clubes Europeus', 'Noruega', false, true, 4750
where not exists (
  select 1 from clubes where slug = 'rosenborg'
);

update clubes
set
  nome = 'Malmö',
  categoria = 'Clubes Europeus',
  pais = 'Suécia',
  ativo = true,
  destaque = false,
  ordem = 4760
where slug = 'malmo';

insert into clubes (nome, slug, categoria, pais, destaque, ativo, ordem)
select 'Malmö', 'malmo', 'Clubes Europeus', 'Suécia', false, true, 4760
where not exists (
  select 1 from clubes where slug = 'malmo'
);

commit;
