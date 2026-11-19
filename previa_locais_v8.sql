-- =====================================================================
-- PRÉVIA DA MIGRAÇÃO v8 (somente leitura — não altera nada)
-- Mostra, para cada lugar de hoje, para onde as peças vão.
-- Linhas com "SEM REGRA" precisam de uma decisão antes da migração.
-- =====================================================================

set client_min_messages = warning;

-- ---------------------------------------------------------------------
-- LISTA NOVA DE LOCAIS E SETORES  (o que vale daqui para a frente)
-- ---------------------------------------------------------------------
drop table if exists v8_locais_novos;
create temp table v8_locais_novos (ordem int, nome text, setores text[]);

insert into v8_locais_novos values
(1, 'MONTE CARLO POKER CLUBE', array['Jogo','A&B','Recepção','T.I.','Administrativo','Financeiro','Manutenção','Segurança',
    'Bombeiros','RH','Operações e Logística','Compras','Uniforme','Portaria','Estoque','Limpeza','Estacionamento',
    'Eventos e Decoração','Controle de Acesso']),
(2, 'MIRAGE', array['Jogo','A&B','Recepção','T.I.','Administrativo','Financeiro','Manutenção','Segurança',
    'Bombeiros','RH','Operações e Logística','Compras','Uniforme','Portaria','Estoque','Limpeza','Estacionamento',
    'Eventos e Decoração','Controle de Acesso','Marketing']),
(3, 'DORYO', array['Jogo','A&B','Recepção','T.I.','Administrativo','Financeiro','Manutenção','Segurança',
    'Bombeiros','RH','Operações e Logística','Compras','Uniforme','Portaria','Estoque','Limpeza','Estacionamento',
    'Eventos e Decoração','Controle de Acesso']),
(4, 'ESCRITÓRIO CENTRAL', array['Jogo','A&B','Recepção','T.I.','Administrativo','Financeiro','Manutenção','Segurança',
    'Bombeiros','RH','Operações e Logística','Compras','Uniforme','Portaria','Estoque','Limpeza','Estacionamento',
    'Eventos e Decoração','Controle de Acesso']),
(5, 'ESCRITÓRIO GUARARAPES', array[]::text[]),
(6, 'CASAS DO CHEFE', array[]::text[]),
(7, 'CASAS DE FUNCIONÁRIOS', array[]::text[]),
(8, 'FLATS DO CHEFE', array[]::text[]),
(9, 'DEPÓSITOS', array['CD1','CD2','Prédio da Cardoso','Descarte','Manutenção']);

-- ---------------------------------------------------------------------
-- PARA ONDE VAI CADA LOCAL ANTIGO
--   novo  = local novo
--   setor = setor dentro do local novo (vazio = sem setor)
--   onde  = texto que vai para "Onde fica"
-- O setor antigo (ex.: PRATELEIRA A) também vai para "Onde fica",
-- a não ser que tenha o mesmo nome de um setor novo (ex.: Jogo).
-- ---------------------------------------------------------------------
drop table if exists v8_de_para;
create temp table v8_de_para (antigo text, novo text, setor text, onde text);

insert into v8_de_para values
('CASA 1', 'CASAS DO CHEFE', null, 'Casa 1'),
('CASA 2', 'CASAS DO CHEFE', null, 'Casa 2'),
('CASA 3', 'CASAS DO CHEFE', null, 'Casa 3'),
('CASA 4', 'CASAS DO CHEFE', null, 'Casa 4'),
('CASA 5', 'CASAS DO CHEFE', null, 'Casa 5'),
('CASA 6', 'CASAS DO CHEFE', null, 'Casa 6'),
('CASA 1 ( FUNCIONARIOS)', 'CASAS DE FUNCIONÁRIOS', null, 'Casa 1'),
('CASA 2 ( FUNCIONARIOS)', 'CASAS DE FUNCIONÁRIOS', null, 'Casa 2'),
('CASA 3 ( FUNCIONARIOS)', 'CASAS DE FUNCIONÁRIOS', null, 'Casa 3'),
('CASA 4 ( FUNCIONARIOS)', 'CASAS DE FUNCIONÁRIOS', null, 'Casa 4'),
('ESCRITÓRIO 1', 'ESCRITÓRIO CENTRAL', null, 'Escritório 1'),
('ESCRITÓRIO 2', 'ESCRITÓRIO CENTRAL', null, 'Escritório 2'),
('ESCRITÓRIO 3', 'ESCRITÓRIO CENTRAL', null, 'Escritório 3'),
('ESTACIONAMENTO 1', 'MONTE CARLO POKER CLUBE', 'Estacionamento', 'Estacionamento 1'),
('ESTACIONAMENTO 2', 'MONTE CARLO POKER CLUBE', 'Estacionamento', 'Estacionamento 2'),
('ESTACIONAMENTO 3', 'MIRAGE', 'Estacionamento', 'Estacionamento 1'),
('M.C.', 'MONTE CARLO POKER CLUBE', null, null),
('MONTE CARLO', 'MONTE CARLO POKER CLUBE', null, null),
('M.G.', 'MIRAGE', null, null),
('CD1', 'DEPÓSITOS', 'CD1', null),
('CD2', 'DEPÓSITOS', 'CD2', null),
('PREDIO CARDOSO', 'DEPÓSITOS', 'Prédio da Cardoso', null),
('MANUTENCAO', 'DEPÓSITOS', 'Manutenção', null),
('DESCARTE/BAIXA TOTAL', 'DEPÓSITOS', 'Descarte', null);

-- Comparação de nomes sem acento, maiúsculas, espaços ou pontuação.
create or replace function pg_temp.v8_chave(t text) returns text language sql immutable as $$
    select regexp_replace(lower(translate(coalesce(t, ''),
        'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
        'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')), '[^a-z0-9&]', '', 'g')
$$;

-- Local antigo → local novo (nome), setor novo (nome), texto "onde fica".
-- Locais que já têm o nome de um local novo (ex.: DORYO) continuam nele.
create or replace function pg_temp.v8_regra(p_local_id int)
returns table (novo text, setor text, onde text) language sql stable as $$
    select coalesce(dp.novo, ln.nome), dp.setor, dp.onde
    from public.locais l
    left join v8_de_para dp on pg_temp.v8_chave(dp.antigo) = pg_temp.v8_chave(l.nome)
    left join v8_locais_novos ln on pg_temp.v8_chave(ln.nome) = pg_temp.v8_chave(l.nome)
    where l.id = p_local_id and (dp.novo is not null or ln.nome is not null)
$$;
-- =====================================================================
-- PRÉVIA: como cada peça vai ficar (somente leitura)
-- =====================================================================
select
    l.nome                               as local_antigo,
    coalesce(s.nome, '—')                as setor_antigo,
    coalesce(rg.novo, '⚠ SEM REGRA — me avise') as local_novo,
    coalesce(rg.setor, (
        select st from v8_locais_novos n, unnest(n.setores) st
        where pg_temp.v8_chave(n.nome) = pg_temp.v8_chave(rg.novo)
          and pg_temp.v8_chave(st) = pg_temp.v8_chave(s.nome) limit 1), '—') as setor_novo,
    coalesce(nullif(concat_ws(' · ', rg.onde,
        case when s.id is not null and (rg.setor is not null or not exists (
            select 1 from v8_locais_novos n, unnest(n.setores) st
            where pg_temp.v8_chave(n.nome) = pg_temp.v8_chave(rg.novo)
              and pg_temp.v8_chave(st) = pg_temp.v8_chave(s.nome))) then s.nome end), ''), '—') as onde_fica,
    count(*)                             as registros,
    sum(i.quantidade)                    as pecas
from public.itens i
join public.locais l on l.id = i.local_id
left join public.subsetores s on s.id = i.subsetor_id
left join lateral pg_temp.v8_regra(l.id) rg on true
where i.quantidade > 0
group by l.nome, s.id, s.nome, rg.novo, rg.setor, rg.onde
order by (rg.novo is null) desc, rg.novo, l.nome, s.nome;
