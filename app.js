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
                resultado
                    ?.data
                    ?.publicUrl ||
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
               o mesmo item no mesmo local.
            */

            const {
                data: existente,
                error: erroBusca
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
                    .eq(
                        'status',
                        status
                    )
                    .is(
                        'patrimonio',
                        null
                    )
                    .maybeSingle();


            if (erroBusca) {

                throw new Error(
                    'Erro ao verificar o estoque: ' +
                    erroBusca.message
                );

            }


            if (existente) {

                const quantidadeAtual =
                    quantidadeItem(
                        existente
                    );


                const novaQuantidade =
                    quantidadeAtual +
                    quantidade;


                const {
                    error
                } =
                    await supabaseClient
                        .from('itens')
                        .update({

                            quantidade:
                                novaQuantidade,

                            tipo:
                                tipo,

                            descricao:
                                descricao,

                            foto_url:
                                fotoUrl ||
                                existente.foto_url ||
                                null

                        })
                        .eq(
                            'id',
                            existente.id
                        );


                if (error) {

                    throw new Error(
                        'Erro ao atualizar estoque: ' +
                        error.message
                    );

                }

            } else {

                const {
                    error
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


                if (error) {

                    throw new Error(
                        'Erro ao salvar estoque: ' +
                        error.message
                    );

                }

            }


            alert(
                quantidade +
                ' unidade(s) cadastrada(s) com sucesso!'
            );

        }


        /* =================================================
           PATRIMÔNIO INDIVIDUAL
        ================================================= */

        else {

            const {
                error
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


            if (error) {

                throw new Error(
                    'Erro ao salvar patrimônio: ' +
                    error.message
                );

            }


            alert(
                'Patrimônio cadastrado com sucesso!'
            );

        }


        limparFormulario();


        await carregarDashboard();


        abrirTela(
            'estoqueTela',
            document.getElementById(
                'menuEstoque'
            )
        );


        return false;


    } catch (erro) {

        console.error(
            'ERRO AO SALVAR:',
            erro
        );


        alert(
            erro?.message ||
            'Erro inesperado ao salvar o cadastro.'
        );


        return false;

    }

}


/* =========================================================
   LIMPAR FORMULÁRIO
========================================================= */

function limparFormulario() {

    const campos = [

        'nome',
        'tipoItem',
        'descricao',
        'local',
        'patrimonioManual',
        'foto'

    ];


    campos.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );

            if (elemento) {

                elemento.value =
                    '';

            }

        }
    );


    const quantidade =
        document.getElementById(
            'quantidadeLote'
        );

    if (quantidade) {

        quantidade.value =
            1;

    }


    const status =
        document.getElementById(
            'status'
        );

    if (status) {

        status.value =
            'Ativo';

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

            console.error(
                'ERRO AO CARREGAR ITENS:',
                error
            );

            return;

        }


        itens =
            data || [];


        const tabela =
            document.getElementById(
                'listaItens'
            );


        const selectMov =
            document.getElementById(
                'itemMov'
            );


        if (tabela) {

            tabela.innerHTML =
                '';

        }


        if (selectMov) {

            selectMov.innerHTML =
                '<option value="">Selecione o Item</option>';

        }


        let total =
            0;

        let baixados =
            0;


        itens.forEach(
            item => {

                const quantidade =
                    quantidadeItem(
                        item
                    );


                total +=
                    quantidade;


                if (
                    item.status ===
                    'Baixado'
                ) {

                    baixados +=
                        quantidade;

                }


                const local =
                    nomeLocal(
                        item.local_id
                    );


                const identificacao =
                    item.patrimonio ||
                    'Estoque';


                const classe =
                    classeStatus(
                        item.status
                    );


                const foto =
                    item.foto_url ||
                    '';


                if (tabela) {

                    const imagem =
                        foto
                            ? `
                                <img
                                    src="${escaparHTML(foto)}"
                                    onclick="abrirModalFoto('${escaparHTML(foto)}')"
                                    alt="Foto do item"
                                >
                              `
                            : `
                                <span>
                                    Sem foto
                                </span>
                              `;


                    const acoes =
                        perfilUsuario ===
                        'consulta'

                            ? '-'

                            : `
                                <div class="actions">

                                    <button
                                        type="button"
                                        class="btn-edit"
                                        onclick="editarItem(${item.id})"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-delete"
                                        onclick="excluirItem(${item.id})"
                                    >
                                        Excluir
                                    </button>

                                </div>
                              `;


                    tabela.innerHTML += `

                        <tr>

                            <td>
                                ${imagem}
                            </td>

                            <td>
                                ${escaparHTML(
                                    identificacao
                                )}
                            </td>

                            <td>
                                ${escaparHTML(
                                    item.tipo ||
                                    item.nome ||
                                    '-'
                                )}
                            </td>

                            <td>
                                ${escaparHTML(
                                    item.nome ||
                                    '-'
                                )}
                            </td>

                            <td>
                                ${escaparHTML(
                                    item.descricao ||
                                    '-'
                                )}
                            </td>

                            <td>
                                ${escaparHTML(
                                    local
                                )}
                            </td>

                            <td>
                                <span
                                    class="status ${classe}"
                                >
                                    ${escaparHTML(
                                        item.status ||
                                        '-'
                                    )}
                                </span>
                            </td>

                            <td>
                                ${acoes}
                            </td>

                        </tr>

                    `;

                }


                if (selectMov) {

                    selectMov.innerHTML += `

                        <option value="${item.id}">

                            ${escaparHTML(
                                identificacao
                            )}
                            -
                            ${escaparHTML(
                                item.nome ||
                                'Item'
                            )}
                            —
                            ${escaparHTML(
                                local
                            )}
                            —
                            ${quantidade}
                            un.

                        </option>

                    `;

                }

            }
        );


        const totalItens =
            document.getElementById(
                'totalItens'
            );

        if (totalItens) {

            totalItens.innerText =
                total;

        }


        const totalBaixados =
            document.getElementById(
                'totalBaixados'
            );

        if (totalBaixados) {

            totalBaixados.innerText =
                baixados;

        }


        const estoqueTotal =
            document.getElementById(
                'estoqueTotal'
            );

        if (estoqueTotal) {

            estoqueTotal.innerText =
                total;

        }


        preencherOrigemAutomaticamente();


    } catch (erro) {

        console.error(
            'ERRO AO CARREGAR ITENS:',
            erro
        );

    }

}


/* =========================================================
   EDITAR ITEM
========================================================= */

async function editarItem(id) {

    if (
        perfilUsuario ===
        'consulta'
    ) {

        alert(
            'Usuário sem permissão.'
        );

        return;

    }


    const item =
        itens.find(
            registro =>
                String(registro.id) ===
                String(id)
        );


    if (!item) {

        alert(
            'Item não encontrado.'
        );

        return;

    }


    const novoNome =
        prompt(
            'Novo nome do item:',
            item.nome || ''
        );


    if (
        novoNome === null ||
        !novoNome.trim()
    ) {

        return;

    }


    const novaDescricao =
        prompt(
            'Descrição:',
            item.descricao || ''
        );


    const {
        error
    } =
        await supabaseClient
            .from('itens')
            .update({

                nome:
                    novoNome.trim(),

                descricao:
                    novaDescricao?.trim() ||
                    item.descricao ||
                    ''

            })
            .eq(
                'id',
                id
            );


    if (error) {

        console.error(
            'ERRO AO EDITAR:',
            error
        );

        alert(
            'Erro ao editar o item.'
        );

        return;

    }


    alert(
        'Item atualizado com sucesso!'
    );


    await carregarDashboard();

}


/* =========================================================
   EXCLUIR ITEM
========================================================= */

async function excluirItem(id) {

    if (
        perfilUsuario ===
        'consulta'
    ) {

        alert(
            'Usuário sem permissão.'
        );

        return;

    }


    const item =
        itens.find(
            registro =>
                String(registro.id) ===
                String(id)
        );


    if (!item) {

        alert(
            'Item não encontrado.'
        );

        return;

    }


    const confirmar =
        confirm(
            'Deseja realmente excluir este registro?\n\n' +
            (
                item.patrimonio
                    ? 'Patrimônio: ' +
                      item.patrimonio
                    : 'Item: ' +
                      item.nome
            )
        );


    if (!confirmar) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from('itens')
            .delete()
            .eq(
                'id',
                id
            );


    if (error) {

        console.error(
            'ERRO AO EXCLUIR:',
            error
        );

        alert(
            'Erro ao excluir o item.'
        );

        return;

    }


    alert(
        'Registro excluído com sucesso!'
    );


    await carregarDashboard();

}


/* =========================================================
   CARREGAR HISTÓRICO
========================================================= */

async function carregarHistorico() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from('movimentacoes')
                .select('*')
                .order(
                    'data',
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            console.error(
                'ERRO HISTÓRICO:',
                error
            );

            return;

        }


        movimentacoes =
            data || [];


        const tabela =
            document.getElementById(
                'historico'
            );


        if (!tabela) {

            return;

        }


        tabela.innerHTML =
            '';


        movimentacoes.forEach(
            movimento => {

                const item =
                    itens.find(
                        registro =>
                            String(
                                registro.id
                            ) ===
                            String(
                                movimento.item_id
                            )
                    );


                const origem =
                    nomeLocal(
                        movimento.origem_id
                    );


                const destino =
                    nomeLocal(
                        movimento.destino_id
                    );


                const quantidade =
                    Number(
                        movimento.quantidade ||
                        1
                    );


                const patrimonio =
                    item?.patrimonio ||
                    'Estoque';


                const nomeItem =
                    item?.nome ||
                    'Item';


                const data =
                    movimento.data
                        ? new Date(
                            movimento.data
                          )
                            .toLocaleString(
                                'pt-BR'
                            )
                        : '-';


                tabela.innerHTML += `

                    <tr>

                        <td>
                            ${escaparHTML(
                                patrimonio
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                nomeItem
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
                            ${quantidade}
                        </td>

                        <td>
                            ${escaparHTML(
                                movimento.observacao ||
                                '-'
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                data
                            )}
                        </td>

                    </tr>

                `;

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
   DASHBOARD - STATUS
========================================================= */

function atualizarDashboardAvancado() {

    const contar =
        status => {

            return itens.reduce(
                (
                    total,
                    item
                ) => {

                    if (
                        item.status ===
                        status
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

        };


    const valores = [

        [
            'dashAtivo',
            'Ativo'
        ],

        [
            'dashManutencao',
            'Em manutenção'
        ],

        [
            'dashBaixado',
            'Baixado'
        ],

        [
            'dashExtraviado',
            'Extraviado'
        ]

    ];


    valores.forEach(
        ([id, status]) => {

            const elemento =
                document.getElementById(
                    id
                );

            if (elemento) {

                elemento.innerText =
                    contar(status);

            }

        }
    );

}


/* =========================================================
   RELATÓRIO POR ITEM E LOCAL
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


    const agrupado =
        {};


    itens.forEach(
        item => {

            const local =
                nomeLocal(
                    item.local_id
                );


            const nomeItem =
                item.nome ||
                item.tipo ||
                'ITEM';


            const chave =
                nomeItem +
                '||' +
                local;


            if (
                !agrupado[chave]
            ) {

                agrupado[chave] = {

                    item:
                        nomeItem,

                    local:
                        local,

                    quantidade:
                        0

                };

            }


            agrupado[chave]
                .quantidade +=
                quantidadeItem(
                    item
                );

        }
    );


    Object.values(
        agrupado
    )
        .sort(
            (a, b) => {

                const localCompare =
                    a.local.localeCompare(
                        b.local
                    );


                if (
                    localCompare !== 0
                ) {

                    return localCompare;

                }


                return a.item.localeCompare(
                    b.item
                );

            }
        )
        .forEach(
            registro => {

                tabela.innerHTML += `

                    <tr>

                        <td>
                            ${escaparHTML(
                                registro.item
                            )}
                        </td>

                        <td
                            data-local="${escaparHTML(
                                registro.local
                                    .toLowerCase()
                            )}"
                        >
                            ${escaparHTML(
                                registro.local
                            )}
                        </td>

                        <td>
                            ${registro.quantidade}
                        </td>

                    </tr>

                `;

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
            ?.toLowerCase()
            ?.trim() || '';


    const localFiltro =
        document
            .getElementById(
                'filtroLocalDashboard'
            )
            ?.value
            ?.toLowerCase()
            ?.trim() || '';


    const linhas =
        document.querySelectorAll(
            '#dashboardLocais tr'
        );


    linhas.forEach(
        linha => {

            const item =
                linha
                    .children[0]
                    ?.innerText
                    ?.toLowerCase() ||
                '';


            const local =
                linha
                    .children[1]
                    ?.dataset
                    ?.local ||
                '';


            const texto =
                item +
                ' ' +
                local;


            const encontrouBusca =
                texto.includes(
                    busca
                );


            const encontrouLocal =
                !localFiltro ||
                local ===
                localFiltro;


            linha.style.display =
                (
                    encontrouBusca &&
                    encontrouLocal
                )
                    ? ''
                    : 'none';

        }
    );

}


/* =========================================================
   FILTRO DE LOCAIS
========================================================= */

function carregarFiltroLocaisDashboard() {

    const select =
        document.getElementById(
            'filtroLocalDashboard'
        );


    if (!select) {

        return;

    }


    select.innerHTML =
        `
            <option value="">
                Todos os Locais
            </option>
        `;


    const locaisOrdenados =
        [...LOCAIS]
            .sort(
                (a, b) =>
                    a.nome.localeCompare(
                        b.nome
                    )
            );


    locaisOrdenados.forEach(
        local => {

            select.innerHTML += `

                <option
                    value="${escaparHTML(
                        local.nome.toLowerCase()
                    )}"
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
   FILTRAR ITENS
========================================================= */

function filtrarItens() {

    const termo =
        document
            .getElementById(
                'busca'
            )
            ?.value
            ?.toLowerCase()
            ?.trim() || '';


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
                    termo
                )
                    ? ''
                    : 'none';

        }
    );

}


/* =========================================================
   DASHBOARD COMPLETO
========================================================= */

async function carregarDashboard() {

    carregarLocais();

    await carregarItens();

    await carregarHistorico();

    atualizarDashboardAvancado();

    gerarRelatorioLocais();

    carregarFiltroLocaisDashboard();

}


/* =========================================================
   MODAL FOTO
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


    if (!modal || !imagem) {

        return;

    }


    imagem.src =
        url;


    modal.classList.add(
        'active'
    );

}


function fecharModalFoto() {

    const modal =
        document.getElementById(
            'modalFoto'
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        'active'
    );

}


/* =========================================================
   ABRIR TELA
========================================================= */

function abrirTela(
    idTela,
    elemento = null
) {

    if (
        !usuarioLogado &&
        idTela !== 'loginTela'
    ) {

        alert(
            'Faça login primeiro.'
        );

        return;

    }


    document
        .querySelectorAll(
            '.tela'
        )
        .forEach(
            tela => {

                tela.classList.remove(
                    'activeTela'
                );

            }
        );


    const tela =
        document.getElementById(
            idTela
        );


    if (tela) {

        tela.classList.add(
            'activeTela'
        );

    }


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
        'cadastroTela'
    ) {

        carregarLocais();

        alternarTipoControle();

    }


    if (
        idTela ===
        'movimentacaoTela'
    ) {

        carregarLocais();

        carregarItens();

    }


    if (
        idTela ===
        'dashboardTela'
    ) {

        carregarDashboard();

    }


    if (
        idTela ===
        'estoqueTela'
    ) {

        carregarItens();

    }


    if (
        idTela ===
        'historicoTela'
    ) {

        carregarItens()
            .then(
                carregarHistorico
            );

    }


    if (
        window.innerWidth <=
        900
    ) {

        document
            .getElementById(
                'sidebar'
            )
            ?.classList
            .remove(
                'open'
            );

    }

}


/* =========================================================
   EXPORTAR CSV
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


    function csv(valor) {

        const texto =
            String(
                valor ??
                ''
            );


        return '"' +
            texto
                .replace(
                    /"/g,
                    '""'
                ) +
            '"';

    }


    let conteudo =
        [
            'PATRIMÔNIO',
            'TIPO',
            'NOME',
            'DESCRIÇÃO',
            'LOCAL',
            'QUANTIDADE',
            'STATUS'
        ]
            .map(csv)
            .join(';') +
        '\n';


    itens.forEach(
        item => {

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

                nomeLocal(
                    item.local_id
                ),

                quantidadeItem(
                    item
                ),

                item.status ||
                    ''

            ];


            conteudo +=
                linha
                    .map(csv)
                    .join(';') +
                '\n';

        }
    );


    const blob =
        new Blob(
            [
                '\ufeff' +
                conteudo
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
        'inventario-monte-carlo.csv';


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


    sidebar.classList.toggle(
        'open'
    );

}


/* =========================================================
   PREENCHER ORIGEM DA MOVIMENTAÇÃO
========================================================= */

function preencherOrigemAutomaticamente() {

    const select =
        document.getElementById(
            'itemMov'
        );


    const origem =
        document.getElementById(
            'origemNome'
        );


    if (
        !select ||
        !origem
    ) {

        return;

    }


    const item =
        itens.find(
            registro =>
                String(
                    registro.id
                ) ===
                String(
                    select.value
                )
        );


    if (!item) {

        origem.value =
            '';

        return;

    }


    origem.value =
        nomeLocal(
            item.local_id
        );


    const quantidadeCampo =
        document.getElementById(
            'quantidadeMov'
        );


    if (
        quantidadeCampo
    ) {

        const disponivel =
            quantidadeItem(
                item
            );


        quantidadeCampo.max =
            disponivel;


        if (
            item.patrimonio
        ) {

            quantidadeCampo.value =
                1;

        } else {

            const valorAtual =
                parseInt(
                    quantidadeCampo.value ||
                    '1',
                    10
                );


            quantidadeCampo.value =
                Math.min(
                    Math.max(
                        1,
                        valorAtual
                    ),
                    disponivel
                );

        }

    }

}


/* =========================================================
   MOVIMENTAÇÃO
========================================================= */

async function movimentarItem() {

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
            'Usuário sem permissão para movimentar itens.'
        );

        return;

    }


    try {

        const itemId =
            document.getElementById(
                'itemMov'
            )?.value ||
            '';


        const destinoId =
            document.getElementById(
                'destino'
            )?.value ||
            '';


        const quantidadeCampo =
            document.getElementById(
                'quantidadeMov'
            );


        const quantidadeSolicitada =
            Math.max(
                1,
                parseInt(
                    quantidadeCampo?.value ||
                    '1',
                    10
                )
            );


        const statusNovo =
            document.getElementById(
                'statusMov'
            )?.value ||
            '';


        const observacao =
            document.getElementById(
                'observacaoMov'
            )?.value
            ?.trim() ||
            '';


        if (!itemId) {

            alert(
                'Selecione o item.'
            );

            return;

        }


        if (!destinoId) {

            alert(
                'Selecione o destino.'
            );

            return;

        }


        const item =
            itens.find(
                registro =>
                    String(
                        registro.id
                    ) ===
                    String(
                        itemId
                    )
            );


        if (!item) {

            alert(
                'Item não encontrado.'
            );

            return;

        }


        const origemId =
            Number(
                item.local_id
            );


        const novoDestinoId =
            Number(
                destinoId
            );


        if (
            origemId ===
            novoDestinoId
        ) {

            alert(
                'O destino precisa ser diferente do local atual.'
            );

            return;

        }


        const quantidadeAtual =
            quantidadeItem(
                item
            );


        /*
           Patrimônio individual:
           sempre movimenta 1 unidade.
        */

        const quantidadeMovimentar =
            item.patrimonio
                ? 1
                : quantidadeSolicitada;


        if (
            quantidadeMovimentar >
            quantidadeAtual
        ) {

            alert(
                'Quantidade indisponível.\n\n' +
                'Disponível: ' +
                quantidadeAtual +
                ' unidade(s).'
            );

            return;

        }


        const novoStatus =
            statusNovo ||
            item.status ||
            'Ativo';


        /* =================================================
           CASO 1:
           MOVIMENTAÇÃO TOTAL
        ================================================= */

        if (
            item.patrimonio ||
            quantidadeMovimentar ===
            quantidadeAtual
        ) {

            const {
                error
            } =
                await supabaseClient
                    .from('itens')
                    .update({

                        local_id:
                            novoDestinoId,

                        status:
                            novoStatus

                    })
                    .eq(
                        'id',
                        item.id
                    );


            if (error) {

                throw error;

            }

        }


        /* =================================================
           CASO 2:
           MOVIMENTAÇÃO PARCIAL
        ================================================= */

        else {

            const quantidadeRestante =
                quantidadeAtual -
                quantidadeMovimentar;


            /*
               Primeiro reduzimos o estoque
               na origem.
            */

            const {
                error:
                    erroReducao
            } =
                await supabaseClient
                    .from('itens')
                    .update({

                        quantidade:
                            quantidadeRestante

                    })
                    .eq(
                        'id',
                        item.id
                    );


            if (erroReducao) {

                throw erroReducao;

            }


            /*
               Depois criamos o registro
               correspondente ao destino.
            */

            const {
                error:
                    erroDestino
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
                            novoDestinoId,

                        quantidade:
                            quantidadeMovimentar,

                        status:
                            novoStatus,

                        foto_url:
                            item.foto_url ||
                            null

                    }]);


            /*
               Se a criação no destino falhar,
               tentamos restaurar a quantidade
               original.
            */

            if (erroDestino) {

                await supabaseClient
                    .from('itens')
                    .update({

                        quantidade:
                            quantidadeAtual

                    })
                    .eq(
                        'id',
                        item.id
                    );


                throw erroDestino;

            }

        }


        /* =================================================
           HISTÓRICO
        ================================================= */

        const {
            error:
                erroHistorico
        } =
            await supabaseClient
                .from('movimentacoes')
                .insert([{

                    item_id:
                        Number(
                            item.id
                        ),

                    origem_id:
                        origemId,

                    destino_id:
                        novoDestinoId,

                    quantidade:
                        quantidadeMovimentar,

                    observacao:
                        observacao,

                    data:
                        new Date()
                            .toISOString()

                }]);


        if (erroHistorico) {

            console.error(
                'ERRO AO SALVAR HISTÓRICO:',
                erroHistorico
            );

        }


        alert(
            quantidadeMovimentar +
            ' unidade(s) movimentada(s) com sucesso!'
        );


        limparFormularioMovimentacao();


        await carregarDashboard();

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

    }

}


/* =========================================================
   LIMPAR FORMULÁRIO DE MOVIMENTAÇÃO
========================================================= */

function limparFormularioMovimentacao() {

    const valores = {

        itemMov:
            '',

        destino:
            '',

        quantidadeMov:
            1,

        statusMov:
            '',

        observacaoMov:
            '',

        origemNome:
            ''

    };


    Object.entries(
        valores
    )
        .forEach(
            ([id, valor]) => {

                const elemento =
                    document.getElementById(
                        id
                    );


                if (elemento) {

                    elemento.value =
                        valor;

                }

            }
        );

}


/* =========================================================
   EVENTO DO ITEM DE MOVIMENTAÇÃO
========================================================= */

document.addEventListener(
    'change',
    function (event) {

        if (
            event.target &&
            event.target.id ===
            'itemMov'
        ) {

            preencherOrigemAutomaticamente();

        }


        if (
            event.target &&
            event.target.name ===
            'tipoControle'
        ) {

            alternarTipoControle();

        }

    }
);


/* =========================================================
   EVENTOS DOS FORMULÁRIOS
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const loginForm =
            document.getElementById(
                'loginForm'
            );


        if (loginForm) {

            loginForm.addEventListener(
                'submit',
                login
            );

        }


        const cadastroForm =
            document.getElementById(
                'cadastroForm'
            );


        if (cadastroForm) {

            cadastroForm.addEventListener(
                'submit',
                salvarItem
            );

        }


        const radios =
            document.querySelectorAll(
                'input[name="tipoControle"]'
            );


        radios.forEach(
            radio => {

                radio.addEventListener(
                    'change',
                    alternarTipoControle
                );

            }
        );


        alternarTipoControle();

    }
);


/* =========================================================
   TECLA ESC - FECHAR FOTO
========================================================= */

document.addEventListener(
    'keydown',
    function (event) {

        if (
            event.key ===
            'Escape'
        ) {

            fecharModalFoto();

        }

    }
);


/* =========================================================
   CLICK FORA DO MODAL
========================================================= */

document.addEventListener(
    'click',
    function (event) {

        const modal =
            document.getElementById(
                'modalFoto'
            );


        if (
            modal &&
            event.target ===
            modal
        ) {

            fecharModalFoto();

        }

    }
);


/* =========================================================
   ATUALIZAÇÃO AUTOMÁTICA
========================================================= */

setInterval(
    async function () {

        if (!usuarioLogado) {

            return;

        }


        try {

            await carregarItens();

            atualizarDashboardAvancado();

            gerarRelatorioLocais();

        } catch (erro) {

            console.error(
                'ERRO AUTO REFRESH:',
                erro
            );

        }

    },
    30000
);


/* =========================================================
   INICIALIZAÇÃO DO SISTEMA
========================================================= */

async function inicializarSistema() {

    try {

        carregarLocais();

        carregarFiltroLocaisDashboard();

        alternarTipoControle();


        /*
           Primeiro verificamos a sessão existente.
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
                'ERRO AO VERIFICAR SESSÃO:',
                error
            );

        }


        if (
            data?.session
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


            abrirTela(
                'loginTela'
            );

        }


        /*
           Observa mudanças futuras
           de autenticação.
        */

        supabaseClient
            .auth
            .onAuthStateChange(
                async function (
                    evento,
                    session
                ) {

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
            '======================================'
        );

        console.log(
            ' SISTEMA DE INVENTÁRIO INICIADO'
        );

        console.log(
            ' SUPABASE ONLINE'
        );

        console.log(
            '======================================'
        );


    } catch (erro) {

        console.error(
            'ERRO AO INICIAR SISTEMA:',
            erro
        );


        document.body
            .classList
            .add(
                'login-mode'
            );

    }

}


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    inicializarSistema
);