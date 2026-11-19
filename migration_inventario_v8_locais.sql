-- =====================================================================
-- INVENTÁRIO CENTRAL — GRUPO MONTE CARLO
-- MIGRAÇÃO v8 · LOCAIS SIMPLIFICADOS + "ONDE FICA"
--
-- Antes: rode a PRÉVIA (previa_locais_v8.sql) e confira.
-- Depois: rode este arquivo UMA vez no Supabase (SQL Editor → Run).
-- Pode ser rodado de novo sem estragar nada (a reorganização só
-- acontece uma vez).
--
-- Local  = o lugar grande (Monte Carlo, Mirage, Casas do chefe…)
-- Setor  = a área de uso dentro do local (Jogo, A&B, RH…)
-- Onde fica = texto livre para o detalhe (3º andar, Casa 3…)
--
-- Os locais antigos ficam inativos (somem das listas mas continuam
-- aparecendo no histórico). O nome antigo vai para "Onde fica".
-- =====================================================================

begin;

set local client_min_messages = warning;

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
-- PARTE 1 — CAMPO "ONDE FICA"
-- Texto livre para o detalhe: "3º andar", "Casa 3", "sala do financeiro".
-- Também guardado no lugar fixo (origem) e no histórico.
-- =====================================================================

alter table public.itens         add column if not exists onde_fica         text;
alter table public.itens         add column if not exists origem_onde_fica  text;
alter table public.movimentacoes add column if not exists origem_onde_fica  text;
alter table public.movimentacoes add column if not exists destino_onde_fica text;

-- Espaços sobrando e texto vazio não contam.
create or replace function public.fn_texto_lugar(p text)
returns text
language sql
immutable
as $$
    select nullif(regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g'), '')
$$;

create or replace function public.fn_mesmo_texto(a text, b text)
returns boolean
language sql
immutable
as $$
    select lower(coalesce(public.fn_texto_lugar(a), '')) = lower(coalesce(public.fn_texto_lugar(b), ''))
$$;

-- Regras ao gravar (substitui a da v4):
--   · sem lugar fixo informado → lugar fixo = onde está agora;
--   · no lugar fixo → limpa "fora desde" e "retorno previsto";
--   · fora do lugar → marca desde quando.
create or replace function public.fn_itens_origem()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    new.onde_fica        := public.fn_texto_lugar(new.onde_fica);
    new.origem_onde_fica := public.fn_texto_lugar(new.origem_onde_fica);

    if new.origem_local_id is null then
        new.origem_local_id    := new.local_id;
        new.origem_subsetor_id := new.subsetor_id;
        new.origem_onde_fica   := new.onde_fica;
    end if;

    if new.origem_subsetor_id is not null and not exists (
        select 1 from public.subsetores s
        where s.id = new.origem_subsetor_id and s.local_id = new.origem_local_id
    ) then
        raise exception 'O setor do lugar fixo não pertence ao local fixo.' using errcode = '23514';
    end if;

    if new.local_id = new.origem_local_id
       and coalesce(new.subsetor_id, 0) = coalesce(new.origem_subsetor_id, 0)
       and public.fn_mesmo_texto(new.onde_fica, new.origem_onde_fica) then
        new.fora_desde := null;
        new.retorno_previsto := null;
    elsif new.fora_desde is null then
        new.fora_desde := now();
    end if;

    return new;
end;
$$;


-- =====================================================================
-- PARTE 2 — REORGANIZAÇÃO DOS LOCAIS (feita uma vez só)
-- =====================================================================

do $$
declare
    v_sem_regra text;
begin
    if exists (select 1 from public.configuracoes where chave = 'v8_locais_reorganizados') then
        raise notice 'Locais já reorganizados antes: parte 2 ignorada.';
        return;
    end if;

    -- 2.1 Todo local com peças precisa ter destino definido.
    select string_agg(distinct l.nome, ', ' order by l.nome) into v_sem_regra
    from public.itens i
    join public.locais l on l.id in (i.local_id, i.origem_local_id)
    where i.quantidade > 0
      and not exists (select 1 from pg_temp.v8_regra(l.id));

    if v_sem_regra is not null then
        raise exception 'Estes locais têm peças e não estão na lista de/para: %. Nada foi alterado.', v_sem_regra;
    end if;
end $$;

do $$
declare
    r          record;
    v_id       int;
    v_setor    text;
begin
    if exists (select 1 from public.configuracoes where chave = 'v8_locais_reorganizados') then
        return;
    end if;

    -- 2.2 Locais novos (reaproveita o que já tem o mesmo nome).
    for r in select * from v8_locais_novos order by ordem loop
        select id into v_id from public.locais where pg_temp.v8_chave(nome) = pg_temp.v8_chave(r.nome)
        order by ativo desc, id limit 1;
        if v_id is null then
            insert into public.locais (nome, ativo, ordem) values (r.nome, true, r.ordem) returning id into v_id;
        else
            update public.locais set nome = r.nome, ativo = true, ordem = r.ordem where id = v_id;
        end if;

        -- 2.3 Setores de cada local novo.
        foreach v_setor in array r.setores loop
            if exists (select 1 from public.subsetores s
                       where s.local_id = v_id and pg_temp.v8_chave(s.nome) = pg_temp.v8_chave(v_setor)) then
                update public.subsetores set ativo = true
                where local_id = v_id and pg_temp.v8_chave(nome) = pg_temp.v8_chave(v_setor);
            else
                insert into public.subsetores (local_id, nome, ativo) values (v_id, v_setor, true);
            end if;
        end loop;
    end loop;
end $$;

-- 2.4 Tradução de cada combinação (local antigo + setor antigo) para a nova.
drop table if exists v8_traducao;
create temp table v8_traducao as
with combinacoes as (
    select local_id, subsetor_id from public.itens where quantidade > 0
    union
    select origem_local_id, origem_subsetor_id from public.itens where quantidade > 0
)
select
    c.local_id     as local_antigo,
    c.subsetor_id  as setor_antigo,
    ln.id          as local_novo,
    coalesce(sn_regra.id, sn_igual.id) as setor_novo,
    public.fn_texto_lugar(concat_ws(' · ',
        rg.onde,
        case when s_antigo.id is not null and (rg.setor is not null or sn_igual.id is null) then s_antigo.nome end
    )) as onde
from combinacoes c
cross join lateral pg_temp.v8_regra(c.local_id) rg
join public.locais ln on pg_temp.v8_chave(ln.nome) = pg_temp.v8_chave(rg.novo) and ln.ativo
left join public.subsetores s_antigo on s_antigo.id = c.subsetor_id
left join public.subsetores sn_regra
       on rg.setor is not null and sn_regra.local_id = ln.id and pg_temp.v8_chave(sn_regra.nome) = pg_temp.v8_chave(rg.setor)
left join public.subsetores sn_igual
       on rg.setor is null and s_antigo.id is not null and sn_igual.local_id = ln.id and sn_igual.ativo
      and pg_temp.v8_chave(sn_igual.nome) = pg_temp.v8_chave(s_antigo.nome)
      and exists (select 1 from v8_locais_novos x, unnest(x.setores) st
                  where pg_temp.v8_chave(x.nome) = pg_temp.v8_chave(ln.nome) and pg_temp.v8_chave(st) = pg_temp.v8_chave(s_antigo.nome));

do $$
declare
    r record;
begin
    if exists (select 1 from public.configuracoes where chave = 'v8_locais_reorganizados') then
        return;
    end if;

    -- 2.5 Move as peças. O índice de grupo é recriado no fim (parte 3).
    drop index if exists public.ux_itens_lote_origem;
    drop index if exists public.ux_itens_lote_v8;

    update public.itens i
    set local_id           = t.local_novo,
        subsetor_id        = t.setor_novo,
        onde_fica          = public.fn_texto_lugar(concat_ws(' · ', t.onde, i.onde_fica)),
        origem_local_id    = o.local_novo,
        origem_subsetor_id = o.setor_novo,
        origem_onde_fica   = public.fn_texto_lugar(concat_ws(' · ', o.onde, i.origem_onde_fica))
    from v8_traducao t, v8_traducao o
    where i.quantidade > 0
      and t.local_antigo = i.local_id and coalesce(t.setor_antigo, 0) = coalesce(i.subsetor_id, 0)
      and o.local_antigo = i.origem_local_id and coalesce(o.setor_antigo, 0) = coalesce(i.origem_subsetor_id, 0)
      and (i.local_id, i.subsetor_id, i.onde_fica, i.origem_local_id, i.origem_subsetor_id, i.origem_onde_fica)
          is distinct from
          (t.local_novo, t.setor_novo, public.fn_texto_lugar(concat_ws(' · ', t.onde, i.onde_fica)),
           o.local_novo, o.setor_novo, public.fn_texto_lugar(concat_ws(' · ', o.onde, i.origem_onde_fica)));

    -- 2.6 Grupos que ficaram iguais viram um só (a quantidade é somada).
    for r in
        select min(id) as fica, array_agg(id order by id) as ids, sum(quantidade)::int as total,
               min(fora_desde) as fora, min(retorno_previsto) as retorno
        from public.itens
        where patrimonio is null and quantidade > 0
        group by nome_normalizado, local_id, coalesce(subsetor_id, 0), status,
                 origem_local_id, coalesce(origem_subsetor_id, 0),
                 lower(coalesce(onde_fica, '')), lower(coalesce(origem_onde_fica, ''))
        having count(*) > 1
    loop
        update public.itens set quantidade = 0 where id = any (r.ids) and id <> r.fica;
        update public.itens set quantidade = r.total, retorno_previsto = r.retorno where id = r.fica;
        delete from public.itens
        where id = any (r.ids) and id <> r.fica
          and not exists (select 1 from public.movimentacoes m where m.item_id = itens.id or m.item_destino_id = itens.id);
    end loop;

    -- 2.7 Locais antigos saem das listas (continuam no histórico).
    update public.locais l set ativo = false
    where l.ativo
      and not exists (select 1 from v8_locais_novos n where pg_temp.v8_chave(n.nome) = pg_temp.v8_chave(l.nome));

    -- 2.8 Setores que não estão na lista nova saem das listas.
    update public.subsetores s set ativo = false
    where s.ativo is distinct from false
      and not exists (
          select 1 from v8_locais_novos n
          join public.locais l on pg_temp.v8_chave(l.nome) = pg_temp.v8_chave(n.nome) and l.ativo
          cross join unnest(n.setores) st
          where l.id = s.local_id and pg_temp.v8_chave(st) = pg_temp.v8_chave(s.nome));

    insert into public.configuracoes (chave, valor) values ('v8_locais_reorganizados', now()::text);
end $$;


-- =====================================================================
-- PARTE 3 — GRUPO DE PEÇAS
-- Mesma peça + mesmo lugar (local, setor, onde fica) + mesmo status
-- + mesmo lugar fixo = um registro só. Registros zerados (guardados
-- por causa do histórico) não contam.
-- =====================================================================

drop index if exists public.ux_itens_lote_origem;
create unique index if not exists ux_itens_lote_v8
    on public.itens (nome_normalizado, local_id, (coalesce(subsetor_id, 0)), status,
                     origem_local_id, (coalesce(origem_subsetor_id, 0)),
                     (lower(coalesce(onde_fica, ''))), (lower(coalesce(origem_onde_fica, ''))))
    where patrimonio is null and quantidade > 0;


-- =====================================================================
-- PARTE 4 — CADASTRO E MOVIMENTAÇÃO COM "ONDE FICA"
-- =====================================================================

drop function if exists public.registrar_entrada(text, bigint, integer, bigint, text, text, text, text, text, text);
drop function if exists public.movimentar_item(bigint, bigint, integer, bigint, text, text, boolean, date);

create or replace function public.registrar_entrada(
    p_nome          text,
    p_local_id      bigint,
    p_quantidade    integer default 1,
    p_subsetor_id   bigint  default null,
    p_tipo          text    default null,
    p_descricao     text    default null,
    p_status        text    default 'Ativo',
    p_patrimonio    text    default null,
    p_foto_url      text    default null,
    p_observacao    text    default null,
    p_onde_fica     text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_nome       text := btrim(coalesce(p_nome, ''));
    v_patrimonio text := nullif(btrim(coalesce(p_patrimonio, '')), '');
    v_status     text := coalesce(nullif(btrim(coalesce(p_status, '')), ''), 'Ativo');
    v_onde       text := public.fn_texto_lugar(p_onde_fica);
    v_qtd        integer;
    v_id         bigint;
begin
    perform public.fn_exigir_perfil(array['operacional', 'gestor', 'administrador']);

    if v_nome = '' then raise exception 'Informe o nome da peça.'; end if;
    if p_local_id is null then raise exception 'Selecione o local.'; end if;

    if v_patrimonio is not null then
        v_qtd := 1;
        if exists (select 1 from public.itens where patrimonio = v_patrimonio) then
            raise exception 'O código % já está cadastrado.', v_patrimonio using errcode = '23505';
        end if;

        insert into public.itens (patrimonio, nome, tipo, descricao, local_id, subsetor_id, onde_fica,
                                  origem_local_id, origem_subsetor_id, origem_onde_fica, quantidade, status, foto_url)
        values (v_patrimonio, v_nome, coalesce(nullif(btrim(p_tipo), ''), v_nome), nullif(btrim(p_descricao), ''),
                p_local_id, p_subsetor_id, v_onde, p_local_id, p_subsetor_id, v_onde, 1, v_status, nullif(p_foto_url, ''))
        returning id into v_id;
    else
        v_qtd := coalesce(p_quantidade, 0);
        if v_qtd < 1 then raise exception 'A quantidade deve ser maior que zero.'; end if;

        insert into public.itens (patrimonio, nome, tipo, descricao, local_id, subsetor_id, onde_fica,
                                  origem_local_id, origem_subsetor_id, origem_onde_fica, quantidade, status, foto_url)
        values (null, v_nome, coalesce(nullif(btrim(p_tipo), ''), v_nome), nullif(btrim(p_descricao), ''),
                p_local_id, p_subsetor_id, v_onde, p_local_id, p_subsetor_id, v_onde, v_qtd, v_status, nullif(p_foto_url, ''))
        on conflict (nome_normalizado, local_id, (coalesce(subsetor_id, 0)), status,
                     origem_local_id, (coalesce(origem_subsetor_id, 0)),
                     (lower(coalesce(onde_fica, ''))), (lower(coalesce(origem_onde_fica, ''))))
            where patrimonio is null and quantidade > 0
        do update set
            quantidade = public.itens.quantidade + excluded.quantidade,
            foto_url   = coalesce(excluded.foto_url, public.itens.foto_url)
        returning id into v_id;
    end if;

    insert into public.movimentacoes (tipo_movimento, item_id, item_destino_id, item_nome,
                                      origem_id, destino_id, origem_subsetor_id, destino_subsetor_id,
                                      destino_onde_fica, usuario_id, quantidade, observacao, status_novo, data)
    values ('ENTRADA', v_id, v_id, v_nome, null, p_local_id, null, p_subsetor_id,
            v_onde, auth.uid(), v_qtd, nullif(btrim(p_observacao), ''), v_status, now());

    return jsonb_build_object('item_id', v_id, 'quantidade', v_qtd);
end;
$$;

-- Cada linha da distribuição pode ter o seu "onde_fica".
create or replace function public.registrar_pecas(
    p_nome          text,
    p_distribuicao  jsonb,
    p_categoria     text default null,
    p_descricao     text default null,
    p_foto_url      text default null,
    p_status        text default 'Ativo',
    p_observacao    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_linha    record;
    v_total    integer := 0;
    v_linhas   integer := 0;
    v_res      jsonb;
    v_produto  bigint;
begin
    perform public.fn_exigir_perfil(array['operacional', 'gestor', 'administrador']);

    if btrim(coalesce(p_nome, '')) = '' then
        raise exception 'Informe o nome da peça.';
    end if;

    if p_distribuicao is null
       or jsonb_typeof(p_distribuicao) <> 'array'
       or jsonb_array_length(p_distribuicao) = 0 then
        raise exception 'Informe pelo menos um local com quantidade.';
    end if;

    -- Linhas repetidas (mesmo local, setor e onde fica) são somadas.
    for v_linha in
        select nullif(e ->> 'local_id', '')::bigint    as local_id,
               nullif(e ->> 'subsetor_id', '')::bigint as subsetor_id,
               min(public.fn_texto_lugar(e ->> 'onde_fica')) as onde_fica,
               sum(coalesce(nullif(e ->> 'quantidade', '')::integer, 0))::integer as quantidade
        from jsonb_array_elements(p_distribuicao) e
        group by 1, 2, lower(coalesce(public.fn_texto_lugar(e ->> 'onde_fica'), ''))
        order by 1, 2, 3
    loop
        if v_linha.local_id is null then
            raise exception 'Há uma linha sem local.';
        end if;
        if v_linha.quantidade < 1 then
            raise exception 'Há uma linha com quantidade inválida.';
        end if;

        v_res := public.registrar_entrada(
            p_nome, v_linha.local_id, v_linha.quantidade, v_linha.subsetor_id,
            p_categoria, p_descricao, p_status, null::text, p_foto_url, p_observacao, v_linha.onde_fica);

        v_total  := v_total + v_linha.quantidade;
        v_linhas := v_linhas + 1;
    end loop;

    select produto_id into v_produto from public.itens where id = (v_res ->> 'item_id')::bigint;

    update public.produtos
    set categoria = coalesce(categoria, nullif(btrim(coalesce(p_categoria, '')), '')),
        descricao = coalesce(descricao, nullif(btrim(coalesce(p_descricao, '')), '')),
        foto_url  = coalesce(foto_url, nullif(p_foto_url, ''))
    where id = v_produto
      and (categoria is null or descricao is null or foto_url is null);

    return jsonb_build_object('produto_id', v_produto, 'total', v_total, 'linhas', v_linhas);
end;
$$;

create or replace function public.movimentar_item(
    p_item_id              bigint,
    p_destino_id           bigint,
    p_quantidade           integer,
    p_destino_subsetor_id  bigint  default null,
    p_status               text    default null,
    p_observacao           text    default null,
    p_definitivo           boolean default false,
    p_retorno_previsto     date    default null,
    p_destino_onde_fica    text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item        public.itens%rowtype;
    v_status      text;
    v_onde        text := public.fn_texto_lugar(p_destino_onde_fica);
    v_destino_id  bigint;
    v_org_local   integer;
    v_org_sub     bigint;
    v_org_onde    text;
    v_retorno     date;
    v_tipo        text;
    v_volta_casa  boolean;
    v_mesmo_lugar boolean;
begin
    perform public.fn_exigir_perfil(array['operacional', 'gestor', 'administrador']);

    select * into v_item from public.itens where id = p_item_id for update;

    if not found then raise exception 'Peça não encontrada.'; end if;
    if p_destino_id is null then raise exception 'Selecione o destino.'; end if;
    if coalesce(p_quantidade, 0) < 1 then raise exception 'A quantidade deve ser maior que zero.'; end if;
    if p_quantidade > v_item.quantidade then
        raise exception 'Quantidade indisponível. Há % peça(s) neste lugar.', v_item.quantidade;
    end if;

    v_status := coalesce(nullif(btrim(coalesce(p_status, '')), ''), v_item.status);
    v_mesmo_lugar := p_destino_id = v_item.local_id
                     and coalesce(p_destino_subsetor_id, 0) = coalesce(v_item.subsetor_id, 0)
                     and public.fn_mesmo_texto(v_onde, v_item.onde_fica);

    if v_mesmo_lugar and v_status = v_item.status
       and not (coalesce(p_definitivo, false)
                and (p_destino_id <> v_item.origem_local_id
                     or coalesce(p_destino_subsetor_id, 0) <> coalesce(v_item.origem_subsetor_id, 0)
                     or not public.fn_mesmo_texto(v_onde, v_item.origem_onde_fica))) then
        raise exception 'A peça já está neste lugar. Escolha outro local, setor ou "onde fica".';
    end if;

    if coalesce(p_definitivo, false) then
        v_org_local := p_destino_id;
        v_org_sub   := p_destino_subsetor_id;
        v_org_onde  := v_onde;
    else
        v_org_local := v_item.origem_local_id;
        v_org_sub   := v_item.origem_subsetor_id;
        v_org_onde  := v_item.origem_onde_fica;
    end if;

    v_volta_casa := p_destino_id = v_org_local
                    and coalesce(p_destino_subsetor_id, 0) = coalesce(v_org_sub, 0)
                    and public.fn_mesmo_texto(v_onde, v_org_onde);
    v_retorno    := case when v_volta_casa then null else p_retorno_previsto end;

    if v_item.patrimonio is not null then
        if p_quantidade <> 1 then raise exception 'Peça com código individual só pode ser movimentada com quantidade 1.'; end if;

        update public.itens
        set local_id = p_destino_id, subsetor_id = p_destino_subsetor_id, onde_fica = v_onde, status = v_status,
            origem_local_id = v_org_local, origem_subsetor_id = v_org_sub, origem_onde_fica = v_org_onde,
            retorno_previsto = v_retorno,
            fora_desde = case when v_volta_casa then null else coalesce(fora_desde, now()) end
        where id = v_item.id;

        v_destino_id := v_item.id;
    else
        select id into v_destino_id
        from public.itens
        where patrimonio is null
          and quantidade > 0
          and nome_normalizado = v_item.nome_normalizado
          and local_id = p_destino_id
          and coalesce(subsetor_id, 0) = coalesce(p_destino_subsetor_id, 0)
          and public.fn_mesmo_texto(onde_fica, v_onde)
          and status = v_status
          and origem_local_id = v_org_local
          and coalesce(origem_subsetor_id, 0) = coalesce(v_org_sub, 0)
          and public.fn_mesmo_texto(origem_onde_fica, v_org_onde)
          and id <> v_item.id
        for update;

        if p_quantidade = v_item.quantidade and v_destino_id is null then
            update public.itens
            set local_id = p_destino_id, subsetor_id = p_destino_subsetor_id, onde_fica = v_onde, status = v_status,
                origem_local_id = v_org_local, origem_subsetor_id = v_org_sub, origem_onde_fica = v_org_onde,
                retorno_previsto = v_retorno,
                fora_desde = case when v_volta_casa then null else coalesce(fora_desde, now()) end
            where id = v_item.id;

            v_destino_id := v_item.id;
        else
            update public.itens set quantidade = quantidade - p_quantidade where id = v_item.id;

            insert into public.itens (patrimonio, nome, tipo, descricao, local_id, subsetor_id, onde_fica,
                                      origem_local_id, origem_subsetor_id, origem_onde_fica, quantidade, status,
                                      foto_url, produto_id, retorno_previsto)
            values (null, v_item.nome, v_item.tipo, v_item.descricao, p_destino_id, p_destino_subsetor_id, v_onde,
                    v_org_local, v_org_sub, v_org_onde, p_quantidade, v_status, v_item.foto_url, v_item.produto_id, v_retorno)
            on conflict (nome_normalizado, local_id, (coalesce(subsetor_id, 0)), status,
                         origem_local_id, (coalesce(origem_subsetor_id, 0)),
                         (lower(coalesce(onde_fica, ''))), (lower(coalesce(origem_onde_fica, ''))))
                where patrimonio is null and quantidade > 0
            do update set
                quantidade = public.itens.quantidade + excluded.quantidade,
                retorno_previsto = case
                    when public.itens.retorno_previsto is null then excluded.retorno_previsto
                    when excluded.retorno_previsto is null then public.itens.retorno_previsto
                    else least(public.itens.retorno_previsto, excluded.retorno_previsto) end
            returning id into v_destino_id;

            delete from public.itens
            where id = v_item.id and quantidade = 0
              and not exists (select 1 from public.movimentacoes m where m.item_id = v_item.id or m.item_destino_id = v_item.id);
        end if;
    end if;

    v_tipo := case
        when v_mesmo_lugar and v_status <> v_item.status then 'STATUS'
        when coalesce(p_definitivo, false) then 'REMANEJAMENTO'
        when v_volta_casa then 'DEVOLUCAO'
        else 'SAIDA_TEMPORARIA' end;

    insert into public.movimentacoes (tipo_movimento, item_id, item_destino_id, item_nome,
                                      origem_id, destino_id, origem_subsetor_id, destino_subsetor_id,
                                      origem_onde_fica, destino_onde_fica,
                                      usuario_id, quantidade, observacao, status_anterior, status_novo,
                                      retorno_previsto, data)
    values (v_tipo, v_item.id, v_destino_id, v_item.nome,
            v_item.local_id, p_destino_id, v_item.subsetor_id, p_destino_subsetor_id,
            v_item.onde_fica, v_onde,
            auth.uid(), p_quantidade, nullif(btrim(coalesce(p_observacao, '')), ''),
            v_item.status, v_status, v_retorno, now());

    return jsonb_build_object(
        'tipo', v_tipo,
        'item_origem_id', v_item.id,
        'item_destino_id', v_destino_id,
        'quantidade', p_quantidade,
        'saldo_origem', case when v_destino_id = v_item.id then 0 else v_item.quantidade - p_quantidade end
    );
end;
$$;

create or replace function public.devolver_item(
    p_item_id    bigint,
    p_quantidade integer default null,
    p_observacao text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_item public.itens%rowtype;
begin
    select * into v_item from public.itens where id = p_item_id;
    if not found then raise exception 'Peça não encontrada.'; end if;

    if v_item.local_id = v_item.origem_local_id
       and coalesce(v_item.subsetor_id, 0) = coalesce(v_item.origem_subsetor_id, 0)
       and public.fn_mesmo_texto(v_item.onde_fica, v_item.origem_onde_fica) then
        raise exception 'Esta peça já está no lugar dela.';
    end if;

    return public.movimentar_item(
        v_item.id, v_item.origem_local_id, coalesce(p_quantidade, v_item.quantidade),
        v_item.origem_subsetor_id, null,
        coalesce(nullif(btrim(coalesce(p_observacao, '')), ''), 'Devolução ao lugar fixo'),
        false, null, v_item.origem_onde_fica);
end;
$$;

revoke execute on function public.registrar_entrada(text, bigint, integer, bigint, text, text, text, text, text, text, text) from public, anon;
revoke execute on function public.registrar_pecas(text, jsonb, text, text, text, text, text)                              from public, anon;
revoke execute on function public.movimentar_item(bigint, bigint, integer, bigint, text, text, boolean, date, text)       from public, anon;
revoke execute on function public.devolver_item(bigint, integer, text)                                                   from public, anon;
revoke execute on function public.fn_texto_lugar(text), public.fn_mesmo_texto(text, text)                                from public, anon;
grant  execute on function public.registrar_entrada(text, bigint, integer, bigint, text, text, text, text, text, text, text) to authenticated;
grant  execute on function public.registrar_pecas(text, jsonb, text, text, text, text, text)                              to authenticated;
grant  execute on function public.movimentar_item(bigint, bigint, integer, bigint, text, text, boolean, date, text)       to authenticated;
grant  execute on function public.devolver_item(bigint, integer, text)                                                   to authenticated;
grant  execute on function public.fn_texto_lugar(text), public.fn_mesmo_texto(text, text)                                to authenticated;


drop table if exists v8_traducao, v8_de_para, v8_locais_novos;


commit;

-- =====================================================================
-- CONFERÊNCIA FINAL: como ficou cada local
-- =====================================================================
select l.ordem, l.nome as local,
       (select count(*) from public.subsetores s where s.local_id = l.id and s.ativo is distinct from false) as setores,
       coalesce(sum(i.quantidade), 0) as pecas,
       count(i.id) filter (where i.onde_fica is not null) as registros_com_onde_fica
from public.locais l
left join public.itens i on i.local_id = l.id and i.quantidade > 0
where l.ativo
group by l.id, l.ordem, l.nome
order by l.ordem, l.nome;
