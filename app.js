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

    if (
        valor === null ||
        valor === undefined
    ) {
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
       Alguns elementos podem não existir
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

        /*
           Primeiro carregamos os itens.
        */

        await carregarItens();


        /*
           =====================================================
           TOTAL DE ITENS
           =====================================================
        */

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


        const totalItensElement =
            document.getElementById(
                'totalItens'
            );


        if (totalItensElement) {

            totalItensElement.innerText =
                totalItens;

        }


        /*
           =====================================================
           TOTAL DE MOVIMENTAÇÕES
           =====================================================
        */

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
                    .from(
                        'movimentacoes'
                    )
                    .select(
                        '*',
                        {
                            count:
                                'exact',
                            head:
                                true
                        }
                    );


            if (error) {

                console.error(
                    'ERRO AO CONTAR MOVIMENTAÇÕES:',
                    error
                );


                totalMov.innerText =
                    '0';

            } else {

                totalMov.innerText =
                    count ||
                    0;

            }

        }


        /*
           =====================================================
           TOTAL DE ITENS BAIXADOS
           =====================================================
        */

        const totalBaixados =
            document.getElementById(
                'totalBaixados'
            );


        if (totalBaixados) {

            const baixados =
                itens.reduce(
                    (
                        total,
                        item
                    ) => {

                        const status =
                            String(
                                item.status ||
                                ''
                            )
                            .trim()
                            .toLowerCase();


                        if (
                            status ===
                            'baixado'
                        ) {

                            return (
                                total +
                                quantidadeItem(
                                    item
                                )
                            );

                        }


                        return total;

                    },
                    0
                );


            totalBaixados.innerText =
                baixados;

        }


        /*
           =====================================================
           TOTAL DE LOCAIS
           =====================================================
        */

        const totalLocais =
            document.getElementById(
                'totalLocais'
            );


        if (totalLocais) {

            const locaisValidos =
                Array.isArray(
                    LOCAIS
                )
                    ? LOCAIS.filter(
                        local =>
                            local &&
                            local.nome
                    )
                    : [];


            totalLocais.innerText =
                locaisValidos.length;

        }


        /*
           =====================================================
           STATUS AVANÇADOS
           =====================================================
        */

        atualizarDashboardAvancado();


        /*
           =====================================================
           RELATÓRIO POR LOCAL
           =====================================================
        */

        gerarRelatorioLocais();


        /*
           =====================================================
           FILTRO DE LOCAIS
           =====================================================
        */

        carregarFiltroLocaisDashboard();


        /*
           =====================================================
           APLICA FILTROS ATUAIS
           =====================================================
        */

        filtrarDashboard();


    } catch (erro) {

        console.error(
            'ERRO AO CARREGAR DASHBOARD:',
            erro
        );

    }

}


/* =========================================================
   DASHBOARD — STATUS
========================================================= */

function atualizarDashboardAvancado() {

    const totalAtivos =
        itens.filter(
            item =>
                item.status ===
                'Ativo'
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


    const totalManutencao =
        itens.filter(
            item =>
                item.status ===
                'Em manutenção'
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


    const totalBaixado =
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


    const totalExtraviado =
        itens.filter(
            item =>
                item.status ===
                'Extraviado'
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


    const dashAtivo =
        document.getElementById(
            'dashAtivo'
        );


    if (dashAtivo) {

        dashAtivo.innerText =
            totalAtivos;

    }


    const dashManutencao =
        document.getElementById(
            'dashManutencao'
        );


    if (dashManutencao) {

        dashManutencao.innerText =
            totalManutencao;

    }


    const dashBaixado =
        document.getElementById(
            'dashBaixado'
        );


    if (dashBaixado) {

        dashBaixado.innerText =
            totalBaixado;

    }


    const dashExtraviado =
        document.getElementById(
            'dashExtraviado'
        );


    if (dashExtraviado) {

        dashExtraviado.innerText =
            totalExtraviado;

    }

}


/* =========================================================
   RELATÓRIO POR LOCAL
========================================================= */

function gerarRelatorioLocais() {

    const tabela =
        document.getElementById(
            'dashboardLocais'
        );


    if (!tabela) {

        return;

    }


    tabela.innerHTML =
        '';


    const agrupado = {};


    itens.forEach(
        item => {

            const local =
                nomeLocal(
                    item.local_id
                );


            const tipo =
                item.tipo ||
                item.nome ||
                'ITEM';


            const quantidade =
                quantidadeItem(
                    item
                );


            const chave =
                `${tipo}||${local}`;


            if (
                !agrupado[chave]
            ) {

                agrupado[chave] = {

                    item:
                        tipo,

                    local:
                        local,

                    quantidade:
                        0

                };

            }


            agrupado[chave]
                .quantidade +=
                    quantidade;

        }
    );


    const registros =
        Object.values(
            agrupado
        );


    registros.sort(
        (
            a,
            b
        ) => {

            const comparacaoLocal =
                a.local.localeCompare(
                    b.local,
                    'pt-BR',
                    {
                        sensitivity:
                            'base'
                    }
                );


            if (
                comparacaoLocal !==
                0
            ) {

                return comparacaoLocal;

            }


            return a.item.localeCompare(
                b.item,
                'pt-BR',
                {
                    sensitivity:
                        'base'
                }
            );

        }
    );


    if (
        registros.length ===
        0
    ) {

        tabela.innerHTML = `

            <tr>

                <td
                    colspan="3"
                    class="empty-state"
                >

                    Nenhum item
                    cadastrado.

                </td>

            </tr>

        `;

        return;

    }


    registros.forEach(
        registro => {

            const tr =
                document.createElement(
                    'tr'
                );


            /*
               Normaliza o local usado
               pelo filtro.
            */

            const localNormalizado =
                String(
                    registro.local ||
                    ''
                )
                .trim()
                .toLowerCase();


            tr.innerHTML = `

                <td>

                    ${escaparHTML(
                        registro.item
                    )}

                </td>


                <td
                    data-local="${escaparHTML(
                        localNormalizado
                    )}"
                >

                    ${escaparHTML(
                        registro.local
                    )}

                </td>


                <td>

                    <strong>

                        ${registro.quantidade}

                    </strong>

                </td>

            `;


            tabela.appendChild(
                tr
            );

        }
    );

}


/* =========================================================
   FILTRO DO DASHBOARD
========================================================= */

function filtrarDashboard() {

    const busca =
        document
            .getElementById(
                'filtroDashboard'
            )
            ?.value
            ?.trim()
            .toLowerCase() ||
        '';


    const filtroLocal =
        document
            .getElementById(
                'filtroLocalDashboard'
            )
            ?.value
            ?.trim()
            .toLowerCase() ||
        '';


    const linhas =
        document.querySelectorAll(
            '#dashboardLocais tr'
        );


    linhas.forEach(
        linha => {

            const item =
                linha.children[0]
                    ?.innerText
                    ?.toLowerCase() ||
                '';


            const local =
                linha.children[1]
                    ?.dataset
                    ?.local ||
                '';


            const texto =
                `${item} ${local}`;


            const correspondeBusca =
                !busca ||
                texto.includes(
                    busca
                );


            const correspondeLocal =
                !filtroLocal ||
                local ===
                    filtroLocal;


            linha.style.display =
                (
                    correspondeBusca &&
                    correspondeLocal
                )
                    ? ''
                    : 'none';

        }
    );

}


/* =========================================================
   FILTRO DE LOCAIS DO DASHBOARD
========================================================= */

function carregarFiltroLocaisDashboard() {

    const select =
        document.getElementById(
            'filtroLocalDashboard'
        );


    if (!select) {

        console.warn(
            'Elemento #filtroLocalDashboard não encontrado.'
        );

        return;

    }


    /*
       Guarda a seleção atual.
    */

    const valorAtual =
        select.value ||
        '';


    /*
       Limpa o campo.
    */

    select.innerHTML = `

        <option value="">
            Todos os Locais
        </option>

    `;


    /*
       Garante que LOCAIS exista.
    */

    if (
        !Array.isArray(
            LOCAIS
        )
    ) {

        console.warn(
            'LOCAIS não é um array.'
        );

        return;

    }


    /*
       Ordena uma cópia.
       Não altera o array original.
    */

    const locais =
        [
            ...LOCAIS
        ]
        .filter(
            local =>
                local &&
                local.nome &&
                String(
                    local.nome
                ).trim()
        )
        .sort(
            (
                a,
                b
            ) =>
                String(
                    a.nome
                )
                .localeCompare(
                    String(
                        b.nome
                    ),
                    'pt-BR',
                    {
                        sensitivity:
                            'base'
                    }
                )
        );


    /*
       Evita locais duplicados.
    */

    const locaisProcessados =
        new Set();


    locais.forEach(
        local => {

            const nome =
                String(
                    local.nome
                ).trim();


            const valor =
                nome
                    .toLowerCase();


            if (
                locaisProcessados.has(
                    valor
                )
            ) {

                return;

            }


            locaisProcessados.add(
                valor
            );


            const option =
                document.createElement(
                    'option'
                );


            option.value =
                valor;


            option.textContent =
                nome;


            select.appendChild(
                option
            );

        }
    );


    /*
       Restaura a seleção anterior.
    */

    if (
        valorAtual &&
        Array.from(
            select.options
        ).some(
            option =>
                option.value ===
                valorAtual
        )
    ) {

        select.value =
            valorAtual;

    }

}


/* =========================================================
   HISTÓRICO
========================================================= */

async function carregarHistorico() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    'movimentacoes'
                )
                .select('*')
                .order(
                    'data',
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            throw error;

        }


        movimentacoes =
            Array.isArray(data)
                ? data
                : [];


        const tabela =
            document.getElementById(
                'historico'
            );


        if (!tabela) {

            return;

        }


        tabela.innerHTML =
            '';


        if (
            movimentacoes.length ===
            0
        ) {

            tabela.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-state"
                    >

                        Nenhuma movimentação
                        registrada.

                    </td>

                </tr>

            `;

            return;

        }


        movimentacoes.forEach(
            mov => {

                const item =
                    itens.find(
                        registro =>
                            Number(
                                registro.id
                            ) ===
                            Number(
                                mov.item_id
                            )
                    );


                const origem =
                    nomeLocal(
                        mov.origem_id
                    );


                const destino =
                    nomeLocal(
                        mov.destino_id
                    );


                const data =
                    mov.data
                        ? new Date(
                            mov.data
                        )
                        .toLocaleString(
                            'pt-BR'
                        )
                        : '-';


                const tr =
                    document.createElement(
                        'tr'
                    );


                tr.innerHTML = `

                    <td>

                        ${escaparHTML(
                            item?.patrimonio ||
                            item?.nome ||
                            '-'
                        )}

                    </td>


                    <td>

                        ${escaparHTML(
                            origem
                        )}

                    </td>


                    <td>

                        ${escaparHTML(
                            destino
                        )}

                    </td>


                    <td>

                        ${escaparHTML(
                            mov.observacao ||
                            '-'
                        )}

                    </td>


                    <td>

                        ${escaparHTML(
                            data
                        )}

                    </td>

                `;


                tabela.appendChild(
                    tr
                );

            }
        );


        const totalMov =
            document.getElementById(
                'totalMov'
            );


        if (totalMov) {

            totalMov.innerText =
                movimentacoes.length;

        }


    } catch (erro) {

        console.error(
            'ERRO AO CARREGAR HISTÓRICO:',
            erro
        );

    }

}

/* =========================================================
   PREENCHER ORIGEM AUTOMATICAMENTE
========================================================= */

function preencherOrigemAutomaticamente() {

    const selectItem =
        document.getElementById('itemMov');

    const origemInput =
        document.getElementById('origemAtual') ||
        document.getElementById('origemNome');

    if (!selectItem || !origemInput) {
        return;
    }

    const itemId =
        selectItem.value;

    if (!itemId) {

        origemInput.value = '';

        atualizarResumoMovimentacao();

        return;
    }

    const item =
        itens.find(
            registro =>
                String(registro.id) ===
                String(itemId)
        );

    if (!item) {

        origemInput.value = '';

        atualizarResumoMovimentacao();

        return;
    }

    origemInput.value =
        nomeLocal(item.local_id);

    const quantidadeCampo =
        document.getElementById(
            'quantidadeMov'
        );

    if (quantidadeCampo) {

        const estoque =
            quantidadeItem(item);

        const atual =
            parseInt(
                quantidadeCampo.value || '1',
                10
            );

        if (atual > estoque) {

            quantidadeCampo.value =
                estoque;

        }

        quantidadeCampo.max =
            estoque;

    }

    atualizarResumoMovimentacao();

}


/* =========================================================
   RESUMO DA MOVIMENTAÇÃO
========================================================= */

function atualizarResumoMovimentacao() {

    const itemSelect =
        document.getElementById(
            'itemMov'
        );

    const destinoSelect =
        document.getElementById(
            'destino'
        );

    const quantidadeInput =
        document.getElementById(
            'quantidadeMov'
        );

    const resumo =
        document.getElementById(
            'resumoMovimentacao'
        );

    if (!resumo) {
        return;
    }

    const item =
        itens.find(
            registro =>
                String(registro.id) ===
                String(itemSelect?.value)
        );

    if (!item) {

        resumo.innerHTML = '';

        return;
    }

    const origem =
        nomeLocal(
            item.local_id
        );

    const destino =
        destinoSelect?.value
            ? nomeLocal(
                destinoSelect.value
            )
            : 'Selecione o destino';

    const quantidade =
        Math.max(
            1,
            parseInt(
                quantidadeInput?.value || '1',
                10
            )
        );

    resumo.innerHTML = `

        <div class="mov-resumo">

            <div>

                <small>
                    Origem
                </small>

                <strong>
                    ${escaparHTML(
                        origem
                    )}
                </strong>

            </div>

            <div class="mov-seta">

                <i
                    class="fa-solid fa-arrow-right"
                ></i>

            </div>

            <div>

                <small>
                    Destino
                </small>

                <strong>
                    ${escaparHTML(
                        destino
                    )}
                </strong>

            </div>

            <div>

                <small>
                    Quantidade
                </small>

                <strong>
                    ${quantidade}
                    unidade(s)
                </strong>

            </div>

        </div>

    `;

}


/* =========================================================
   MOVIMENTAR ITEM
========================================================= */

async function movimentarItem(event) {

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
            'Usuário sem permissão para movimentar itens.'
        );

        return false;
    }

    const itemId =
        document.getElementById(
            'itemMov'
        )?.value || '';

    const destinoId =
        document.getElementById(
            'destino'
        )?.value || '';

    const quantidade =
        Math.max(
            1,
            parseInt(
                document.getElementById(
                    'quantidadeMov'
                )?.value || '1',
                10
            )
        );

    const observacao =
        document.getElementById(
            'observacaoMov'
        )?.value
        ?.trim() || '';

    const statusNovo =
        document.getElementById(
            'statusMov'
        )?.value || '';

    if (!itemId) {

        alert(
            'Selecione o patrimônio/item.'
        );

        return false;
    }

    if (!destinoId) {

        alert(
            'Selecione o destino.'
        );

        return false;
    }

    const item =
        itens.find(
            registro =>
                Number(registro.id) ===
                Number(itemId)
        );

    if (!item) {

        alert(
            'Item não encontrado.'
        );

        return false;
    }

    const origemId =
        Number(item.local_id);

    const destino =
        Number(destinoId);

    if (
        origemId ===
        destino
    ) {

        alert(
            'O destino precisa ser diferente do local atual.'
        );

        return false;
    }

    const estoqueAtual =
        quantidadeItem(item);

    if (
        quantidade >
        estoqueAtual
    ) {

        alert(
            `Quantidade indisponível.\n\n` +
            `Estoque atual: ${estoqueAtual} unidade(s).`
        );

        return false;
    }

    try {

        /*
           MOVIMENTAÇÃO TOTAL
        */

        if (
            quantidade ===
            estoqueAtual
        ) {

            const dadosAtualizacao = {

                local_id:
                    destino

            };

            if (statusNovo) {

                dadosAtualizacao.status =
                    statusNovo;

            }

            const {
                error:
                    erroUpdate
            } =
                await supabaseClient
                    .from('itens')
                    .update(
                        dadosAtualizacao
                    )
                    .eq(
                        'id',
                        item.id
                    );

            if (erroUpdate) {
                throw erroUpdate;
            }

            const {
                error:
                    erroHistorico
            } =
                await supabaseClient
                    .from(
                        'movimentacoes'
                    )
                    .insert([{

                        item_id:
                            Number(item.id),

                        origem_id:
                            origemId,

                        destino_id:
                            destino,

                        quantidade:
                            quantidade,

                        observacao:
                            observacao,

                        data:
                            new Date()
                                .toISOString()

                    }]);

            if (erroHistorico) {

                console.error(
                    'ERRO HISTÓRICO:',
                    erroHistorico
                );

            }

        }

        /*
           MOVIMENTAÇÃO PARCIAL
        */

        else {

            const novaQuantidadeOrigem =
                estoqueAtual -
                quantidade;

            const {
                error:
                    erroOrigem
            } =
                await supabaseClient
                    .from('itens')
                    .update({

                        quantidade:
                            novaQuantidadeOrigem

                    })
                    .eq(
                        'id',
                        item.id
                    );

            if (erroOrigem) {
                throw erroOrigem;
            }

            const {
                data:
                    destinoExistente,
                error:
                    erroBuscaDestino
            } =
                await supabaseClient
                    .from('itens')
                    .select('*')
                    .eq(
                        'nome',
                        item.nome
                    )
                    .eq(
                        'local_id',
                        destino
                    )
                    .is(
                        'patrimonio',
                        null
                    )
                    .maybeSingle();

            if (erroBuscaDestino) {
                throw erroBuscaDestino;
            }

            if (destinoExistente) {

                const quantidadeDestino =
                    quantidadeItem(
                        destinoExistente
                    );

                const {
                    error:
                        erroDestino
                } =
                    await supabaseClient
                        .from('itens')
                        .update({

                            quantidade:
                                quantidadeDestino +
                                quantidade

                        })
                        .eq(
                            'id',
                            destinoExistente.id
                        );

                if (erroDestino) {
                    throw erroDestino;
                }

            } else {

                const {
                    error:
                        erroNovoDestino
                } =
                    await supabaseClient
                        .from('itens')
                        .insert([{

                            patrimonio:
                                null,

                            nome:
                                item.nome,

                            tipo:
                                item.tipo,

                            descricao:
                                item.descricao,

                            local_id:
                                destino,

                            quantidade:
                                quantidade,

                            status:
                                statusNovo ||
                                item.status ||
                                'Ativo',

                            foto_url:
                                item.foto_url ||
                                null

                        }]);

                if (erroNovoDestino) {
                    throw erroNovoDestino;
                }

            }

            if (
                novaQuantidadeOrigem <=
                0
            ) {

                await supabaseClient
                    .from('itens')
                    .delete()
                    .eq(
                        'id',
                        item.id
                    );

            }

            const {
                error:
                    erroHistorico
            } =
                await supabaseClient
                    .from(
                        'movimentacoes'
                    )
                    .insert([{

                        item_id:
                            Number(item.id),

                        origem_id:
                            origemId,

                        destino_id:
                            destino,

                        quantidade:
                            quantidade,

                        observacao:
                            observacao,

                        data:
                            new Date()
                                .toISOString()

                    }]);

            if (erroHistorico) {

                console.error(
                    'ERRO HISTÓRICO:',
                    erroHistorico
                );

            }

        }

        alert(
            'Movimentação realizada com sucesso!'
        );

        const itemMov =
            document.getElementById(
                'itemMov'
            );

        const destinoCampo =
            document.getElementById(
                'destino'
            );

        const quantidadeCampo =
            document.getElementById(
                'quantidadeMov'
            );

        const observacaoCampo =
            document.getElementById(
                'observacaoMov'
            );

        const statusCampo =
            document.getElementById(
                'statusMov'
            );

        const origemCampo =
            document.getElementById(
                'origemAtual'
            ) ||
            document.getElementById(
                'origemNome'
            );

        if (itemMov) {
            itemMov.value = '';
        }

        if (destinoCampo) {
            destinoCampo.value = '';
        }

        if (quantidadeCampo) {
            quantidadeCampo.value = 1;
        }

        if (observacaoCampo) {
            observacaoCampo.value = '';
        }

        if (statusCampo) {
            statusCampo.value = '';
        }

        if (origemCampo) {
            origemCampo.value = '';
        }

        const resumo =
            document.getElementById(
                'resumoMovimentacao'
            );

        if (resumo) {
            resumo.innerHTML = '';
        }

        await carregarDashboard();

        await carregarHistorico();

        return false;

    } catch (erro) {

        console.error(
            'ERRO AO MOVIMENTAR:',
            erro
        );

        alert(
            'Erro ao movimentar o item.\n\n' +
            (
                erro?.message ||
                'Erro desconhecido.'
            )
        );

        return false;
    }

}


/* =========================================================
   CONSULTA PÚBLICA
========================================================= */

function abrirConsultaPublica() {

    const consultaTela =
        document.getElementById(
            'consultaPublicaTela'
        );

    if (!consultaTela) {

        console.error(
            'Tela consultaPublicaTela não encontrada no HTML.'
        );

        alert(
            'A tela de consulta pública não foi encontrada.'
        );

        return;
    }

    document
        .querySelectorAll('.tela')
        .forEach(
            tela => {

                tela.classList.remove(
                    'activeTela'
                );

            }
        );

    consultaTela.classList.add(
        'activeTela'
    );

    document.body
        .classList
        .remove(
            'login-mode'
        );

    document.body
        .classList
        .add(
            'public-mode'
        );

    const sidebar =
        document.getElementById(
            'sidebar'
        );

    if (sidebar) {

        sidebar.classList.remove(
            'open'
        );

        sidebar.style.display =
            'none';

    }

    carregarLocaisConsultaPublica();

    carregarConsultaPublica();

}


/* =========================================================
   VOLTAR PARA LOGIN
========================================================= */

function voltarParaLogin() {

    const consultaTela =
        document.getElementById(
            'consultaPublicaTela'
        );

    if (consultaTela) {

        consultaTela.classList.remove(
            'activeTela'
        );

    }

    document.body
        .classList
        .remove(
            'public-mode'
        );

    const sidebar =
        document.getElementById(
            'sidebar'
        );

    if (sidebar) {

        sidebar.style.display = '';

        sidebar.classList.remove(
            'open'
        );

    }

    abrirTela(
        'loginTela'
    );

}


/* =========================================================
   LOCAIS DA CONSULTA PÚBLICA
========================================================= */

function carregarLocaisConsultaPublica() {

    const select =
        document.getElementById(
            'filtroLocalPublico'
        );

    if (!select) {
        return;
    }

    select.innerHTML = `

        <option value="">
            Todos os locais
        </option>

    `;

    [...LOCAIS]
        .sort(
            (
                a,
                b
            ) =>
                a.nome.localeCompare(
                    b.nome,
                    'pt-BR'
                )
        )
        .forEach(
            local => {

                select.innerHTML += `

                    <option
                        value="${Number(local.id)}"
                    >

                        ${escaparHTML(
                            local.nome
                        )}

                    </option>

                `;

            }
        );

}


/* =========================================================
   ITENS DA CONSULTA PÚBLICA
========================================================= */

let itensConsultaPublica = [];


/* =========================================================
   CARREGAR CONSULTA PÚBLICA
========================================================= */

async function carregarConsultaPublica() {

    const container =
        document.getElementById(
            'listaConsultaPublica'
        );

    if (!container) {

        console.error(
            'Elemento listaConsultaPublica não encontrado.'
        );

        return;
    }

    container.innerHTML = `

        <div class="consulta-loading">

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            <span>
                Carregando inventário...
            </span>

        </div>

    `;

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    'consulta_publica_inventario'
                )
                .select(
                    'nome,tipo,descricao,quantidade,local_id,status,foto_url'
                )
                .eq(
                    'status',
                    'Ativo'
                )
                .order(
                    'nome',
                    {
                        ascending:
                            true
                    }
                );

        if (error) {
            throw error;
        }

        itensConsultaPublica =
            Array.isArray(data)
                ? data
                : [];

        /*
           Consolida ITEM + LOCAL.
        */

        itensConsultaPublica =
            consolidarItensConsultaPublica(
                itensConsultaPublica
            );

        /*
           Monta automaticamente as categorias.
        */

        carregarCategoriasConsultaPublica();

        /*
           Reinicia a paginação.
        */

        paginaConsultaPublica = 1;

        /*
           Renderiza.
        */

        renderizarConsultaPublica();

    } catch (erro) {

        console.error(
            'ERRO CONSULTA PÚBLICA:',
            erro
        );

        container.innerHTML = `

            <div class="consulta-erro">

                <i
                    class="fa-solid fa-triangle-exclamation"
                ></i>

                <h3>
                    Não foi possível carregar
                    o inventário
                </h3>

                <p>
                    Verifique sua conexão
                    e tente novamente.
                </p>

                <button
                    type="button"
                    onclick="carregarConsultaPublica()"
                >

                    <i
                        class="fa-solid fa-rotate-right"
                    ></i>

                    Tentar novamente

                </button>

            </div>

        `;

    }

}


/* =========================================================
   CONSOLIDAR CONSULTA
========================================================= */

function consolidarItensConsultaPublica(
    lista
) {

    const mapa =
        new Map();

    lista.forEach(
        item => {

            const quantidade =
                quantidadeItem(
                    item
                );

            const chave =
                [
                    String(
                        item.nome ||
                        ''
                    )
                    .trim()
                    .toLowerCase(),

                    String(
                        item.tipo ||
                        ''
                    )
                    .trim()
                    .toLowerCase(),

                    String(
                        item.local_id ||
                        ''
                    )

                ]
                .join('||');

            if (
                !mapa.has(chave)
            ) {

                mapa.set(
                    chave,
                    {

                        nome:
                            item.nome ||
                            'Item',

                        tipo:
                            item.tipo ||
                            '',

                        descricao:
                            item.descricao ||
                            '',

                        local_id:
                            item.local_id,

                        status:
                            item.status ||
                            'Ativo',

                        foto_url:
                            item.foto_url ||
                            '',

                        quantidade:
                            quantidade

                    }
                );

            } else {

                const registro =
                    mapa.get(
                        chave
                    );

                registro.quantidade +=
                    quantidade;

                if (
                    !registro.foto_url &&
                    item.foto_url
                ) {

                    registro.foto_url =
                        item.foto_url;

                }

            }

        }
    );

    return Array.from(
        mapa.values()
    );

}
/* =========================================================
   PAGINAÇÃO DA CONSULTA PÚBLICA
========================================================= */

let paginaConsultaPublica = 1;

const itensPorPaginaConsultaPublica = 24;


/* =========================================================
   CARREGAR CATEGORIAS AUTOMATICAMENTE
========================================================= */

function carregarCategoriasConsultaPublica() {

    let select =
        document.getElementById(
            'filtroCategoriaPublico'
        );

    /*
       Se o select ainda não existir,
       criamos automaticamente.
    */

    if (!select) {

        const toolbar =
            document.querySelector(
                '.consulta-publica-toolbar'
            );

        const localSelect =
            document.getElementById(
                'filtroLocalPublico'
            );

        if (
            toolbar &&
            localSelect
        ) {

            select =
                document.createElement(
                    'select'
                );

            select.id =
                'filtroCategoriaPublico';

            select.setAttribute(
                'aria-label',
                'Filtrar por categoria'
            );

            localSelect.insertAdjacentElement(
                'afterend',
                select
            );

        }

    }

    if (!select) {
        return;
    }

    /*
       Descobre todas as categorias existentes.
    */

    const categorias =
        [
            ...new Set(
                itensConsultaPublica
                    .map(
                        item =>
                            String(
                                item.tipo ||
                                ''
                            )
                            .trim()
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    'pt-BR'
                )
        );

    /*
       Monta o select.
    */

    select.innerHTML = `

        <option value="">
            Todas as categorias
        </option>

    `;

    categorias.forEach(
        categoria => {

            select.innerHTML += `

                <option
                    value="${escaparHTML(categoria)}"
                >

                    ${escaparHTML(
                        categoria
                    )}

                </option>

            `;

        }
    );

}


/* =========================================================
   PAGINAÇÃO — CONTROLES
========================================================= */

function renderizarPaginacaoConsultaPublica(
    totalItens
) {

    let paginacao =
        document.getElementById(
            'paginacaoConsultaPublica'
        );

    const lista =
        document.getElementById(
            'listaConsultaPublica'
        );

    if (!lista) {
        return;
    }

    /*
       Cria o container automaticamente
       caso ainda não exista no HTML.
    */

    if (!paginacao) {

        paginacao =
            document.createElement(
                'div'
            );

        paginacao.id =
            'paginacaoConsultaPublica';

        paginacao.className =
            'consulta-paginacao';

        lista.insertAdjacentElement(
            'afterend',
            paginacao
        );

    }

    const totalPaginas =
        Math.ceil(
            totalItens /
            itensPorPaginaConsultaPublica
        );

    /*
       Se couber tudo em uma página,
       não mostra paginação.
    */

    if (
        totalPaginas <= 1
    ) {

        paginacao.innerHTML =
            '';

        return;

    }

    /*
       Garante que a página atual
       nunca fique fora do limite.
    */

    if (
        paginaConsultaPublica >
        totalPaginas
    ) {

        paginaConsultaPublica =
            totalPaginas;

    }

    let html = '';

    /*
       Botão anterior.
    */

    html += `

        <button
            type="button"
            class="consulta-pagina-btn"
            ${paginaConsultaPublica === 1 ? 'disabled' : ''}
            onclick="mudarPaginaConsultaPublica(${paginaConsultaPublica - 1})"
            title="Página anterior"
        >

            <i
                class="fa-solid fa-chevron-left"
            ></i>

        </button>

    `;

    /*
       Define as páginas que serão mostradas.
    */

    const paginas =
        [];

    paginas.push(1);

    for (
        let i =
            paginaConsultaPublica - 2;
        i <=
            paginaConsultaPublica + 2;
        i++
    ) {

        if (
            i > 1 &&
            i < totalPaginas
        ) {

            paginas.push(i);

        }

    }

    if (
        totalPaginas > 1
    ) {

        paginas.push(
            totalPaginas
        );

    }

    const paginasUnicas =
        [
            ...new Set(
                paginas
            )
        ]
        .sort(
            (a, b) =>
                a - b
        );

    let anterior =
        null;

    paginasUnicas.forEach(
        numero => {

            if (
                anterior !== null &&
                numero -
                    anterior >
                    1
            ) {

                html += `

                    <span
                        class="consulta-pagina-reticencias"
                    >
                        ...
                    </span>

                `;

            }

            html += `

                <button
                    type="button"
                    class="consulta-pagina-btn ${
                        numero ===
                        paginaConsultaPublica
                            ? 'active'
                            : ''
                    }"
                    onclick="mudarPaginaConsultaPublica(${numero})"
                >

                    ${numero}

                </button>

            `;

            anterior =
                numero;

        }
    );

    /*
       Botão próximo.
    */

    html += `

        <button
            type="button"
            class="consulta-pagina-btn"
            ${
                paginaConsultaPublica ===
                totalPaginas
                    ? 'disabled'
                    : ''
            }
            onclick="mudarPaginaConsultaPublica(${paginaConsultaPublica + 1})"
            title="Próxima página"
        >

            <i
                class="fa-solid fa-chevron-right"
            ></i>

        </button>

    `;

    /*
       Informação.
    */

    const inicio =
        (
            (
                paginaConsultaPublica -
                1
            ) *
            itensPorPaginaConsultaPublica
        ) +
        1;

    const fim =
        Math.min(
            paginaConsultaPublica *
                itensPorPaginaConsultaPublica,
            totalItens
        );

    html += `

        <span
            class="consulta-pagina-info"
        >

            Exibindo
            <strong>
                ${inicio}-${fim}
            </strong>
            de
            <strong>
                ${totalItens}
            </strong>

        </span>

    `;

    paginacao.innerHTML =
        html;

}


/* =========================================================
   MUDAR PÁGINA
========================================================= */

function mudarPaginaConsultaPublica(
    pagina
) {

    const totalPaginas =
        Math.ceil(
            itensConsultaPublica.length /
            itensPorPaginaConsultaPublica
        );

    if (
        pagina < 1 ||
        pagina > totalPaginas
    ) {

        return;

    }

    paginaConsultaPublica =
        pagina;

    renderizarConsultaPublica();

    const lista =
        document.getElementById(
            'listaConsultaPublica'
        );

    if (lista) {

        lista.scrollIntoView({
            behavior:
                'smooth',
            block:
                'start'
        });

    }

}

/* =========================================================
   RENDERIZAR CONSULTA PÚBLICA
========================================================= */

function renderizarConsultaPublica() {

    const container =
        document.getElementById(
            'listaConsultaPublica'
        );

    if (!container) {
        return;
    }

    /*
       PESQUISA
    */

    const busca =
        document
            .getElementById(
                'buscaPublica'
            )
            ?.value
            ?.trim()
            .toLowerCase() ||
        '';

    /*
       LOCAL
    */

    const localFiltro =
        document
            .getElementById(
                'filtroLocalPublico'
            )
            ?.value ||
        '';

    /*
       CATEGORIA
    */

    const categoriaFiltro =
        document
            .getElementById(
                'filtroCategoriaPublico'
            )
            ?.value ||
        '';

    /*
       ORDENAÇÃO
    */

    const ordenacao =
        document
            .getElementById(
                'ordenacaoPublico'
            )
            ?.value ||
        'az';

    /*
       FILTRAGEM
    */

    let itensFiltrados =
        itensConsultaPublica.filter(
            item => {

                const texto =
                    [
                        item.nome,
                        item.tipo,
                        item.descricao,
                        nomeLocal(
                            item.local_id
                        )
                    ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                const correspondeBusca =
                    !busca ||
                    texto.includes(
                        busca
                    );

                const correspondeLocal =
                    !localFiltro ||
                    String(
                        item.local_id
                    ) ===
                    String(
                        localFiltro
                    );

                const correspondeCategoria =
                    !categoriaFiltro ||
                    String(
                        item.tipo ||
                        ''
                    ) ===
                    String(
                        categoriaFiltro
                    );

                return (
                    correspondeBusca &&
                    correspondeLocal &&
                    correspondeCategoria
                );

            }
        );

    /*
       ORDENAÇÃO
    */

    itensFiltrados.sort(
        (a, b) => {

            const nomeA =
                String(
                    a.nome ||
                    ''
                );

            const nomeB =
                String(
                    b.nome ||
                    ''
                );

            if (
                ordenacao ===
                'za'
            ) {

                return nomeB.localeCompare(
                    nomeA,
                    'pt-BR'
                );

            }

            return nomeA.localeCompare(
                nomeB,
                'pt-BR'
            );

        }
    );

    /*
       CONTADOR
    */

    const contador =
        document.getElementById(
            'contadorConsultaPublica'
        );

    if (contador) {

        contador.innerText =
            itensFiltrados.length;

    }

    /*
       NENHUM RESULTADO
    */

    if (
        itensFiltrados.length ===
        0
    ) {

        container.innerHTML = `

            <div class="consulta-vazia">

                <div class="consulta-vazia-icon">

                    <i
                        class="fa-solid fa-box-open"
                    ></i>

                </div>

                <h3>
                    Nenhum item encontrado
                </h3>

                <p>
                    Tente alterar a pesquisa,
                    categoria ou local.
                </p>

            </div>

        `;

        renderizarPaginacaoConsultaPublica(
            0
        );

        return;

    }

    /*
       PAGINAÇÃO
    */

    const totalPaginas =
        Math.ceil(
            itensFiltrados.length /
            itensPorPaginaConsultaPublica
        );

    if (
        paginaConsultaPublica >
        totalPaginas
    ) {

        paginaConsultaPublica =
            1;

    }

    const inicio =
        (
            paginaConsultaPublica -
            1
        ) *
        itensPorPaginaConsultaPublica;

    const fim =
        inicio +
        itensPorPaginaConsultaPublica;

    const itensDaPagina =
        itensFiltrados.slice(
            inicio,
            fim
        );

    /*
       LIMPA A GRADE
    */

    container.innerHTML =
        '';

    /*
       MONTA OS CARDS
    */

    itensDaPagina.forEach(
        item => {

            const card =
                document.createElement(
                    'article'
                );

            card.className =
                'consulta-item-card';

            const local =
                nomeLocal(
                    item.local_id
                );

            const quantidade =
                quantidadeItem(
                    item
                );

            /*
               FOTO
            */

            const foto =
                item.foto_url
                    ? `

                        <div
                            class="consulta-foto"
                        >

                            <img
                                src="${escaparHTML(item.foto_url)}"
                                alt="${escaparHTML(item.nome)}"
                                loading="lazy"
                                onclick="abrirModalFoto('${escaparHTML(item.foto_url)}')"
                            >

                            <button
                                type="button"
                                class="consulta-foto-expandir"
                                onclick="event.stopPropagation(); abrirModalFoto('${escaparHTML(item.foto_url)}')"
                                title="Ampliar foto"
                            >

                                <i
                                    class="fa-solid fa-expand"
                                ></i>

                            </button>

                        </div>

                    `
                    : `

                        <div
                            class="consulta-foto consulta-sem-foto"
                        >

                            <i
                                class="fa-solid fa-image"
                            ></i>

                            <span>
                                Sem foto
                            </span>

                        </div>

                    `;

            /*
               DESCRIÇÃO
            */

            const descricao =
                item.descricao
                    ? `

                        <p
                            class="consulta-descricao"
                        >

                            ${escaparHTML(
                                item.descricao
                            )}

                        </p>

                    `
                    : '';

            /*
               CARD
            */

            card.innerHTML = `

                ${foto}

                <div
                    class="consulta-card-conteudo"
                >

                    <div
                        class="consulta-card-topo"
                    >

                        <span
                            class="consulta-status"
                        >

                            <span
                                class="consulta-status-dot"
                            ></span>

                            Ativo

                        </span>

                        <span
                            class="consulta-tipo"
                        >

                            ${escaparHTML(
                                item.tipo ||
                                'Estoque'
                            )}

                        </span>

                    </div>

                    <h3
                        class="consulta-item-nome"
                    >

                        ${escaparHTML(
                            item.nome
                        )}

                    </h3>

                    ${descricao}

                    <div
                        class="consulta-info-grid"
                    >

                        <div
                            class="consulta-info"
                        >

                            <span
                                class="consulta-info-label"
                            >

                                Quantidade

                            </span>

                            <strong
                                class="consulta-quantidade"
                            >

                                ${quantidade}

                            </strong>

                            <small>
                                unidade(s)
                            </small>

                        </div>

                        <div
                            class="consulta-info"
                        >

                            <span
                                class="consulta-info-label"
                            >

                                Localização

                            </span>

                            <strong
                                class="consulta-local"
                            >

                                <i
                                    class="fa-solid fa-location-dot"
                                ></i>

                                ${escaparHTML(
                                    local
                                )}

                            </strong>

                        </div>

                    </div>

                </div>

            `;

            container.appendChild(
                card
            );

        }
    );

    /*
       PAGINAÇÃO
    */

    renderizarPaginacaoConsultaPublica(
        itensFiltrados.length
    );

}

/* =========================================================
   FILTROS DA CONSULTA
========================================================= */

function filtrarConsultaPublica() {

    renderizarConsultaPublica();

}


function limparFiltrosConsultaPublica() {

    const busca =
        document.getElementById(
            'buscaPublica'
        );

    const local =
        document.getElementById(
            'filtroLocalPublico'
        );

    const categoria =
        document.getElementById(
            'filtroCategoriaPublico'
        );

    const ordenacao =
        document.getElementById(
            'ordenacaoPublico'
        );

    if (busca) {

        busca.value =
            '';

    }

    if (local) {

        local.value =
            '';

    }

    if (categoria) {

        categoria.value =
            '';

    }

    if (ordenacao) {

        ordenacao.value =
            'az';

    }

    paginaConsultaPublica =
        1;

    renderizarConsultaPublica();

}

async function atualizarConsultaPublica() {

    const botao =
        document.getElementById(
            'btnAtualizarConsulta'
        );

    const texto =
        botao?.innerHTML;

    if (botao) {

        botao.disabled = true;

        botao.innerHTML = `

            <i
                class="fa-solid fa-spinner fa-spin"
            ></i>

            Atualizando...

        `;

    }

    try {

        await carregarConsultaPublica();

    } finally {

        if (botao) {

            botao.disabled = false;

            botao.innerHTML =
                texto ||
                '<i class="fa-solid fa-rotate"></i> Atualizar';

        }

    }

}


/* =========================================================
   MODAL DE FOTO
========================================================= */

function abrirModalFoto(url) {

    if (!url) {
        return;
    }

    const modal =
        document.getElementById(
            'modalFoto'
        );

    const imagem =
        document.getElementById(
            'imagemModal'
        );

    if (
        !modal ||
        !imagem
    ) {

        window.open(
            url,
            '_blank'
        );

        return;
    }

    imagem.src =
        url;

    imagem.alt =
        'Foto do item';

    modal.classList.add(
        'active'
    );

    document.body
        .classList
        .add(
            'modal-aberto'
        );

}


function fecharModalFoto(
    event
) {

    if (
        event &&
        event.target &&
        event.currentTarget &&
        event.target !==
            event.currentTarget
    ) {

        return;
    }

    const modal =
        document.getElementById(
            'modalFoto'
        );

    if (modal) {

        modal.classList.remove(
            'active'
        );

    }

    document.body
        .classList
        .remove(
            'modal-aberto'
        );

}


document.addEventListener(
    'keydown',
    event => {

        if (
            event.key ===
            'Escape'
        ) {

            fecharModalFoto();

        }

    }
);


/* =========================================================
   ABRIR TELAS
========================================================= */

function abrirTela(
    idTela,
    elemento
) {

    const telasPublicas = [

        'loginTela',
        'consultaPublicaTela'

    ];

    if (
        !usuarioLogado &&
        !telasPublicas.includes(
            idTela
        )
    ) {

        alert(
            'Faça login primeiro.'
        );

        return;
    }

    const tela =
        document.getElementById(
            idTela
        );

    if (!tela) {

        console.error(
            'Tela não encontrada:',
            idTela
        );

        return;
    }

    document
        .querySelectorAll(
            '.tela'
        )
        .forEach(
            item => {

                item.classList.remove(
                    'activeTela'
                );

            }
        );

    tela.classList.add(
        'activeTela'
    );

    document
        .querySelectorAll(
            '.menu-item'
        )
        .forEach(
            menu => {

                menu.classList.remove(
                    'active'
                );

            }
        );

    if (elemento) {

        elemento.classList.add(
            'active'
        );

    }

    if (
        idTela ===
        'loginTela'
    ) {

        document.body
            .classList
            .add(
                'login-mode'
            );

        document.body
            .classList
            .remove(
                'public-mode'
            );

    }

    if (
        idTela ===
        'consultaPublicaTela'
    ) {

        document.body
            .classList
            .remove(
                'login-mode'
            );

        document.body
            .classList
            .add(
                'public-mode'
            );

        carregarLocaisConsultaPublica();

        carregarConsultaPublica();

    }

    if (
        idTela !==
            'loginTela' &&
        idTela !==
            'consultaPublicaTela'
    ) {

        document.body
            .classList
            .remove(
                'login-mode'
            );

        document.body
            .classList
            .remove(
                'public-mode'
            );

    }

    if (
        window.innerWidth <=
        900
    ) {

        const sidebar =
            document.getElementById(
                'sidebar'
            );

        if (sidebar) {

            sidebar.classList.remove(
                'open'
            );

        }

    }

}


/* =========================================================
   MENU MOBILE
========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            'sidebar'
        );

    if (!sidebar) {
        return;
    }

    if (
        document.body
            .classList
            .contains(
                'public-mode'
            )
    ) {

        return;
    }

    if (
        document.body
            .classList
            .contains(
                'login-mode'
            )
    ) {

        return;
    }

    sidebar.classList.toggle(
        'open'
    );

}


document.addEventListener(
    'click',
    event => {

        const sidebar =
            document.getElementById(
                'sidebar'
            );

        const menuBtn =
            document.querySelector(
                '.mobile-menu-btn'
            );

        if (
            !sidebar ||
            !menuBtn
        ) {

            return;
        }

        if (
            window.innerWidth >
            900
        ) {

            return;
        }

        if (
            document.body
                .classList
                .contains(
                    'login-mode'
                ) ||
            document.body
                .classList
                .contains(
                    'public-mode'
                )
        ) {

            sidebar.classList.remove(
                'open'
            );

            return;
        }

        const clicouSidebar =
            sidebar.contains(
                event.target
            );

        const clicouBotao =
            menuBtn.contains(
                event.target
            );

        if (
            !clicouSidebar &&
            !clicouBotao
        ) {

            sidebar.classList.remove(
                'open'
            );

        }

    }
);


/* =========================================================
   EXPORTAR EXCEL / CSV
========================================================= */

function exportarExcel() {

    if (
        itens.length ===
        0
    ) {

        alert(
            'Nenhum item cadastrado.'
        );

        return;
    }

    let csv =
        'PATRIMÔNIO;TIPO;NOME;DESCRIÇÃO;QUANTIDADE;LOCAL;STATUS\n';

    itens.forEach(
        item => {

            const local =
                nomeLocal(
                    item.local_id
                );

            const linha = [

                item.patrimonio ||
                    'Estoque',

                item.tipo ||
                    item.nome ||
                    '',

                item.nome ||
                    '',

                item.descricao ||
                    '',

                quantidadeItem(
                    item
                ),

                local,

                item.status ||
                    ''

            ]
                .map(
                    valor =>
                        `"${String(valor)
                            .replace(
                                /"/g,
                                '""'
                            )}"`
                )
                .join(';');

            csv +=
                linha +
                '\n';

        }
    );

    const blob =
        new Blob(
            [
                '\ufeff' +
                csv
            ],
            {

                type:
                    'text/csv;charset=utf-8;'

            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            'a'
        );

    link.href =
        url;

    link.download =
        'inventario-grupo-monte-carlo.csv';

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   INICIALIZAÇÃO DO SISTEMA
========================================================= */

window.addEventListener(
    'load',
    async () => {

        try {

            document.body
                .classList
                .add(
                    'login-mode'
                );

            carregarLocais();

            atualizarMenus();

            atualizarUsuarioInterface();


            /*
               Recupera sessão existente.
            */

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .getSession();

            if (error) {

                console.error(
                    'ERRO GET SESSION:',
                    error
                );

            }


            if (
                data?.session
                    ?.user
            ) {

                usuarioLogado =
                    data.session.user;

                await verificarPerfil();

                document.body
                    .classList
                    .remove(
                        'login-mode'
                    );

                atualizarMenus();

                atualizarUsuarioInterface();

                abrirTela(
                    'dashboardTela',
                    document.getElementById(
                        'menuDashboard'
                    )
                );

                await carregarDashboard();

                await carregarHistorico();

            } else {

                usuarioLogado =
                    null;

                perfilUsuario =
                    null;

                atualizarMenus();

                atualizarUsuarioInterface();

                abrirTela(
                    'loginTela',
                    document.getElementById(
                        'menuLogin'
                    )
                );

            }


            /*
               Observa alterações de autenticação.
            */

            supabaseClient
                .auth
                .onAuthStateChange(
                    async (
                        evento,
                        session
                    ) => {

                        console.log(
                            'AUTH:',
                            evento
                        );

                        if (
                            session?.user
                        ) {

                            usuarioLogado =
                                session.user;

                            await verificarPerfil();

                            document.body
                                .classList
                                .remove(
                                    'login-mode'
                                );

                            atualizarMenus();

                            atualizarUsuarioInterface();

                        } else {

                            usuarioLogado =
                                null;

                            perfilUsuario =
                                null;

                            document.body
                                .classList
                                .add(
                                    'login-mode'
                                );

                            atualizarMenus();

                            atualizarUsuarioInterface();

                        }

                    }
                );


            console.log(
                'Sistema conectado ao Supabase.'
            );

        } catch (erro) {

            console.error(
                'ERRO AO INICIAR SISTEMA:',
                erro
            );

            alert(
                'Erro ao iniciar o sistema.'
            );

        }

    }
);


/* =========================================================
   EVENTOS
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const busca =
            document.getElementById(
                'buscaPublica'
            );

        if (busca) {

            busca.addEventListener(
                'input',
                filtrarConsultaPublica
            );

        }

        const filtroLocal =
            document.getElementById(
                'filtroLocalPublico'
            );

        if (filtroLocal) {

            filtroLocal.addEventListener(
                'change',
                filtrarConsultaPublica
            );

        }
        const filtroCategoria =
    document.getElementById(
        'filtroCategoriaPublico'
    );

if (filtroCategoria) {

    filtroCategoria.addEventListener(
        'change',
        () => {

            paginaConsultaPublica =
                1;

            renderizarConsultaPublica();

        }
    );

}


const ordenacaoPublica =
    document.getElementById(
        'ordenacaoPublico'
    );

if (ordenacaoPublica) {

    ordenacaoPublica.addEventListener(
        'change',
        () => {

            paginaConsultaPublica =
                1;

            renderizarConsultaPublica();

        }
    );

}

        const quantidadeMov =
            document.getElementById(
                'quantidadeMov'
            );

        if (quantidadeMov) {

            quantidadeMov.addEventListener(
                'input',
                atualizarResumoMovimentacao
            );

        }

        const itemMov =
            document.getElementById(
                'itemMov'
            );

        if (itemMov) {

            itemMov.addEventListener(
                'change',
                preencherOrigemAutomaticamente
            );

        }

        const destino =
            document.getElementById(
                'destino'
            );

        if (destino) {

            destino.addEventListener(
                'change',
                atualizarResumoMovimentacao
            );

        }

    }
);


/* =========================================================
   EXPOSIÇÃO DAS FUNÇÕES PARA O HTML
========================================================= */

window.login =
    login;

window.logout =
    logout;

window.abrirTela =
    abrirTela;

window.abrirConsultaPublica =
    abrirConsultaPublica;

window.voltarParaLogin =
    voltarParaLogin;

window.carregarConsultaPublica =
    carregarConsultaPublica;

window.atualizarConsultaPublica =
    atualizarConsultaPublica;

window.filtrarConsultaPublica =
    filtrarConsultaPublica;

window.limparFiltrosConsultaPublica =
    limparFiltrosConsultaPublica;

window.abrirModalFoto =
    abrirModalFoto;

window.fecharModalFoto =
    fecharModalFoto;

window.toggleSidebar =
    toggleSidebar;

window.salvarItem =
    salvarItem;

window.editarItem =
    editarItem;

window.excluirItem =
    excluirItem;

window.movimentarItem =
    movimentarItem;

window.preencherOrigemAutomaticamente =
    preencherOrigemAutomaticamente;

window.atualizarResumoMovimentacao =
    atualizarResumoMovimentacao;

window.filtrarItens =
    filtrarItens;

window.filtrarDashboard =
    filtrarDashboard;

window.exportarExcel =
    exportarExcel;

window.alternarTipoControle =
    alternarTipoControle;

/* =========================================================
   CONSULTA PÚBLICA — AJUSTES FINAIS
   GRUPO MONTE CARLO
========================================================= */

(function () {

    'use strict';


    /* =====================================================
       REFERÊNCIAS
    ===================================================== */

    function el(id) {
        return document.getElementById(id);
    }


    /* =====================================================
       NORMALIZAR TEXTO
    ===================================================== */

    function normalizarConsulta(valor) {

        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

    }


    /* =====================================================
       POPULAR LOCAIS
    ===================================================== */

    function popularLocaisConsulta() {

        const select =
            el('filtroLocalPublico');

        if (!select) {
            return;
        }


        const valorAtual =
            select.value;


        const locais =
            new Map();


        /*
           Utiliza os dados reais da consulta pública.
        */

        if (
            Array.isArray(
                itensConsultaPublica
            )
        ) {

            itensConsultaPublica.forEach(
                item => {

                    const localId =
                        item.local_id;

                    if (
                        localId === null ||
                        localId === undefined ||
                        localId === ''
                    ) {
                        return;
                    }


                    const nome =
                        nomeLocal(
                            localId
                        );


                    if (
                        !nome ||
                        nome === 'SEM LOCAL'
                    ) {
                        return;
                    }


                    locais.set(
                        String(localId),
                        nome
                    );

                }
            );

        }


        select.innerHTML =
            '<option value="">Todos os locais</option>';


        Array.from(
            locais.entries()
        )
        .sort(
            (a, b) =>
                String(a[1]).localeCompare(
                    String(b[1]),
                    'pt-BR',
                    {
                        sensitivity:
                            'base'
                    }
                )
        )
        .forEach(
            ([id, nome]) => {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    id;


                option.textContent =
                    nome;


                select.appendChild(
                    option
                );

            }
        );


        if (
            valorAtual &&
            Array.from(
                select.options
            ).some(
                option =>
                    option.value ===
                    valorAtual
            )
        ) {

            select.value =
                valorAtual;

        }

    }


    /* =====================================================
       POPULAR CATEGORIAS
    ===================================================== */

    function popularCategoriasConsulta() {

        const select =
            el('filtroCategoriaPublico');

        if (!select) {
            return;
        }


        const valorAtual =
            select.value;


        const categorias =
            new Map();


        if (
            Array.isArray(
                itensConsultaPublica
            )
        ) {

            itensConsultaPublica.forEach(
                item => {

                    const categoria =
                        String(
                            item.tipo ||
                            ''
                        )
                        .trim();


                    if (!categoria) {
                        return;
                    }


                    categorias.set(
                        normalizarConsulta(
                            categoria
                        ),
                        categoria
                    );

                }
            );

        }


        select.innerHTML =
            '<option value="">Todas as categorias</option>';


        Array.from(
            categorias.values()
        )
        .sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b),
                    'pt-BR',
                    {
                        sensitivity:
                            'base'
                    }
                )
        )
        .forEach(
            categoria => {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    categoria;


                option.textContent =
                    categoria;


                select.appendChild(
                    option
                );

            }
        );


        if (
            valorAtual &&
            Array.from(
                select.options
            ).some(
                option =>
                    option.value ===
                    valorAtual
            )
        ) {

            select.value =
                valorAtual;

        }

    }


    /* =====================================================
       VISUALIZAÇÃO — CARDS / LISTA
    ===================================================== */

    function configurarVisualizacaoConsulta() {

        const container =
            el(
                'listaConsultaPublica'
            );


        const botaoCards =
            el(
                'consultaViewCards'
            );


        const botaoLista =
            el(
                'consultaViewLista'
            );


        if (
            !container ||
            !botaoCards ||
            !botaoLista
        ) {
            return;
        }


        function aplicarVisualizacao(
            tipo
        ) {

            if (
                tipo ===
                'lista'
            ) {

                container.classList.add(
                    'list-view'
                );


                botaoLista.classList.add(
                    'active'
                );


                botaoCards.classList.remove(
                    'active'
                );


                localStorage.setItem(
                    'consultaVisualizacao',
                    'lista'
                );


            } else {

                container.classList.remove(
                    'list-view'
                );


                botaoCards.classList.add(
                    'active'
                );


                botaoLista.classList.remove(
                    'active'
                );


                localStorage.setItem(
                    'consultaVisualizacao',
                    'cards'
                );

            }

        }


        botaoCards.onclick =
            function () {

                aplicarVisualizacao(
                    'cards'
                );

            };


        botaoLista.onclick =
            function () {

                aplicarVisualizacao(
                    'lista'
                );

            };


        const salva =
            localStorage.getItem(
                'consultaVisualizacao'
            );


        aplicarVisualizacao(
            salva === 'lista'
                ? 'lista'
                : 'cards'
        );

    }


    /* =====================================================
       OBSERVAR ATUALIZAÇÃO DA CONSULTA
    ===================================================== */

    function observarConsulta() {

        const container =
            el(
                'listaConsultaPublica'
            );


        if (!container) {
            return;
        }


        /*
           Quando os cards forem renderizados,
           atualizamos automaticamente os filtros.
        */

        const observer =
            new MutationObserver(
                function () {

                    popularLocaisConsulta();

                    popularCategoriasConsulta();

                }
            );


        observer.observe(
            container,
            {
                childList: true,
                subtree: true
            }
        );

    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    function configurarEventos() {

        const busca =
            el(
                'buscaPublica'
            );


        const local =
            el(
                'filtroLocalPublico'
            );


        const categoria =
            el(
                'filtroCategoriaPublico'
            );


        const ordenacao =
            el(
                'ordenacaoPublica'
            );


        if (busca) {

            busca.addEventListener(
                'input',
                function () {

                    paginaConsultaPublica =
                        1;

                    renderizarConsultaPublica();

                }
            );

        }


        if (local) {

            local.addEventListener(
                'change',
                function () {

                    paginaConsultaPublica =
                        1;

                    renderizarConsultaPublica();

                }
            );

        }


        if (categoria) {

            categoria.addEventListener(
                'change',
                function () {

                    paginaConsultaPublica =
                        1;

                    renderizarConsultaPublica();

                }
            );

        }


        if (ordenacao) {

            ordenacao.addEventListener(
                'change',
                function () {

                    paginaConsultaPublica =
                        1;

                    renderizarConsultaPublica();

                }
            );

        }

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        configurarVisualizacaoConsulta();

        configurarEventos();

        popularLocaisConsulta();

        popularCategoriasConsulta();

        observarConsulta();

    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            iniciar
        );

    } else {

        iniciar();

    }


})();