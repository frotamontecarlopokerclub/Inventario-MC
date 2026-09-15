# Inventário Central — atualização V2

Esta atualização foi feita sobre os arquivos enviados, sem remover as funcionalidades existentes.

## 1. Banco de dados

No Supabase, abra **SQL Editor** e execute:

`supabase/migration_inventario_v2.sql`

Ele acrescenta:
- subsetores vinculados aos locais;
- `subsetor_id` em itens;
- usuário e subsetores de origem/destino nas movimentações;
- tabela de auditoria;
- nome/status dos usuários;
- políticas RLS para usuários, subsetores e auditoria.

## 2. Edge Function para criação de usuários

A criação de usuários pelo painel administrativo usa uma Edge Function porque a chave Service Role nunca deve ficar no JavaScript do navegador.

Estrutura:

`supabase/functions/criar-usuario/index.ts`

Com Supabase CLI:

```bash
supabase functions deploy criar-usuario
```

As variáveis padrão `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` devem estar disponíveis na função. Não coloque a Service Role Key no `app.js`.

## 3. Arquivos web

Substitua no projeto somente:
- `index.html`
- `style.css`
- `app.js`

## 4. Novo funcionamento

### Administração
Gestor/Administrador pode:
- criar usuário;
- definir Consulta, Operacional, Gestor ou Administrador;
- ativar/inativar usuários;
- criar subsetores por local;
- editar/inativar subsetores;
- consultar a auditoria.

### Subsetores
O cadastro e a movimentação passam a trabalhar com:

`Local → Subsetor → Item`

O subsetor é opcional para locais que ainda não possuem subdivisão.

### Auditoria
São registradas ações de:
- CADASTRO;
- EDICAO;
- EXCLUSAO;
- MOVIMENTACAO;
- criação/edição/inativação de subsetores;
- criação e alteração de status de usuários.

Cada registro guarda o usuário autenticado, data/hora e detalhes da operação.

## Observação sobre dados antigos
Os itens e movimentações existentes não são apagados. Itens antigos ficam com `subsetor_id = null` até que uma operação futura os coloque em um subsetor.

O local ID 11 continua sendo `PREDIO CARDOSO`, conforme a composição definida anteriormente.
