-- =====================================================================
-- INVENTÁRIO CENTRAL — GRUPO MONTE CARLO
-- MIGRAÇÃO v9 · MARCA E MODELO PADRÃO DOS RÁDIOS
--
-- Rode no Supabase (SQL Editor → New query → colar tudo → Run).
-- Pode ser rodada de novo sem estragar nada.
--
-- · Guarda a lista de modelos de rádio usados nos clubes
--   (o primeiro da lista é o padrão do cadastro).
-- · Preenche marca e modelo dos rádios já cadastrados que estão em branco.
-- Gestores podem mudar a lista depois, na tela Rádios → "Modelos de rádio".
-- =====================================================================

insert into public.configuracoes (chave, valor)
values ('radio_modelos', '[{"marca": "Kytera", "modelo": "BP516 U(I)"}]')
on conflict (chave) do nothing;

-- Rádios já cadastrados sem marca/modelo recebem o padrão.
-- (A auditoria exige um usuário: no SQL Editor não há ninguém logado,
--  então o registro fica em nome de quem administra o sistema.)
do $bloco$
declare
    v_usuario uuid;
    v_marca   text;
    v_modelo  text;
    v_total   int;
begin
    select (valor::jsonb -> 0) ->> 'marca', (valor::jsonb -> 0) ->> 'modelo'
    into v_marca, v_modelo
    from public.configuracoes where chave = 'radio_modelos';

    if not exists (select 1 from public.radios
                   where nullif(btrim(coalesce(marca, '')), '') is null
                      or nullif(btrim(coalesce(modelo, '')), '') is null) then
        raise notice 'Nenhum rádio sem marca/modelo.';
        return;
    end if;

    select id into v_usuario
    from public.usuarios
    where coalesce(ativo, true)
    order by (lower(email) = 'anderson.barbosa@montecarloeventos.com') desc,
             (lower(perfil) = 'administrador') desc,
             (lower(perfil) = 'gestor') desc
    limit 1;
    perform set_config('request.jwt.claims',
                       json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);

    update public.radios
    set marca  = coalesce(nullif(btrim(coalesce(marca, '')), ''), v_marca),
        modelo = coalesce(nullif(btrim(coalesce(modelo, '')), ''), v_modelo)
    where nullif(btrim(coalesce(marca, '')), '') is null
       or nullif(btrim(coalesce(modelo, '')), '') is null;

    get diagnostics v_total = row_count;
    raise notice '% rádio(s) preenchido(s) com % %.', v_total, v_marca, v_modelo;
end
$bloco$;

-- Conferência
select coalesce(marca, '(em branco)') as marca,
       coalesce(modelo, '(em branco)') as modelo,
       count(*) as radios
from public.radios
group by 1, 2
order by 3 desc;
