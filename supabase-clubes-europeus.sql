-- Cadastra clubes europeus no menu e na base de identificação.
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
-- Espanha
    ('Real Madrid', 'real-madrid', 'Clubes Europeus', 'Espanha', 3000),
('Barcelona', 'barcelona', 'Clubes Europeus', 'Espanha', 3010),
('Atlético de Madrid', 'atletico-madrid', 'Clubes Europeus', 'Espanha', 3020),
('Valencia', 'valencia', 'Clubes Europeus', 'Espanha', 3030),
('Sevilla', 'sevilla', 'Clubes Europeus', 'Espanha', 3040),
('Betis', 'real-betis', 'Clubes Europeus', 'Espanha', 3050),
('Villarreal', 'villarreal', 'Clubes Europeus', 'Espanha', 3060),
('Athletic Bilbao', 'athletic-bilbao', 'Clubes Europeus', 'Espanha', 3070),
('Real Sociedad', 'real-sociedad', 'Clubes Europeus', 'Espanha', 3080),
('Deportivo La Coruña', 'deportivo-la-coruna', 'Clubes Europeus', 'Espanha', 3090),
('Celta de Vigo', 'celta-de-vigo', 'Clubes Europeus', 'Espanha', 3100),
('Espanyol', 'espanyol', 'Clubes Europeus', 'Espanha', 3110),
('Málaga', 'malaga', 'Clubes Europeus', 'Espanha', 3120),
('Real Zaragoza', 'real-zaragoza', 'Clubes Europeus', 'Espanha', 3130),
-- Inglaterra
    ('Manchester United', 'manchester-united', 'Clubes Europeus', 'Inglaterra', 3200),
('Manchester City', 'manchester-city', 'Clubes Europeus', 'Inglaterra', 3210),
('Liverpool', 'liverpool-fc', 'Clubes Europeus', 'Inglaterra', 3220),
('Chelsea', 'chelsea', 'Clubes Europeus', 'Inglaterra', 3230),
('Arsenal', 'arsenal', 'Clubes Europeus', 'Inglaterra', 3240),
('Tottenham', 'tottenham-hotspur', 'Clubes Europeus', 'Inglaterra', 3250),
('Newcastle', 'newcastle-united', 'Clubes Europeus', 'Inglaterra', 3260),
('Aston Villa', 'aston-villa', 'Clubes Europeus', 'Inglaterra', 3270),
('Everton', 'everton-fc', 'Clubes Europeus', 'Inglaterra', 3280),
('Leeds United', 'leeds-united', 'Clubes Europeus', 'Inglaterra', 3290),
('West Ham', 'west-ham-united', 'Clubes Europeus', 'Inglaterra', 3300),
('Nottingham Forest', 'nottingham-forest', 'Clubes Europeus', 'Inglaterra', 3310),
('Leicester City', 'leicester-city', 'Clubes Europeus', 'Inglaterra', 3320),
('Blackburn Rovers', 'blackburn-rovers', 'Clubes Europeus', 'Inglaterra', 3330),
('Sunderland', 'sunderland', 'Clubes Europeus', 'Inglaterra', 3340),
('Wolverhampton', 'wolverhampton-wanderers', 'Clubes Europeus', 'Inglaterra', 3350),
('Crystal Palace', 'crystal-palace', 'Clubes Europeus', 'Inglaterra', 3360),
('Fulham', 'fulham', 'Clubes Europeus', 'Inglaterra', 3370),
-- Itália
    ('Milan', 'ac-milan', 'Clubes Europeus', 'Itália', 3400),
('Inter de Milão', 'inter-milan', 'Clubes Europeus', 'Itália', 3410),
('Juventus', 'juventus', 'Clubes Europeus', 'Itália', 3420),
('Roma', 'as-roma', 'Clubes Europeus', 'Itália', 3430),
('Lazio', 'lazio', 'Clubes Europeus', 'Itália', 3440),
('Napoli', 'napoli', 'Clubes Europeus', 'Itália', 3450),
('Fiorentina', 'fiorentina', 'Clubes Europeus', 'Itália', 3460),
('Parma', 'parma', 'Clubes Europeus', 'Itália', 3470),
('Sampdoria', 'sampdoria', 'Clubes Europeus', 'Itália', 3480),
('Genoa', 'genoa', 'Clubes Europeus', 'Itália', 3490),
('Torino', 'torino', 'Clubes Europeus', 'Itália', 3500),
('Atalanta', 'atalanta', 'Clubes Europeus', 'Itália', 3510),
('Bologna', 'bologna', 'Clubes Europeus', 'Itália', 3520),
('Udinese', 'udinese', 'Clubes Europeus', 'Itália', 3530),
('Palermo', 'palermo', 'Clubes Europeus', 'Itália', 3540),
('Cagliari', 'cagliari', 'Clubes Europeus', 'Itália', 3550),
-- Alemanha
    ('Bayern de Munique', 'bayern-munich', 'Clubes Europeus', 'Alemanha', 3600),
('Borussia Dortmund', 'borussia-dortmund', 'Clubes Europeus', 'Alemanha', 3610),
('Bayer Leverkusen', 'bayer-leverkusen', 'Clubes Europeus', 'Alemanha', 3620),
('Schalke 04', 'schalke-04', 'Clubes Europeus', 'Alemanha', 3630),
('Werder Bremen', 'werder-bremen', 'Clubes Europeus', 'Alemanha', 3640),
('Hamburgo', 'hamburg-sv', 'Clubes Europeus', 'Alemanha', 3650),
('Stuttgart', 'vfb-stuttgart', 'Clubes Europeus', 'Alemanha', 3660),
('Borussia Mönchengladbach', 'borussia-monchengladbach', 'Clubes Europeus', 'Alemanha', 3670),
('Eintracht Frankfurt', 'eintracht-frankfurt', 'Clubes Europeus', 'Alemanha', 3680),
('Wolfsburg', 'wolfsburg', 'Clubes Europeus', 'Alemanha', 3690),
('RB Leipzig', 'rb-leipzig', 'Clubes Europeus', 'Alemanha', 3700),
('Hertha Berlin', 'hertha-berlin', 'Clubes Europeus', 'Alemanha', 3710),
('Köln', 'koln', 'Clubes Europeus', 'Alemanha', 3720),
-- França
    ('PSG', 'psg', 'Clubes Europeus', 'França', 3800),
('Olympique de Marseille', 'olympique-marseille', 'Clubes Europeus', 'França', 3810),
('Lyon', 'olympique-lyon', 'Clubes Europeus', 'França', 3820),
('Monaco', 'as-monaco', 'Clubes Europeus', 'França', 3830),
('Saint-Étienne', 'saint-etienne', 'Clubes Europeus', 'França', 3840),
('Bordeaux', 'bordeaux', 'Clubes Europeus', 'França', 3850),
('Lille', 'lille', 'Clubes Europeus', 'França', 3860),
('Nantes', 'nantes', 'Clubes Europeus', 'França', 3870),
('Rennes', 'rennes', 'Clubes Europeus', 'França', 3880),
('Lens', 'lens', 'Clubes Europeus', 'França', 3890),
('Nice', 'nice', 'Clubes Europeus', 'França', 3900),
('Toulouse', 'toulouse', 'Clubes Europeus', 'França', 3910),
-- Portugal
    ('Benfica', 'benfica', 'Clubes Europeus', 'Portugal', 4000),
('Porto', 'fc-porto', 'Clubes Europeus', 'Portugal', 4010),
('Sporting CP', 'sporting-cp', 'Clubes Europeus', 'Portugal', 4020),
('Braga', 'sc-braga', 'Clubes Europeus', 'Portugal', 4030),
('Vitória de Guimarães', 'vitoria-guimaraes', 'Clubes Europeus', 'Portugal', 4040),
('Boavista', 'boavista', 'Clubes Europeus', 'Portugal', 4050),
('Belenenses', 'belenenses', 'Clubes Europeus', 'Portugal', 4060),
('Marítimo', 'maritimo', 'Clubes Europeus', 'Portugal', 4070),
('Académica', 'academica', 'Clubes Europeus', 'Portugal', 4080),
-- Holanda
    ('Ajax', 'ajax', 'Clubes Europeus', 'Holanda', 4100),
('PSV', 'psv', 'Clubes Europeus', 'Holanda', 4110),
('Feyenoord', 'feyenoord', 'Clubes Europeus', 'Holanda', 4120),
('AZ Alkmaar', 'az-alkmaar', 'Clubes Europeus', 'Holanda', 4130),
('Twente', 'twente', 'Clubes Europeus', 'Holanda', 4140),
('Utrecht', 'utrecht', 'Clubes Europeus', 'Holanda', 4150),
('Heerenveen', 'heerenveen', 'Clubes Europeus', 'Holanda', 4160),
('Groningen', 'groningen', 'Clubes Europeus', 'Holanda', 4170),
-- Escócia
    ('Celtic', 'celtic', 'Clubes Europeus', 'Escócia', 4200),
('Rangers', 'rangers', 'Clubes Europeus', 'Escócia', 4210),
('Aberdeen', 'aberdeen', 'Clubes Europeus', 'Escócia', 4220),
('Hearts', 'heart-of-midlothian', 'Clubes Europeus', 'Escócia', 4230),
('Hibernian', 'hibernian', 'Clubes Europeus', 'Escócia', 4240),
-- Turquia
    ('Galatasaray', 'galatasaray', 'Clubes Europeus', 'Turquia', 4300),
('Fenerbahçe', 'fenerbahce', 'Clubes Europeus', 'Turquia', 4310),
('Besiktas', 'besiktas', 'Clubes Europeus', 'Turquia', 4320),
('Trabzonspor', 'trabzonspor', 'Clubes Europeus', 'Turquia', 4330),
('Istanbul Basaksehir', 'istanbul-basaksehir', 'Clubes Europeus', 'Turquia', 4340),
-- Grécia
    ('Olympiacos', 'olympiacos', 'Clubes Europeus', 'Grécia', 4400),
('Panathinaikos', 'panathinaikos', 'Clubes Europeus', 'Grécia', 4410),
('AEK Atenas', 'aek-athens', 'Clubes Europeus', 'Grécia', 4420),
('PAOK', 'paok', 'Clubes Europeus', 'Grécia', 4430),
('Aris', 'aris-thessaloniki', 'Clubes Europeus', 'Grécia', 4440),
-- Bélgica
    ('Anderlecht', 'anderlecht', 'Clubes Europeus', 'Bélgica', 4500),
('Club Brugge', 'club-brugge', 'Clubes Europeus', 'Bélgica', 4510),
('Standard Liège', 'standard-liege', 'Clubes Europeus', 'Bélgica', 4520),
('Genk', 'genk', 'Clubes Europeus', 'Bélgica', 4530),
('Gent', 'gent', 'Clubes Europeus', 'Bélgica', 4540),
('Royal Antwerp', 'royal-antwerp', 'Clubes Europeus', 'Bélgica', 4550),
-- Leste europeu e outros
    ('Dynamo Kyiv', 'dynamo-kyiv', 'Clubes Europeus', 'Ucrânia', 4600),
('Shakhtar Donetsk', 'shakhtar-donetsk', 'Clubes Europeus', 'Ucrânia', 4610),
('Spartak Moscou', 'spartak-moscow', 'Clubes Europeus', 'Rússia', 4620),
('CSKA Moscou', 'cska-moscow', 'Clubes Europeus', 'Rússia', 4630),
('Zenit', 'zenit', 'Clubes Europeus', 'Rússia', 4640),
('Estrela Vermelha', 'red-star-belgrade', 'Clubes Europeus', 'Sérvia', 4650),
('Partizan', 'partizan-belgrade', 'Clubes Europeus', 'Sérvia', 4660),
('Dinamo Zagreb', 'dinamo-zagreb', 'Clubes Europeus', 'Croácia', 4670),
('Hajduk Split', 'hajduk-split', 'Clubes Europeus', 'Croácia', 4680),
('Steaua Bucareste', 'steaua-bucharest', 'Clubes Europeus', 'Romênia', 4690),
('Rapid Viena', 'rapid-vienna', 'Clubes Europeus', 'Áustria', 4700),
('Basel', 'basel', 'Clubes Europeus', 'Suíça', 4710),
('Young Boys', 'young-boys', 'Clubes Europeus', 'Suíça', 4720),
('Copenhagen', 'copenhagen', 'Clubes Europeus', 'Dinamarca', 4730),
('Brøndby', 'brondby', 'Clubes Europeus', 'Dinamarca', 4740),
('Rosenborg', 'rosenborg', 'Clubes Europeus', 'Noruega', 4750),
('Malmö', 'malmo', 'Clubes Europeus', 'Suécia', 4760);

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
