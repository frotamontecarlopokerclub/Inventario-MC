/* =========================================================
   SISTEMA DE INVENTÁRIO CENTRAL
   GRUPO MONTE CARLO
   APP.JS
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    'https://sxmimxomehdhyifqsgqa.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_NbyYYTsRnSqu_TMpQvzS6A_rJuyzq9_';


/* =========================================================
   CLIENTE SUPABASE
========================================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   VARIÁVEIS GLOBAIS
========================================================= */

let itens = [];
let movimentacoes = [];

let usuarioLogado = null;
let perfilUsuario = null;


/* =========================================================
   LOCAIS
========================================================= */

const LOCAIS = [

    { id: 1, nome: 'CASA 1 CHEFIA' },
    { id: 2, nome: 'CASA 2 CHEFIA' },
    { id: 3, nome: 'CASA 3 CHEFIA' },

    { id: 4, nome: 'CASA 1 DOS FUNCIONARIOS' },
    { id: 5, nome: 'CASA 2 DOS FUNCIONARIOS' },
    { id: 6, nome: 'CASA 3 DOS FUNCIONARIOS' },
    { id: 7, nome: 'CASA 4 DOS FUNCIONARIOS' },

    { id: 8, nome: 'CONSERTO' },

    { id: 9, nome: 'CD1' },
    { id: 10, nome: 'CD2' },
    { id: 11, nome: 'CD3' },

    { id: 12, nome: 'DORYO' },

    { id: 13, nome: 'ESCRITÓRIO 1' },
    { id: 14, nome: 'ESCRITÓRIO 2' },
    { id: 15, nome: 'ESCRITÓRIO 3' },

    { id: 16, nome: 'ESTACIONAMENTO 1' },
    { id: 17, nome: 'ESTACIONAMENTO 2' },
    { id: 18, nome: 'ESTACIONAMENTO 3' },

    { id: 19, nome: 'M.C.' },
    { id: 20, nome: 'M.G.' },

    { id: 21, nome: 'DESCARTE/BAIXA TOTAL' }

];


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return '';
    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function quantidadeItem(item) {

    const quantidade =
        Number(item?.quantidade);

    if (
        Number.isFinite(quantidade) &&
        quantidade > 0
    ) {
        return quantidade;
    }

    return 1;

}


function nomeLocal(localId) {

    const local =
        LOCAIS.find(
            item =>
                String(item.id) ===
                String(localId)
        );

    return local?.nome || 'SEM LOCAL';

}


function classeStatus(status) {

    const mapa = {

        'Ativo': 'ativo',

        'Em manutenção':
            'manutencao',

        'Baixado':
            'baixado',

        'Extraviado':
            'extraviado'

    };

    return mapa[status] || '';

}


/* =========================================================
   LOGIN
========================================================= */

async function login(event) {

    if (event) {

        event.preventDefault();
        event.stopPropagation();

    }


    const email =
        document
            .getElementById('email')
            ?.value
            ?.trim() || '';


    const password =
        document
            .getElementById('password')
            ?.value || '';


    const botao =
        document.getElementById('btnLogin');


    const textoOriginal =
        botao?.innerHTML;


    if (!email || !password) {

        alert(
            'Informe o e-mail e a senha.'
        );

        return false;

    }


    try {

        if (botao) {

            botao.disabled = true;

            botao.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';

        }


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email,
                    password

                });


        if (error) {

            console.error(
                'ERRO LOGIN:',
                error
            );

            alert(
                'Não foi possível entrar.\n\n' +
                error.message
            );

            return false;

        }


        usuarioLogado =
            data.user;


        await verificarPerfil();


        document.body
            .classList
            .remove('login-mode');


        atualizarMenus();

        atualizarUsuarioInterface();


        abrirTela(
            'dashboardTela',
            document.getElementById(
                'menuDashboard'
            )
        );


        await carregarDashboard();


        return false;


    } catch (erro) {

        console.error(
            'ERRO AO REALIZAR LOGIN:',
            erro
        );

        alert(
            'Erro inesperado ao realizar login.'
        );

        return false;


    } finally {

        if (botao) {

            botao.disabled = false;

            botao.innerHTML =
                textoOriginal ||
                '<i class="fa-solid fa-right-to-bracket"></i> Entrar no Sistema';

        }

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        await supabaseClient
            .auth
            .signOut();

    } catch (erro) {

        console.error(
            'ERRO LOGOUT:',
            erro
        );

    }


    usuarioLogado = null;

    perfilUsuario = null;


    document.body
        .classList
        .add('login-mode');


    atualizarMenus();

    atualizarUsuarioInterface();


    abrirTela(
        'loginTela'
    );

}


/* =========================================================
   VERIFICAR PERFIL
========================================================= */

async function verificarPerfil() {

    if (!usuarioLogado) {

        perfilUsuario = null;

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from('usuarios')
                .select('perfil')
                .eq(
                    'email',
                    usuarioLogado.email
                )
                .maybeSingle();


        if (error) {

            console.error(
                'ERRO PERFIL:',
                error
            );

            perfilUsuario =
                'consulta';

            return;

        }


        perfilUsuario =
            String(
                data?.perfil ||
                'consulta'
            )
            .trim()
            .toLowerCase();


    } catch (erro) {

        console.error(
            'ERRO PERFIL:',
            erro
        );

        perfilUsuario =
            'consulta';

    }

}


/* =========================================================
   ATUALIZAR MENUS
========================================================= */

function atualizarMenus() {

    const loginMenu =
        document.getElementById(
            'menuLogin'
        );


    const dashboardMenu =
        document.getElementById(
            'menuDashboard'
        );


    const cadastroMenu =
        document.getElementById(
            'menuCadastro'
        );


    const movimentacaoMenu =
        document.getElementById(
            'menuMovimentacao'
        );


    const estoqueMenu =
        document.getElementById(
            'menuEstoque'
        );


    const historicoMenu =
        document.getElementById(
            'menuHistorico'
        );


    const logoutMenu =
        document.getElementById(
            'menuLogout'
        );


    /*
       IMPORTANTE:
       Alguns desses elementos podem não existir
       no HTML. Por isso usamos verificações.
    */


    if (!usuarioLogado) {

        if (loginMenu) {

            loginMenu.style.display =
                'flex';

        }


        if (dashboardMenu) {

            dashboardMenu.style.display =
                'none';

        }


        if (cadastroMenu) {

            cadastroMenu.style.display =
                'none';

        }


        if (movimentacaoMenu) {

            movimentacaoMenu.style.display =
                'none';

        }


        if (estoqueMenu) {

            estoqueMenu.style.display =
                'none';

        }


        if (historicoMenu) {

            historicoMenu.style.display =
                'none';

        }


        if (logoutMenu) {

            logoutMenu.style.display =
                'none';

        }


        return;

    }


    if (loginMenu) {

        loginMenu.style.display =
            'none';

    }


    if (dashboardMenu) {

        dashboardMenu.style.display =
            'flex';

    }


    if (estoqueMenu) {

        estoqueMenu.style.display =
            'flex';

    }


    if (historicoMenu) {

        historicoMenu.style.display =
            'flex';

    }


    if (logoutMenu) {

        logoutMenu.style.display =
            'flex';

    }


    if (
        perfilUsuario ===
        'consulta'
    ) {

        if (cadastroMenu) {

            cadastroMenu.style.display =
                'none';

        }


        if (movimentacaoMenu) {

            movimentacaoMenu.style.display =
                'none';

        }

    } else {

        if (cadastroMenu) {

            cadastroMenu.style.display =
                'flex';

        }


        if (movimentacaoMenu) {

            movimentacaoMenu.style.display =
                'flex';

        }

    }

}


/* =========================================================
   USUÁRIO NA INTERFACE
========================================================= */

function atualizarUsuarioInterface() {

    const nome =
        usuarioLogado?.email ||
        'Visitante';


    const perfil =
        perfilUsuario ||
        'Acesso restrito';


    const campos = [

        [
            'usuarioNomeSidebar',
            nome
        ],

        [
            'usuarioPerfilSidebar',
            perfil
        ],

        [
            'headerUsuarioNome',
            nome
        ],

        [
            'headerUsuarioPerfil',
            perfil
        ]

    ];


    campos.forEach(
        ([id, valor]) => {

            const elemento =
                document.getElementById(
                    id
                );


            if (elemento) {

                elemento.innerText =
                    valor;

            }

        }
    );


    const sidebarUsuario =
        document.getElementById(
            'usuarioSidebar'
        );


    if (sidebarUsuario) {

        sidebarUsuario.style.display =
            usuarioLogado
                ? 'flex'
                : 'none';

    }


    const headerUsuario =
        document.getElementById(
            'headerUsuario'
        );


    if (headerUsuario) {

        headerUsuario.style.display =
            usuarioLogado
                ? 'flex'
                : 'none';

    }

}


/* =========================================================
   CARREGAR LOCAIS NOS SELECTS
========================================================= */

function carregarLocais() {

    const localSelect =
        document.getElementById(
            'local'
        );


    const destinoSelect =
        document.getElementById(
            'destino'
        );


    if (localSelect) {

        localSelect.innerHTML =
            '<option value="">Selecione o Local</option>';


        LOCAIS.forEach(
            local => {

                localSelect.innerHTML += `
                    <option value="${local.id}">
                        ${escaparHTML(local.nome)}
                    </option>
                `;

            }
        );

    }


    if (destinoSelect) {

        destinoSelect.innerHTML =
            '<option value="">Selecione o Destino</option>';


        LOCAIS.forEach(
            local => {

                destinoSelect.innerHTML += `
                    <option value="${local.id}">
                        ${escaparHTML(local.nome)}
                    </option>
                `;

            }
        );

    }


    const totalLocais =
        document.getElementById(
            'totalLocais'
        );


    if (totalLocais) {

        totalLocais.innerText =
            LOCAIS.length;

    }

}


/* =========================================================
   TIPO DE CONTROLE
========================================================= */

function alternarTipoControle() {

    const tipo =
        document.querySelector(
            'input[name="tipoControle"]:checked'
        )?.value ||
        'estoque';


    const quantidadeGroup =
        document.getElementById(
            'quantidadeCadastroGroup'
        );


    const patrimonioGroup =
        document.getElementById(
            'patrimonioCadastroGroup'
        );


    if (
        tipo ===
        'patrimonio'
    ) {

        if (quantidadeGroup) {

            quantidadeGroup.style.display =
                'none';

        }


        if (patrimonioGroup) {

            patrimonioGroup.style.display =
                'block';

        }

    } else {

        if (quantidadeGroup) {

            quantidadeGroup.style.display =
                'block';

        }


        if (patrimonioGroup) {

            patrimonioGroup.style.display =
                'none';

        }

    }

}


/* =========================================================
   SALVAR CADASTRO
========================================================= */

async function salvarItem(event) {

    if (event) {

        event.preventDefault();
        event.stopPropagation();

    }


    if (!usuarioLogado) {

        alert(
            'Faça login primeiro.'
        );

        return false;

    }


    if (
        perfilUsuario ===
        'consulta'
    ) {

        alert(
            'Usuário sem permissão para cadastrar.'
        );

        return false;

    }


    const nome =
        document.getElementById(
            'nome'
        )?.value
        ?.trim() || '';


    const tipo =
        document.getElementById(
            'tipoItem'
        )?.value
        ?.trim() ||
        nome;


    const descricao =
        document.getElementById(
            'descricao'
        )?.value
        ?.trim() || '';


    const localId =
        document.getElementById(
            'local'
        )?.value || '';


    const status =
        document.getElementById(
            'status'
        )?.value ||
        'Ativo';


    const quantidadeInput =
        document.getElementById(
            'quantidadeLote'
        )?.value;


    const quantidade =
        Math.max(
            1,
            parseInt(
                quantidadeInput ||
                '1',
                10
            )
        );


    const tipoControle =
        document.querySelector(
            'input[name="tipoControle"]:checked'
        )?.value ||
        'estoque';


    const patrimonio =
        document.getElementById(
            'patrimonioManual'
        )?.value
        ?.trim() || '';


    const arquivo =
        document.getElementById(
            'foto'
        )?.files?.[0];


    if (!nome) {

        alert(
            'Informe o nome do item.'
        );

        return false;

    }


    if (!localId) {

        alert(
            'Selecione o local.'
        );

        return false;

    }


    if (
        tipoControle ===
        'patrimonio' &&
        !patrimonio
    ) {

        alert(
            'Informe o número do patrimônio.'
        );

        return false;

    }


    try {

        let fotoUrl =
            '';


        /* =================================================
           UPLOAD DA FOTO
        ================================================= */

        if (arquivo) {

            const extensao =
                (
                    arquivo.name
                        .split('.')
                        .pop() ||
                    'jpg'
                )
                .toLowerCase();


            const identificador =
                (
                    window.crypto &&
                    crypto.randomUUID
                )
                    ? crypto.randomUUID()
                    : Date.now();


            const caminho =
                `inventario/${identificador}.${extensao}`;


            const {
                error
            } =
                await supabaseClient
                    .storage
                    .from('inventario')
                    .upload(
                        caminho,
                        arquivo,
                        {
                            upsert: true
                        }
                    );


            if (error) {

                throw new Error(
                    'Erro ao enviar a foto: ' +
                    error.message
                );

            }


            const resultado =
                supabaseClient
                    .storage
                    .from('inventario')
                    .getPublicUrl(
                        caminho
                    );


            fotoUrl =
                resultado?.data?.publicUrl ||
                '';

        }


        /* =================================================
           ESTOQUE
        ================================================= */

        if (
            tipoControle ===
            'estoque'
        ) {

            /*
               Procuramos primeiro se já existe
               um estoque do mesmo item no mesmo local.
            */

            const {
                data:
                    existente,
                error:
                    erroBusca
            } =
                await supabaseClient
                    .from('itens')
                    .select('*')
                    .eq(
                        'nome',
                        nome
                    )
                    .eq(
                        'local_id',
                        Number(localId)
                    )
                    .is(
                        'patrimonio',
                        null
                    )
                    .maybeSingle();


            if (erroBusca) {

                throw erroBusca;

            }


            if (existente) {

                const quantidadeExistente =
                    quantidadeItem(
                        existente
                    );


                const dadosAtualizacao = {

                    quantidade:
                        quantidadeExistente +
                        quantidade,

                    tipo:
                        tipo,

                    descricao:
                        descricao,

                    status:
                        status

                };


                if (fotoUrl) {

                    dadosAtualizacao.foto_url =
                        fotoUrl;

                }


                const {
                    error:
                        erroAtualizacao
                } =
                    await supabaseClient
                        .from('itens')
                        .update(
                            dadosAtualizacao
                        )
                        .eq(
                            'id',
                            existente.id
                        );


                if (erroAtualizacao) {

                    throw erroAtualizacao;

                }

            } else {

                const {
                    error:
                        erroInsercao
                } =
                    await supabaseClient
                        .from('itens')
                        .insert([{

                            patrimonio:
                                null,

                            nome:
                                nome,

                            tipo:
                                tipo,

                            descricao:
                                descricao,

                            local_id:
                                Number(localId),

                            quantidade:
                                quantidade,

                            status:
                                status,

                            foto_url:
                                fotoUrl ||
                                null

                        }]);


                if (erroInsercao) {

                    throw erroInsercao;

                }

            }

        }


        /* =================================================
           PATRIMÔNIO INDIVIDUAL
        ================================================= */

        else {

            const {
                error:
                    erroPatrimonio
            } =
                await supabaseClient
                    .from('itens')
                    .insert([{

                        patrimonio:
                            patrimonio,

                        nome:
                            nome,

                        tipo:
                            tipo,

                        descricao:
                            descricao,

                        local_id:
                            Number(localId),

                        quantidade:
                            1,

                        status:
                            status,

                        foto_url:
                            fotoUrl ||
                            null

                    }]);


            if (erroPatrimonio) {

                throw erroPatrimonio;

            }

        }


        alert(
            'Patrimônio cadastrado com sucesso!'
        );


        limparFormularioCadastro();


        await carregarDashboard();


        return false;


    } catch (erro) {

        console.error(
            'ERRO AO SALVAR ITEM:',
            erro
        );


        alert(
            'Erro ao salvar o item.\n\n' +
            (
                erro?.message ||
                'Erro desconhecido.'
            )
        );


        return false;

    }

}


/* =========================================================
   LIMPAR FORMULÁRIO DE CADASTRO
========================================================= */

function limparFormularioCadastro() {

    const ids = [

        'nome',
        'tipoItem',
        'descricao',
        'quantidadeLote',
        'patrimonioManual'

    ];


    ids.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            if (elemento) {

                elemento.value =
                    id ===
                    'quantidadeLote'
                        ? 1
                        : '';

            }

        }
    );


    const local =
        document.getElementById(
            'local'
        );


    if (local) {

        local.value =
            '';

    }


    const status =
        document.getElementById(
            'status'
        );


    if (status) {

        status.value =
            'Ativo';

    }


    const foto =
        document.getElementById(
            'foto'
        );


    if (foto) {

        foto.value =
            '';

    }


    const estoque =
        document.querySelector(
            'input[name="tipoControle"][value="estoque"]'
        );


    if (estoque) {

        estoque.checked =
            true;

    }


    alternarTipoControle();

}


/* =========================================================
   CARREGAR ITENS
========================================================= */

async function carregarItens() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from('itens')
                .select('*')
                .order(
                    'id',
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            throw error;

        }


        itens =
            Array.isArray(data)
                ? data
                : [];


        renderizarItens();

        carregarItensMovimentacao();

        atualizarDashboardAvancado();

        gerarRelatorioLocais();


    } catch (erro) {

        console.error(
            'ERRO AO CARREGAR ITENS:',
            erro
        );

    }

}


/* =========================================================
   RENDERIZAR ESTOQUE
========================================================= */

function renderizarItens() {

    const tbody =
        document.getElementById(
            'listaItens'
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML =
        '';


    if (
        itens.length ===
        0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-state"
                >

                    Nenhum patrimônio
                    cadastrado.

                </td>

            </tr>

        `;

        return;

    }


    itens.forEach(
        item => {

            const tr =
                document.createElement(
                    'tr'
                );


            const foto =
                item.foto_url
                    ? `
                        <img
                            src="${escaparHTML(item.foto_url)}"
                            alt="Foto"
                            class="foto-tabela"
                            onclick="abrirModalFoto('${escaparHTML(item.foto_url)}')"
                        >
                    `
                    : `
                        <div class="sem-foto">
                            <i class="fa-solid fa-image"></i>
                        </div>
                    `;


            const patrimonio =
                item.patrimonio ||
                'Estoque';


            const tipo =
                item.tipo ||
                item.nome ||
                '-';


            const nome =
                item.nome ||
                '-';


            const descricao =
                item.descricao ||
                '-';


            const local =
                nomeLocal(
                    item.local_id
                );


            const status =
                item.status ||
                'Ativo';


            const quantidade =
                quantidadeItem(
                    item
                );


            tr.innerHTML = `

                <td>
                    ${foto}
                </td>

                <td>
                    ${escaparHTML(
                        patrimonio
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        tipo
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        nome
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        descricao
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        local
                    )}

                    <small>
                        ${quantidade}
                        unidade(s)
                    </small>

                </td>

                <td>

                    <span
                        class="status-badge ${classeStatus(status)}"
                    >

                        ${escaparHTML(
                            status
                        )}

                    </span>

                </td>

                <td>

                    <div class="acoes-tabela">

                        <button
                            class="btn-icon btn-editar"
                            title="Editar"
                            onclick="editarItem(${Number(item.id)})"
                        >

                            <i class="fa-solid fa-pen"></i>

                        </button>

                        <button
                            class="btn-icon btn-excluir"
                            title="Excluir"
                            onclick="excluirItem(${Number(item.id)})"
                        >

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            tbody.appendChild(
                tr
            );

        }
    );

}


/* =========================================================
   FILTRAR ITENS
========================================================= */

function filtrarItens() {

    const busca =
        document
            .getElementById(
                'busca'
            )
            ?.value
            ?.trim()
            .toLowerCase() ||
        '';


    const linhas =
        document.querySelectorAll(
            '#listaItens tr'
        );


    linhas.forEach(
        linha => {

            const texto =
                linha.innerText
                    .toLowerCase();


            linha.style.display =
                texto.includes(
                    busca
                )
                    ? ''
                    : 'none';

        }
    );

}


/* =========================================================
   EDITAR ITEM
========================================================= */

async function editarItem(id) {

    if (!usuarioLogado) {

        alert(
            'Faça login primeiro.'
        );

        return;

    }


    if (
        perfilUsuario ===
        'consulta'
    ) {

        alert(
            'Usuário sem permissão para editar.'
        );

        return;

    }


    const item =
        itens.find(
            registro =>
                Number(
                    registro.id
                ) ===
                Number(id)
        );


    if (!item) {

        alert(
            'Item não encontrado.'
        );

        return;

    }


    const novoNome =
        prompt(
            'Nome do item:',
            item.nome ||
            ''
        );


    if (
        novoNome ===
        null
    ) {

        return;

    }


    const nome =
        novoNome
            .trim();


    if (!nome) {

        alert(
            'O nome não pode ficar vazio.'
        );

        return;

    }


    const novaDescricao =
        prompt(
            'Descrição:',
            item.descricao ||
            ''
        );


    if (
        novaDescricao ===
        null
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from('itens')
                .update({

                    nome:
                        nome,

                    descricao:
                        novaDescricao
                            .trim()

                })
                .eq(
                    'id',
                    item.id
                );


        if (error) {

            throw error;

        }


        alert(
            'Item atualizado com sucesso!'
        );


        await carregarItens();


        await carregarDashboard();


    } catch (erro) {

        console.error(
            'ERRO AO EDITAR ITEM:',
            erro
        );


        alert(
            'Erro ao editar o item.\n\n' +
            (
                erro?.message ||
                'Erro desconhecido.'
            )
        );

    }

}


/* =========================================================
   EXCLUIR ITEM
========================================================= */

async function excluirItem(id) {

    if (!usuarioLogado) {

        alert(
            'Faça login primeiro.'
        );

        return;

    }


    if (
        perfilUsuario ===
        'consulta'
    ) {

        alert(
            'Usuário sem permissão para excluir.'
        );

        return;

    }


    const item =
        itens.find(
            registro =>
                Number(
                    registro.id
                ) ===
                Number(id)
        );


    if (!item) {

        alert(
            'Item não encontrado.'
        );

        return;

    }


    const confirmacao =
        confirm(
            'Deseja realmente excluir este item?\n\n' +
            (
                item.nome ||
                'Item'
            )
        );


    if (!confirmacao) {

        return;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from('itens')
                .delete()
                .eq(
                    'id',
                    item.id
                );


        if (error) {

            throw error;

        }


        alert(
            'Item excluído com sucesso!'
        );


        await carregarItens();


        await carregarDashboard();


    } catch (erro) {

        console.error(
            'ERRO AO EXCLUIR ITEM:',
            erro
        );


        alert(
            'Erro ao excluir o item.\n\n' +
            (
                erro?.message ||
                'Erro desconhecido.'
            )
        );

    }

}


/* =========================================================
   CARREGAR ITENS PARA MOVIMENTAÇÃO
========================================================= */

function carregarItensMovimentacao() {

    const select =
        document.getElementById(
            'itemMov'
        );


    if (!select) {

        return;

    }


    const valorAtual =
        select.value;


    select.innerHTML =
        '<option value="">Selecione o Patrimônio</option>';


    itens
        .filter(
            item =>
                item.status !==
                'Baixado'
        )
        .forEach(
            item => {

                const quantidade =
                    quantidadeItem(
                        item
                    );


                const texto =
                    (
                        item.patrimonio ||
                        item.nome ||
                        'Item'
                    ) +
                    ' — ' +
                    nomeLocal(
                        item.local_id
                    ) +
                    ' — ' +
                    quantidade +
                    ' un.';


                select.innerHTML += `

                    <option
                        value="${Number(item.id)}"
                    >

                        ${escaparHTML(
                            texto
                        )}

                    </option>

                `;

            }
        );


    if (
        valorAtual &&
        itens.some(
            item =>
                String(item.id) ===
                String(valorAtual)
        )
    ) {

        select.value =
            valorAtual;

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function carregarDashboard() {

    try {

        await carregarItens();


        const totalItens =
            itens.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    quantidadeItem(
                        item
                    ),
                0
            );


        const totalMov =
            document.getElementById(
                'totalMov'
            );


        if (totalMov) {

            const {
                count,
                error
            } =
                await supabaseClient
                    .from('movimentacoes')
                    .select(
                        '*',
                        {
                            count:
                                'exact',
                                head:
                                    true
                        }
                    );


            if (!error) {

                totalMov.innerText =
                    count ||
                    0;

            }

        }


        const totalItensElement =
            document.getElementById(
                'totalItens'
            );


        if (totalItensElement) {

            totalItensElement.innerText =
                totalItens;

        }


        const totalBaixados =
            document.getElementById(
                'totalBaixados'
            );


        if (totalBaixados) {

            totalBaixados.innerText =
                itens.filter(
                    item =>
                        item.status ===
                        'Baixado'
                )
                .reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        quantidadeItem(
                            item
                        ),
                    0
                );

        }


        atualizarDashboardAvancado();

        gerarRelatorioLocais();

    } catch (erro) {

        console.error(
            'ERRO DASHBOARD:',
            erro
        );

    }

}