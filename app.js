/* =========================================================
   SISTEMA DE INVENTÁRIO CENTRAL — GRUPO MONTE CARLO
   APP_ESTOQUE_V3.JS
   ---------------------------------------------------------
   Substitui as funções de estoque do app.js para usar as
   operações atômicas da migration_inventario_v3.sql.

   COMO INSTALAR (sem mexer no app.js):
   No index.html, logo depois de <script src="app.js"></script>:

       <script src="app_estoque_v3.js"></script>

   As funções abaixo têm o mesmo nome das originais e passam
   a valer no lugar delas (inclusive nos onclick do HTML).
   Quando estiver tudo validado, o ideal é apagar as versões
   antigas do app.js e mover estas para lá.
========================================================= */


/* =========================================================
   AUXILIARES
========================================================= */

/*
   Antes: quantidade nula, zero ou inválida virava 1.
   Isso escondia lotes zerados e inflava totais.
*/
function quantidadeItem(item) {
    const quantidade = Number(item?.quantidade);
    return Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 0;
}

/*
   O Supabase devolve no máximo 1.000 linhas por consulta.
   Sem paginação, os itens acima disso somem da tela e dos totais.
*/
async function buscarTodasLinhas(montarConsulta, tamanhoPagina = 1000) {
    const linhas = [];
    for (let inicio = 0; ; inicio += tamanhoPagina) {
        const { data, error } = await montarConsulta()
            .range(inicio, inicio + tamanhoPagina - 1);
        if (error) throw error;
        linhas.push(...(data || []));
        if (!data || data.length < tamanhoPagina) return linhas;
    }
}

function mensagemErro(erro) {
    return erro?.message || erro?.error_description || 'Erro desconhecido.';
}

function definirTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.innerText = valor;
}

/*
   A auditoria agora é gravada pelo próprio banco (triggers),
   com o usuário tirado do token. O navegador não grava mais.
*/
async function registrarAuditoria() {
    return;
}


/* =========================================================
   PERFIL — usuário inativo sai do sistema de verdade
========================================================= */

async function verificarPerfil() {
    if (!usuarioLogado) {
        perfilUsuario = null;
        return;
    }

    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('perfil, nome, ativo')
        .eq('email', usuarioLogado.email)
        .maybeSingle();

    if (error) {
        console.error('ERRO PERFIL:', error);
        perfilUsuario = 'consulta';
        nomeUsuarioLogado = usuarioLogado.email || '';
        return;
    }

    if (!data || data.ativo === false) {
        await supabaseClient.auth.signOut();
        alert('Usuário inativo ou sem cadastro. Procure o administrador.');
        window.location.reload();
        return new Promise(() => {}); // interrompe o fluxo até o reload
    }

    nomeUsuarioLogado = String(data.nome || usuarioLogado.email || '').trim();
    perfilUsuario = String(data.perfil || 'consulta').trim().toLowerCase();
}


/* =========================================================
   CARREGAR ITENS (paginado, sem lotes zerados)
========================================================= */

async function carregarItens() {
    try {
        itens = await buscarTodasLinhas(() =>
            supabaseClient
                .from('itens')
                .select('*')
                .gt('quantidade', 0)
                .order('id', { ascending: false })
        );

        renderizarItens();
        carregarItensMovimentacao();
        filtrarItens();
    } catch (erro) {
        console.error('ERRO AO CARREGAR ITENS:', erro);
    }
}


/* =========================================================
   SELECT DE ITENS DA MOVIMENTAÇÃO
   Antes: "select.innerHTML +=" dentro do loop reconstruía o
   select inteiro a cada item (custo quadrático). Agora monta
   uma vez só, em ordem alfabética, sem itens baixados.
========================================================= */

function carregarItensMovimentacao() {
    const select = document.getElementById('itemMov');
    if (!select) return;

    const valorAtual = select.value;

    const opcoes = itens
        .filter(item => item.status !== 'Baixado' && quantidadeItem(item) > 0)
        .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR', { sensitivity: 'base' }))
        .map(item => {
            const texto = [
                item.patrimonio ? `${item.patrimonio} — ${item.nome}` : item.nome,
                formatarLocalSubsetor(item.local_id, item.subsetor_id),
                `${quantidadeItem(item)} un.`,
                item.status !== 'Ativo' ? item.status : ''
            ].filter(Boolean).join(' — ');

            return `<option value="${Number(item.id)}">${escaparHTML(texto)}</option>`;
        });

    select.innerHTML = '<option value="">Selecione o item</option>' + opcoes.join('');

    if (valorAtual && [...select.options].some(option => option.value === valorAtual)) {
        select.value = valorAtual;
    }
}


/* =========================================================
   DASHBOARD
   Antes: carregarItens() já desenhava o dashboard e depois
   carregarDashboard() desenhava tudo de novo.
========================================================= */

async function carregarDashboard() {
    try {
        await carregarItens();

        const { data: resumo, error } = await supabaseClient.rpc('resumo_dashboard');

        if (error) {
            console.warn('resumo_dashboard indisponível, calculando no navegador:', error.message);
            atualizarDashboardAvancado();
            definirTexto('totalItens', itens.reduce((t, i) => t + quantidadeItem(i), 0));
        } else {
            definirTexto('totalItens', resumo.total_itens);
            definirTexto('totalMov', resumo.movimentacoes);
            definirTexto('totalBaixados', resumo.baixados);
            definirTexto('dashAtivo', resumo.ativos);
            definirTexto('dashManutencao', resumo.manutencao);
            definirTexto('dashBaixado', resumo.baixados);
            definirTexto('dashExtraviado', resumo.extraviados);
        }

        definirTexto('totalLocais', LOCAIS.length);

        gerarRelatorioLocais();
        carregarFiltroLocaisDashboard();
        filtrarDashboard();
    } catch (erro) {
        console.error('ERRO AO CARREGAR DASHBOARD:', erro);
    }
}

/*
   Antes: a busca comparava o texto digitado com o ID do local,
   então pesquisar "CD1" ou "RH" não encontrava nada.
*/
function filtrarDashboard() {
    const busca = (document.getElementById('filtroDashboard')?.value || '').trim().toLowerCase();
    const filtroLocal = document.getElementById('filtroLocalDashboard')?.value || '';
    const filtroSubsetor = document.getElementById('filtroSubsetorDashboard')?.value || '';

    document.querySelectorAll('#dashboardLocais tr').forEach(linha => {
        if (linha.children.length < 4) return;

        const texto = linha.textContent.toLowerCase();
        const localId = linha.children[1]?.dataset?.localId || '';
        const subsetorId = linha.children[2]?.dataset?.subsetorId || '';

        const mostrar =
            (!busca || texto.includes(busca)) &&
            (!filtroLocal || localId === filtroLocal) &&
            (!filtroSubsetor || subsetorId === filtroSubsetor);

        linha.style.display = mostrar ? '' : 'none';
    });
}


/* =========================================================
   CADASTRO / ENTRADA
========================================================= */

async function salvarItem(event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!usuarioLogado) return alert('Faça login primeiro.'), false;
    if (perfilUsuario === 'consulta') return alert('Usuário sem permissão para cadastrar.'), false;

    const valor = id => document.getElementById(id)?.value?.trim() || '';

    const nome = valor('nome');
    const localId = valor('local');
    const subsetorId = valor('subsetorCadastro');
    const tipoControle = document.querySelector('input[name="tipoControle"]:checked')?.value || 'estoque';
    const patrimonio = tipoControle === 'patrimonio' ? valor('patrimonioManual') : '';
    const quantidade = tipoControle === 'patrimonio' ? 1 : parseInt(valor('quantidadeLote') || '0', 10);
    const arquivo = document.getElementById('foto')?.files?.[0];

    if (!nome) return alert('Informe o nome do item.'), false;
    if (!localId) return alert('Selecione o local.'), false;
    if (tipoControle === 'patrimonio' && !patrimonio) return alert('Informe o número do patrimônio.'), false;
    if (!(quantidade >= 1)) return alert('A quantidade deve ser maior que zero.'), false;

    const botao = document.getElementById('btnSalvarItem');
    if (botao) botao.disabled = true;

    let caminhoFoto = null;

    try {
        let fotoUrl = null;

        if (arquivo) {
            const extensao = (arquivo.name.split('.').pop() || 'jpg').toLowerCase();
            caminhoFoto = `inventario/${crypto.randomUUID()}.${extensao}`;

            const { error } = await supabaseClient.storage
                .from('inventario')
                .upload(caminhoFoto, arquivo, { upsert: false, contentType: arquivo.type });

            if (error) throw new Error('Erro ao enviar a foto: ' + error.message);

            fotoUrl = supabaseClient.storage.from('inventario').getPublicUrl(caminhoFoto).data.publicUrl;
        }

        const { error } = await supabaseClient.rpc('registrar_entrada', {
            p_nome: nome,
            p_local_id: Number(localId),
            p_quantidade: quantidade,
            p_subsetor_id: subsetorId ? Number(subsetorId) : null,
            p_tipo: valor('tipoItem') || null,
            p_descricao: valor('descricao') || null,
            p_status: valor('status') || 'Ativo',
            p_patrimonio: patrimonio || null,
            p_foto_url: fotoUrl
        });

        if (error) throw error;

        alert(patrimonio
            ? `Patrimônio ${patrimonio} cadastrado com sucesso!`
            : `Entrada de ${quantidade} unidade(s) de "${nome}" registrada com sucesso!`);

        limparFormularioCadastro();
        await carregarDashboard();
    } catch (erro) {
        console.error('ERRO AO SALVAR ITEM:', erro);

        // Não deixa foto órfã no Storage quando o cadastro falha.
        if (caminhoFoto) {
            await supabaseClient.storage.from('inventario').remove([caminhoFoto]);
        }

        alert('Erro ao salvar o item.\n\n' + mensagemErro(erro));
    } finally {
        if (botao) botao.disabled = false;
    }

    return false;
}


/* =========================================================
   MOVIMENTAÇÃO — uma única chamada atômica ao banco
========================================================= */

async function movimentarItem(event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!usuarioLogado) return alert('Faça login primeiro.'), false;
    if (perfilUsuario === 'consulta') return alert('Usuário sem permissão para movimentar itens.'), false;

    const valor = id => document.getElementById(id)?.value?.trim() || '';

    const itemId = valor('itemMov');
    const destinoId = valor('destino');
    const destinoSubsetorId = valor('destinoSubsetor');
    const quantidade = parseInt(valor('quantidadeMov') || '0', 10);

    if (!itemId) return alert('Selecione o item.'), false;
    if (!destinoId) return alert('Selecione o destino.'), false;
    if (!(quantidade >= 1)) return alert('A quantidade deve ser maior que zero.'), false;

    const botao = document.querySelector('#movimentacaoTela .btn-primary');
    if (botao) botao.disabled = true;

    try {
        // Saldo, travas e validações são feitos no banco.
        const { data, error } = await supabaseClient.rpc('movimentar_item', {
            p_item_id: Number(itemId),
            p_destino_id: Number(destinoId),
            p_quantidade: quantidade,
            p_destino_subsetor_id: destinoSubsetorId ? Number(destinoSubsetorId) : null,
            p_status: valor('statusMov') || null,
            p_observacao: valor('observacaoMov') || null
        });

        if (error) throw error;

        alert(
            'Movimentação realizada com sucesso!' +
            (data?.saldo_origem > 0 ? `\n\nSaldo restante na origem: ${data.saldo_origem} unidade(s).` : '')
        );

        limparFormularioMovimentacao();
        await carregarDashboard();
        await carregarHistorico();
    } catch (erro) {
        console.error('ERRO AO MOVIMENTAR:', erro);
        alert('Erro ao movimentar o item.\n\n' + mensagemErro(erro));

        // O saldo pode ter mudado por outro usuário: recarrega.
        await carregarItens();
    } finally {
        if (botao) botao.disabled = false;
    }

    return false;
}


/* =========================================================
   EXCLUSÃO — somente gestor/administrador (validado no banco)
========================================================= */

async function excluirItem(id) {
    if (!usuarioLogado) return alert('Faça login primeiro.');
    if (!podeAdministrar()) return alert('Somente Gestor ou Administrador pode excluir itens.');

    const item = itens.find(registro => Number(registro.id) === Number(id));
    if (!item) return alert('Item não encontrado.');

    if (!confirm(`Deseja realmente excluir este item?\n\n${item.patrimonio || ''} ${item.nome || 'Item'}`)) return;

    try {
        const { error } = await supabaseClient.rpc('excluir_item', { p_item_id: Number(item.id) });
        if (error) throw error;

        alert('Item excluído com sucesso!');
        await carregarDashboard();
    } catch (erro) {
        console.error('ERRO AO EXCLUIR ITEM:', erro);
        alert('Erro ao excluir o item.\n\n' + mensagemErro(erro));
    }
}


/* =========================================================
   HISTÓRICO
   Antes: o cabeçalho tinha 8 colunas e cada linha só 6
   (faltavam Item e Quantidade), deslocando tudo.
========================================================= */

const ROTULOS_MOVIMENTO = {
    ENTRADA: 'Entrada',
    TRANSFERENCIA: 'Transferência',
    STATUS: 'Mudança de status'
};

async function carregarHistorico() {
    const tabela = document.getElementById('historico');

    try {
        const { data, error } = await supabaseClient
            .from('movimentacoes')
            .select('*, usuarios:usuario_id(nome,email)')
            .order('data', { ascending: false })
            .limit(500);

        if (error) throw error;

        movimentacoes = data || [];
        if (!tabela) return;

        if (!movimentacoes.length) {
            tabela.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma movimentação registrada.</td></tr>';
            return;
        }

        tabela.innerHTML = movimentacoes.map(mov => {
            const item = itens.find(registro => Number(registro.id) === Number(mov.item_id));
            const nomeItem = mov.item_nome || item?.nome || '—';
            const origem = mov.origem_id ? formatarLocalSubsetor(mov.origem_id, mov.origem_subsetor_id) : '—';
            const destino = formatarLocalSubsetor(mov.destino_id, mov.destino_subsetor_id);
            const mudouStatus = mov.status_anterior && mov.status_novo && mov.status_anterior !== mov.status_novo;
            const observacao = [
                ROTULOS_MOVIMENTO[mov.tipo_movimento] || '',
                mudouStatus ? `${mov.status_anterior} → ${mov.status_novo}` : '',
                mov.observacao || ''
            ].filter(Boolean).join(' · ') || '—';

            return `
                <tr>
                    <td>${escaparHTML(item?.patrimonio || 'Estoque')}</td>
                    <td><strong>${escaparHTML(nomeItem)}</strong></td>
                    <td>${escaparHTML(origem)}</td>
                    <td>${escaparHTML(destino)}</td>
                    <td>${Number(mov.quantidade) || 0}</td>
                    <td>${escaparHTML(observacao)}</td>
                    <td>${escaparHTML(mov.usuarios?.nome || mov.usuarios?.email || '—')}</td>
                    <td>${escaparHTML(mov.data ? new Date(mov.data).toLocaleString('pt-BR') : '—')}</td>
                </tr>`;
        }).join('');
    } catch (erro) {
        console.error('ERRO AO CARREGAR HISTÓRICO:', erro);
    }
}


/* =========================================================
   EXPORTAÇÃO — agora com subsetor e só o que está filtrado
========================================================= */

function exportarExcel() {
    const visiveis = new Set(
        [...document.querySelectorAll('#listaItens tr')]
            .filter(linha => linha.style.display !== 'none')
            .map(linha => linha.dataset.itemId)
    );

    const lista = itens.filter(item => visiveis.size === 0 || visiveis.has(String(item.id)));

    if (!lista.length) return alert('Nenhum item para exportar.');

    const colunas = ['PATRIMÔNIO', 'TIPO', 'NOME', 'DESCRIÇÃO', 'QUANTIDADE', 'LOCAL', 'SUBSETOR', 'STATUS'];
    const linhas = lista.map(item => [
        item.patrimonio || 'Estoque',
        item.tipo || item.nome || '',
        item.nome || '',
        item.descricao || '',
        quantidadeItem(item),
        nomeLocal(item.local_id),
        item.subsetor_id ? nomeSubsetor(item.subsetor_id) : '',
        item.status || ''
    ].map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(';'));

    const csv = '﻿' + [colunas.join(';'), ...linhas].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = Object.assign(document.createElement('a'), {
        href: url,
        download: `inventario-monte-carlo-${new Date().toISOString().slice(0, 10)}.csv`
    });
    link.click();
    URL.revokeObjectURL(url);
}

/* Marca cada linha do estoque com o id do item (usado na exportação filtrada). */
(function () {
    const renderizarOriginal = renderizarItens;
    renderizarItens = function () {
        renderizarOriginal();
        const linhas = document.querySelectorAll('#listaItens tr');
        itens.forEach((item, indice) => {
            if (linhas[indice]) linhas[indice].dataset.itemId = String(item.id);
        });
    };
})();
