-- =====================================================================
-- INVENTÁRIO CENTRAL — GRUPO MONTE CARLO
-- MIGRAÇÃO v7 · SEGURANÇA
--
-- Rode UMA vez no Supabase (SQL Editor → New query → colar → Run),
-- DEPOIS de publicar os arquivos novos do site.
-- Pode ser rodada de novo sem estragar nada.
--
--   Parte 1 · Permissões: fecha escrita pela consulta pública e views,
--             tira do visitante anônimo tudo o que ele não usa
--   Parte 2 · Identidade: perfil só vale para conta confirmada
--   Parte 3 · Fotos: só imagens, até 15 MB, envio só por quem opera
--   Parte 4 · Auditoria encadeada: cada registro "assina" o anterior;
--             qualquer alteração ou exclusão é detectada
--   Parte 5 · Histórico e termos assinados não podem ser alterados
--   Parte 6 · Função de verificação usada pela tela de Administração
-- =====================================================================

do $$
begin
    if to_regclass('public.configuracoes') is null or to_regclass('public.locais') is null then
        raise exception 'Rode antes as migrações v4, v5 e v6.';
    end if;
end $$;


-- =====================================================================
-- PARTE 1 — PERMISSÕES
-- =====================================================================

-- 1.1 Views só podem ser lidas (antes: anônimo alterava peças pela
--     consulta pública).
revoke insert, update, delete, truncate, references, trigger
    on public.consulta_publica_inventario, public.vw_estoque_resumo,
       public.vw_produtos_saldo, public.vw_radios
    from anon, authenticated;

-- 1.2 Visitante sem login: só a lista de locais e a consulta pública.
do $$
declare t record;
begin
    for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p') loop
        execute format('revoke all on public.%I from anon', t.relname);
        -- Permissões que a API nunca usa e que passam por cima das regras (TRUNCATE).
        execute format('revoke truncate, references, trigger on public.%I from authenticated', t.relname);
    end loop;
end $$;

grant select on public.locais, public.consulta_publica_inventario to anon;

-- Tabelas criadas no futuro não nascem abertas para o anônimo.
alter default privileges in schema public revoke all on tables from anon;

-- 1.3 Funções: o anônimo só executa as do termo de rádio.
do $$
declare
    f record;
    v_consulta text := coalesce(pg_get_viewdef('public.consulta_publica_inventario'::regclass), '');
begin
    for f in select p.oid, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.prokind = 'f'
               and p.proname not in ('termo_publico', 'assinar_termo') loop
        -- Se a consulta pública usa a função, ela continua liberada.
        if position(f.proname || '(' in v_consulta) = 0 then
            execute format('revoke execute on function %s from public, anon', f.oid::regprocedure);
        end if;
    end loop;
end $$;

alter function public.fn_cpf_valido(text) set search_path = public;


-- =====================================================================
-- PARTE 2 — IDENTIDADE
-- =====================================================================

-- Perfil do usuário logado. Vale pelo id da conta; pelo e-mail só se a
-- conta tiver o e-mail confirmado (impede alguém de criar uma conta com
-- o e-mail de outra pessoa e herdar o perfil dela).
create or replace function public.fn_perfil_atual()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select lower(btrim(u.perfil))
    from public.usuarios u
    where coalesce(u.ativo, true)
      and (u.id::text = auth.uid()::text
           or (lower(u.email) = lower(auth.jwt() ->> 'email')
               and exists (select 1 from auth.users au
                           where au.id = auth.uid() and au.email_confirmed_at is not null)))
    order by (u.id::text = auth.uid()::text) desc
    limit 1
$$;

-- Função antiga usada nas regras da versão 2: passa a seguir a mesma regra.
create or replace function public.usuario_pode_gerenciar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(public.fn_perfil_atual() in ('gestor', 'administrador'), false)
$$;

revoke execute on function public.fn_perfil_atual(), public.usuario_pode_gerenciar() from public, anon;
grant  execute on function public.fn_perfil_atual(), public.usuario_pode_gerenciar() to authenticated;

-- Sem verificação em 2 etapas: remove o que uma versão anterior deste
-- arquivo possa ter criado (se ele já tiver sido rodado).
drop trigger if exists trg_config_protegida on public.configuracoes;
drop function if exists public.fn_config_protegida();
drop function if exists public.minha_seguranca();
drop function if exists public.fn_perfil_cadastro();
drop function if exists public.fn_config(text, text);
delete from public.configuracoes where chave = 'exigir_2fa_gestao';
do $$
begin
    delete from auth.mfa_factors;
exception when others then
    raise notice 'Fatores de 2 etapas não removidos: %', sqlerrm;
end $$;

-- Regras duplicadas da versão 2 que consultavam a tabela de usuários
-- direto, sem passar pela regra acima.
drop policy if exists subsetores_insert_admin       on public.subsetores;
drop policy if exists subsetores_update_admin       on public.subsetores;
drop policy if exists subsetores_delete_admin       on public.subsetores;
drop policy if exists subsetores_select_authenticated on public.subsetores;
drop policy if exists auditoria_select_admin        on public.auditoria;
drop policy if exists auditoria_insert              on public.auditoria;
drop policy if exists auditoria_insert_authenticated on public.auditoria;
drop policy if exists p_all_aud                     on public.auditoria;
drop policy if exists p_all_mov                     on public.movimentacoes;
drop policy if exists p_all_itens                   on public.itens;

-- Inativos e sem cadastro também não leem setores.
drop policy if exists v7_subsetores_somente_ativos on public.subsetores;
create policy v7_subsetores_somente_ativos on public.subsetores
    as restrictive for all to authenticated
    using ((select public.fn_perfil_atual()) is not null)
    with check ((select public.fn_perfil_atual()) is not null);

-- Ninguém muda o próprio perfil nem se reativa.
create or replace function public.fn_usuarios_protecao()
returns trigger
language plpgsql
as $$
begin
    if current_user in ('anon', 'authenticated') and old.id::text = auth.uid()::text
       and (new.perfil is distinct from old.perfil or new.ativo is distinct from old.ativo) then
        raise exception 'Você não pode alterar o seu próprio perfil ou situação.' using errcode = '42501';
    end if;
    -- Só administrador cria ou promove administrador.
    if current_user in ('anon', 'authenticated') and lower(coalesce(new.perfil, '')) = 'administrador'
       and (tg_op = 'INSERT' or lower(coalesce(old.perfil, '')) <> 'administrador')
       and public.fn_perfil_atual() is distinct from 'administrador' then
        raise exception 'Só um administrador pode dar o perfil de administrador.' using errcode = '42501';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_usuarios_protecao on public.usuarios;
create trigger trg_usuarios_protecao
    before insert or update on public.usuarios
    for each row execute function public.fn_usuarios_protecao();


-- =====================================================================
-- PARTE 3 — FOTOS (Storage)
-- =====================================================================

update storage.buckets
set file_size_limit = 15 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'inventario';

drop policy if exists "Permitir upload"      on storage.objects;
drop policy if exists "Permitir visualizar"  on storage.objects;
drop policy if exists v7_fotos_ler           on storage.objects;
drop policy if exists v7_fotos_enviar        on storage.objects;
drop policy if exists v7_fotos_substituir    on storage.objects;
drop policy if exists v7_fotos_apagar        on storage.objects;

-- As fotos continuam abrindo pelo link (o bucket é público);
-- o que deixa de ser público é LISTAR todos os arquivos.
create policy v7_fotos_ler on storage.objects
    for select to authenticated
    using (bucket_id = 'inventario' and (select public.fn_perfil_atual()) is not null);

create policy v7_fotos_enviar on storage.objects
    for insert to authenticated
    with check (bucket_id = 'inventario'
                and (select public.fn_perfil_atual()) in ('operacional', 'gestor', 'administrador')
                and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'));

create policy v7_fotos_substituir on storage.objects
    for update to authenticated
    using (bucket_id = 'inventario' and (select public.fn_perfil_atual()) in ('gestor', 'administrador'))
    with check (bucket_id = 'inventario' and (select public.fn_perfil_atual()) in ('gestor', 'administrador')
                and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'));

create policy v7_fotos_apagar on storage.objects
    for delete to authenticated
    using (bucket_id = 'inventario'
           and ((select public.fn_perfil_atual()) in ('gestor', 'administrador')
                or ((select public.fn_perfil_atual()) is not null and owner_id = auth.uid()::text)));


-- =====================================================================
-- PARTE 4 — AUDITORIA ENCADEADA
-- Cada registro guarda o código (SHA-256) do anterior + o seu próprio.
-- Mudar ou apagar qualquer registro quebra a corrente dali em diante.
-- =====================================================================

-- O vínculo com a peça apagava o item_id da auditoria quando a peça era
-- excluída (isso alteraria o histórico). A auditoria guarda o número
-- da peça sem depender dela existir.
do $$
declare c record;
begin
    for c in select conname from pg_constraint
             where conrelid = 'public.auditoria'::regclass and contype = 'f'
               and conkey = array[(select attnum from pg_attribute
                                   where attrelid = 'public.auditoria'::regclass and attname = 'item_id')]::int2[] loop
        execute format('alter table public.auditoria drop constraint %I', c.conname);
    end loop;
end $$;

alter table public.auditoria add column if not exists cadeia_pos    bigint;
alter table public.auditoria add column if not exists hash_anterior text;
alter table public.auditoria add column if not exists hash          text;

create or replace function public.fn_auditoria_hash(a public.auditoria)
returns text
language sql
immutable
as $$
    select encode(sha256(convert_to(jsonb_build_array(
        a.id, a.cadeia_pos, a.hash_anterior, a.usuario_id, a.acao, a.item_id,
        a.descricao, a.detalhes, extract(epoch from a.data)::text
    )::text, 'UTF8')), 'hex')
$$;

create or replace function public.fn_auditoria_encadear()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_pos  bigint;
    v_hash text;
begin
    -- Um registro de cada vez entra na corrente.
    perform pg_advisory_xact_lock(hashtext('auditoria_cadeia'));

    select cadeia_pos, hash into v_pos, v_hash
    from public.auditoria where cadeia_pos is not null
    order by cadeia_pos desc limit 1;

    new.data          := coalesce(new.data, now());
    new.cadeia_pos    := coalesce(v_pos, 0) + 1;
    new.hash_anterior := coalesce(v_hash, 'INICIO');
    new.hash          := public.fn_auditoria_hash(new);
    return new;
end;
$$;

-- Registros já existentes entram na corrente, na ordem em que foram criados.
do $$
declare
    r      public.auditoria;
    v_pos  bigint := 0;
    v_hash text := 'INICIO';
begin
    if exists (select 1 from public.auditoria where cadeia_pos is null) then
        if exists (select 1 from public.auditoria where cadeia_pos is not null) then
            select cadeia_pos, hash into v_pos, v_hash from public.auditoria
            where cadeia_pos is not null order by cadeia_pos desc limit 1;
        end if;
        for r in select * from public.auditoria where cadeia_pos is null order by data nulls first, id loop
            v_pos := v_pos + 1;
            r.data := coalesce(r.data, now());
            r.cadeia_pos := v_pos;
            r.hash_anterior := v_hash;
            v_hash := public.fn_auditoria_hash(r);
            update public.auditoria
            set data = r.data, cadeia_pos = v_pos, hash_anterior = r.hash_anterior, hash = v_hash
            where id = r.id;
        end loop;
    end if;
end $$;

create unique index if not exists ux_auditoria_cadeia on public.auditoria (cadeia_pos);

drop trigger if exists trg_auditoria_encadear on public.auditoria;
create trigger trg_auditoria_encadear
    before insert on public.auditoria
    for each row execute function public.fn_auditoria_encadear();


-- =====================================================================
-- PARTE 5 — REGISTROS QUE NÃO PODEM SER ALTERADOS
-- =====================================================================

create or replace function public.fn_bloquear_alteracao()
returns trigger
language plpgsql
as $$
begin
    raise exception 'Registros de % não podem ser alterados nem apagados.', tg_table_name
        using errcode = '42501';
end;
$$;

drop trigger if exists trg_auditoria_imutavel on public.auditoria;
create trigger trg_auditoria_imutavel
    before update or delete on public.auditoria
    for each row execute function public.fn_bloquear_alteracao();

drop trigger if exists trg_auditoria_sem_truncate on public.auditoria;
create trigger trg_auditoria_sem_truncate
    before truncate on public.auditoria
    for each statement execute function public.fn_bloquear_alteracao();

drop trigger if exists trg_movimentacoes_imutavel on public.movimentacoes;
create trigger trg_movimentacoes_imutavel
    before update or delete on public.movimentacoes
    for each row execute function public.fn_bloquear_alteracao();

drop trigger if exists trg_movimentacoes_sem_truncate on public.movimentacoes;
create trigger trg_movimentacoes_sem_truncate
    before truncate on public.movimentacoes
    for each statement execute function public.fn_bloquear_alteracao();

-- Termo assinado ou cancelado fica congelado.
create or replace function public.fn_termos_congelados()
returns trigger
language plpgsql
as $$
begin
    if old.status in ('ASSINADO', 'CANCELADO') then
        raise exception 'Termo % não pode ser alterado nem apagado.', lower(old.status)
            using errcode = '42501';
    end if;
    return coalesce(new, old);
end;
$$;

drop trigger if exists trg_termos_congelados on public.termos;
create trigger trg_termos_congelados
    before update or delete on public.termos
    for each row execute function public.fn_termos_congelados();


-- =====================================================================
-- PARTE 6 — VERIFICAÇÃO DE INTEGRIDADE (tela de Administração)
-- =====================================================================

-- Mesmo cálculo feito por assinar_termo (v6) no momento da assinatura.
create or replace function public.fn_termo_hash(t public.termos)
returns text
language sql
stable
as $$
    select encode(sha256(convert_to(
        t.conteudo_assinado || '|' || t.assinado_nome || '|' || t.assinado_cpf || '|' ||
        t.assinado_em::text || '|' || md5(t.assinatura_png), 'UTF8')), 'hex')
$$;

revoke execute on function public.fn_termo_hash(public.termos) from public, anon;

create or replace function public.verificar_integridade()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    r          public.auditoria;
    v_esperado bigint := 0;
    v_anterior text := 'INICIO';
    v_total    bigint := 0;
    v_problemas jsonb := '[]'::jsonb;
    v_termos   jsonb;
    v_suspeitos bigint[];
    v_fuso     text := current_setting('TimeZone');
begin
    perform public.fn_exigir_perfil(array['gestor', 'administrador']);

    for r in select * from public.auditoria order by cadeia_pos nulls first, id loop
        v_total := v_total + 1;
        v_esperado := v_esperado + 1;

        if r.cadeia_pos is null then
            v_problemas := v_problemas || jsonb_build_object('registro', r.id, 'problema', 'registro fora da corrente');
        else
            if r.cadeia_pos <> v_esperado then
                v_problemas := v_problemas || jsonb_build_object('registro', r.id,
                    'problema', format('faltam %s registro(s) antes deste (apagados)', r.cadeia_pos - v_esperado));
                v_esperado := r.cadeia_pos;
            end if;
            if r.hash_anterior is distinct from v_anterior then
                v_problemas := v_problemas || jsonb_build_object('registro', r.id, 'problema', 'ligação com o registro anterior quebrada');
            end if;
            if r.hash is distinct from public.fn_auditoria_hash(r) then
                v_problemas := v_problemas || jsonb_build_object('registro', r.id, 'problema', 'conteúdo alterado depois de gravado');
            end if;
            v_anterior := r.hash;
        end if;

        exit when jsonb_array_length(v_problemas) >= 20;
    end loop;

    -- Termos assinados: o texto, o nome, o CPF, a data e a assinatura ainda
    -- batem com o código gravado no momento da assinatura? (A data entra no
    -- código como texto, que depende do fuso: confere no fuso padrão do
    -- banco e em UTC.)
    perform set_config('TimeZone', (select reset_val from pg_settings where name = 'TimeZone'), true);
    select array_agg(id) into v_suspeitos
    from public.termos
    where status = 'ASSINADO' and hash_sha256 is not null
      and public.fn_termo_hash(termos) is distinct from hash_sha256;

    perform set_config('TimeZone', 'UTC', true);
    select coalesce(jsonb_agg(jsonb_build_object('termo', id, 'problema', 'termo assinado foi alterado') order by id), '[]'::jsonb)
    into v_termos
    from public.termos
    where id = any (coalesce(v_suspeitos, '{}'))
      and public.fn_termo_hash(termos) is distinct from hash_sha256;

    perform set_config('TimeZone', v_fuso, true);

    return jsonb_build_object(
        'ok',            jsonb_array_length(v_problemas) = 0 and jsonb_array_length(v_termos) = 0,
        'registros',     v_total,
        'ultimo_codigo', v_anterior,
        'problemas',     v_problemas || v_termos,
        'verificado_em', now());
end;
$$;

revoke execute on function public.verificar_integridade() from public, anon;
grant  execute on function public.verificar_integridade() to authenticated;

revoke execute on function public.fn_auditoria_hash(public.auditoria) from public, anon;


-- =====================================================================
-- CONFERÊNCIA FINAL
-- =====================================================================
select 'Migração v7 concluída' as resultado,
       (select count(*) from public.auditoria) as registros_na_auditoria;

-- FIM
