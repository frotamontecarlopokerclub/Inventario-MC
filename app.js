/* =====================================================
   SISTEMA DE INVENTÁRIO
   GRUPO MONTE CARLO
   APP.JS — VERSÃO CORRIGIDA
===================================================== */


/* =====================================================
   CONFIGURAÇÃO SUPABASE
===================================================== */

const SUPABASE_URL =
    'https://sxmimxomehdhyifqsgqa.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_NbyYYTsRnSqu_TMpQvzS6A_rJuyzq9_';


/* =====================================================
   CLIENTE SUPABASE
===================================================== */

let supabaseClient = null;

if (
    window.supabase &&
    typeof window.supabase.createClient === 'function'
) {

    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    window.supabaseClient =
        supabaseClient;

} else {

    console.error(
        'Biblioteca Supabase não carregada.'
    );

}


/* =====================================================
   VARIÁVEIS GLOBAIS
===================================================== */

let usuarioLogado = null;

let perfilUsuario = null;

let itens = [];

let movimentacoes = [];

let sistemaInicializado = false;


/* =====================================================
   LOCAIS FIXOS
   GRUPO MONTE CARLO
===================================================== */

const LOCAIS = [

    {
        id: 1,
        nome: 'CASA 1 CHEFIA'
    },

    {
        id: 2,
        nome: 'CASA 2 CHEFIA'
    },

    {
        id: 3,
        nome: 'CASA 3 CHEFIA'
    },

    {
        id: 4,
        nome: 'CASA 1 DOS FUNCIONARIOS'
    },

    {
        id: 5,
        nome: 'CASA 2 DOS FUNCIONARIOS'
    },

    {
        id: 6,
        nome: 'CASA 3 DOS FUNCIONARIOS'
    },

    {
        id: 7,
        nome: 'CASA 4 DOS FUNCIONARIOS'
    },

    {
        id: 8,
        nome: 'CONSERTO'
    },

    {
        id: 9,
        nome: 'CD1'
    },

    {
        id: 10,
        nome: 'CD2'
    },

    {
        id: 11,
        nome: 'CD3'
    },

    {
        id: 12,
        nome: 'DORYO'
    },

    {
        id: 13,
        nome: 'ESCRITÓRIO 1'
    },

    {
        id: 14,
        nome: 'ESCRITÓRIO 2'
    },

    {
        id: 15,
        nome: 'ESCRITÓRIO 3'
    },

    {
        id: 16,
        nome: 'ESTACIONAMENTO 1'
    },

    {
        id: 17,
        nome: 'ESTACIONAMENTO 2'
    },

    {
        id: 18,
        nome: 'ESTACIONAMENTO 3'
    },

    {
        id: 19,
        nome: 'M.C.'
    },

    {
        id: 20,
        nome: 'M.G.'
    },

    {
        id: 21,
        nome: 'DESCARTE/BAIXA TOTAL'
];


/* =====================================================
   UTILITÁRIOS
===================================================== */

function normalizarTexto(texto) {

    return String(texto || '')
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .toLowerCase()
        .trim();

}


function escaparHTML(valor) {

    return String(valor ?? '')
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}


function obterNomeLocal(id) {

    const local =
        LOCAIS.find(
            item =>
                String(item.id) ===
                String(id)
        );

    return (
        local?.nome ||
        'SEM LOCAL'
    );

}


/* =====================================================
   PERMISSÕES
===================================================== */

function usuarioPodeGerenciar() {

    return (
        !!usuarioLogado &&
        !!perfilUsuario &&
        normalizarTexto(
            perfilUsuario
        ) !== 'consulta'
    );

}


function exigirPermissaoGestor() {

    if (
        !usuarioPodeGerenciar()
    ) {

        alert(
            'Usuário sem permissão para realizar esta operação.'
        );

        return false;

    }

    return true;

}


/* =====================================================
   ATUALIZAR MENUS
===================================================== */

function atualizarMenus() {

    const menus = {

        login:
            document.getElementById(
                'menuLogin'
            ),

        dashboard:
            document.getElementById(
                'menuDashboard'
            ),

        cadastro:
            document.getElementById(
                'menuCadastro'
            ),

        movimentacao:
            document.getElementById(
                'menuMovimentacao'
            ),

        estoque:
            document.getElementById(
                'menuEstoque'
            ),

        historico:
            document.getElementById(
                'menuHistorico'
            ),

        logout:
            document.getElementById(
                'menuLogout'
            )

    };


    /*
       PRIMEIRO ESCONDE TUDO
    */

    Object.values(
        menus
    ).forEach(
        menu => {

            if (menu) {

                menu.style.display =
                    'none';

            }

        }
    );


    /*
       SEM LOGIN
    */

    if (!usuarioLogado) {

        if (menus.login) {

            menus.login.style.display =
                'flex';

        }

        /*
           Garante que o sidebar fique
           escondido na tela de login.
        */

        const sidebar =
            document.getElementById(
                'sidebar'
            );

        const overlay =
            document.getElementById(
                'sidebarOverlay'
            );

        if (sidebar) {

            sidebar.classList.remove(
                'sidebar-open'
            );

            sidebar.classList.add(
                'sidebar-login-hidden'
            );

        }

        if (overlay) {

            overlay.classList.remove(
                'show'
            );

        }

        return;

    }


    /*
       USUÁRIO LOGADO
    */

    const sidebar =
        document.getElementById(
            'sidebar'
        );

    if (sidebar) {

        sidebar.classList.remove(
            'sidebar-login-hidden'
        );

    }


    if (menus.dashboard) {

        menus.dashboard.style.display =
            'flex';

    }


    if (menus.estoque) {

        menus.estoque.style.display =
            'flex';

    }


    if (menus.historico) {

        menus.historico.style.display =
            'flex';

    }


    if (menus.logout) {

        menus.logout.style.display =
            'flex';

    }


    /*
       PERFIL CONSULTA
    */

    if (
        normalizarTexto(
            perfilUsuario
        ) === 'consulta'
    ) {

        if (menus.cadastro) {

            menus.cadastro.style.display =
                'none';

        }

        if (menus.movimentacao) {

            menus.movimentacao.style.display =
                'none';

        }

    } else {

        /*
           GESTOR / ADMIN / OUTROS PERFIS
        */

        if (menus.cadastro) {

            menus.cadastro.style.display =
                'flex';

        }

        if (menus.movimentacao) {

            menus.movimentacao.style.display =
                'flex';

        }

    }


    atualizarUsuarioInterface();

}


/* =====================================================
   INTERFACE DO USUÁRIO
===================================================== */

function atualizarUsuarioInterface() {

    const nome =
        usuarioLogado?.email ||
        'Visitante';

    const perfil =
        perfilUsuario ||
        'Acesso restrito';


    const usuarioNome =
        document.getElementById(
            'usuarioNome'
        );

    const usuarioPerfil =
        document.getElementById(
            'usuarioPerfil'
        );

    const topbarUserName =
        document.getElementById(
            'topbarUserName'
        );

    const topbarUserRole =
        document.getElementById(
            'topbarUserRole'
        );


    if (usuarioNome) {

        usuarioNome.innerText =
            nome;

    }


    if (usuarioPerfil) {

        usuarioPerfil.innerText =
            perfil;

    }


    if (topbarUserName) {

        topbarUserName.innerText =
            nome;

    }


    if (topbarUserRole) {

        topbarUserRole.innerText =
            perfil;

    }

}


/* =====================================================
   ABRIR TELA
===================================================== */

function abrirTela(
    idTela,
    elemento = null
) {

    /*
       BLOQUEIO SEM LOGIN
    */

    if (
        !usuarioLogado &&
        idTela !== 'loginTela'
    ) {

        alert(
            'Faça login primeiro!'
        );

        return;

    }


    /*
       BLOQUEIO CONSULTA
    */

    if (
        usuarioLogado &&
        !usuarioPodeGerenciar() &&
        (
            idTela === 'cadastroTela' ||
            idTela === 'movimentacaoTela'
        )
    ) {

        alert(
            'Seu perfil é somente Consulta.'
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


    /*
       ESCONDER TODAS
    */

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


    /*
       MOSTRAR SELECIONADA
    */

    tela.classList.add(
        'activeTela'
    );


    /*
       ATUALIZAR MENU
    */

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


    /*
       TÍTULO
    */

    atualizarTituloTela(
        idTela
    );


    /*
       GARANTIR LOCAIS
    */

    carregarLocais();

    carregarFiltroLocaisDashboard();


    /*
       AÇÕES ESPECÍFICAS
    */

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
                () =>
                    carregarHistorico()
            );

    }


    if (
        idTela ===
        'movimentacaoTela'
    ) {

        carregarItens()
            .then(
                () => {

                    carregarLocais();

                    preencherOrigemAutomaticamente();

                }
            );

    }


    /*
       MOBILE
    */

    if (
        window.innerWidth <= 900
    ) {

        toggleSidebar(
            false
        );

    }

}


/* =====================================================
   TÍTULOS
===================================================== */

function atualizarTituloTela(
    id
) {

    const titles = {

        loginTela: [
            'Sistema',
            'Inventário Central Grupo Monte Carlo'
        ],

        dashboardTela: [
            'Dashboard',
            'Dashboard'
        ],

        cadastroTela: [
            'Inventário',
            'Cadastro'
        ],

        movimentacaoTela: [
            'Logística',
            'Movimentações'
        ],

        estoqueTela: [
            'Inventário',
            'Estoque'
        ],

        historicoTela: [
            'Rastreabilidade',
            'Histórico'
        ]

    };


    const dados =
        titles[id] ||
        [
            'Sistema',
            'Inventário Central Grupo Monte Carlo'
        ];


    const breadcrumb =
        document.getElementById(
            'breadcrumb'
        );

    const title =
        document.getElementById(
            'pageTitle'
        );


    if (breadcrumb) {

        breadcrumb.innerText =
            dados[0];

    }


    if (title) {

        title.innerText =
            dados[1];

    }

}


/* =====================================================
   SIDEBAR MOBILE
===================================================== */

function toggleSidebar(
    force = null
) {

    const sidebar =
        document.getElementById(
            'sidebar'
        );

    const overlay =
        document.getElementById(
            'sidebarOverlay'
        );


    if (!sidebar) {

        return;

    }


    /*
       Nunca abre o sidebar
       enquanto estiver deslogado.
    */

    if (
        !usuarioLogado
    ) {

        sidebar.classList.remove(
            'sidebar-open'
        );

        if (overlay) {

            overlay.classList.remove(
                'show'
            );

        }

        return;

    }


    let abrir =
        force;


    if (
        abrir === null
    ) {

        abrir =
            !sidebar.classList.contains(
                'sidebar-open'
            );

    }


    sidebar.classList.toggle(
        'sidebar-open',
        abrir
    );


    if (overlay) {

        overlay.classList.toggle(
            'show',
            abrir
        );

    }

}


/* =====================================================
   LOGIN
===================================================== */

async function login() {

    if (!supabaseClient) {

        alert(
            'Supabase não foi inicializado.'
        );

        return;

    }


    const email =
        document.getElementById(
            'email'
        )?.value
            ?.trim();


    /*
       Seu HTML atual utiliza "senha".
       Mantemos compatibilidade caso
       esteja usando "password".
    */

    const senha =
        document.getElementById(
            'senha'
        )?.value ||
        document.getElementById(
            'password'
        )?.value ||
        '';


    if (
        !email ||
        !senha
    ) {

        alert(
            'Informe e-mail e senha.'
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        senha

                });


        if (error) {

            console.error(
                'Erro de login:',
                error
            );

            alert(
                'Erro ao entrar:\n' +
                error.message
            );

            return;

        }


        usuarioLogado =
            data?.user ||
            null;


        /*
           Busca o perfil antes
           de liberar o sistema.
        */

        await verificarPerfil();


        if (
            !perfilUsuario
        ) {

            await supabaseClient
                .auth
                .signOut();


            usuarioLogado =
                null;


            atualizarMenus();


            abrirTela(
                'loginTela',
                document.getElementById(
                    'menuLogin'
                )
            );


            alert(
                'Usuário autenticado, porém não possui um perfil válido cadastrado na tabela usuarios.'
            );

            return;

        }


        /*
           Login concluído.
        */

        atualizarMenus();

        atualizarUsuarioInterface();

        carregarLocais();

        carregarFiltroLocaisDashboard();


        abrirTela(
            'dashboardTela',
            document.getElementById(
                'menuDashboard'
            )
        );


        await carregarDashboard();


    } catch (err) {

        console.error(
            'Erro inesperado no login:',
            err
        );

        alert(
            'Erro inesperado ao realizar login.'
        );

    }

}


/* =====================================================
   VERIFICAR PERFIL
===================================================== */

async function verificarPerfil() {

    perfilUsuario =
        null;


    if (
        !usuarioLogado ||
        !supabaseClient
    ) {

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
                    'id',
                    usuarioLogado.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                'Erro ao consultar perfil:',
                error
            );

            return;

        }


        perfilUsuario =
            data?.perfil ||
            null;


    } catch (err) {

        console.error(
            'Erro ao verificar perfil:',
            err
        );

    }

}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    if (!supabaseClient) {

        return;

    }


    try {

        await supabaseClient
            .auth
            .signOut();


    } catch (err) {

        console.error(
            'Erro ao sair:',
            err
        );

    }

}


/* =====================================================
   LOCAIS
===================================================== */

function carregarLocaisBanco() {

    /*
       Os locais são fixos.
       Não dependem da tabela locais
       do Supabase.
    */

    carregarLocais();

    carregarFiltroLocaisDashboard();

}


/* =====================================================
   CARREGAR LOCAIS NOS SELECTS
===================================================== */

function carregarLocais() {

    /*
       CADASTRO
    */

    const local =
        document.getElementById(
            'local'
        );


    if (local) {

        const valorAtual =
            local.value;


        local.innerHTML =
            '';


        const primeiraOpcao =
            document.createElement(
                'option'
            );


        primeiraOpcao.value =
            '';


        primeiraOpcao.textContent =
            'Selecione o Local';


        local.appendChild(
            primeiraOpcao
        );


        LOCAIS.forEach(
            item => {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    String(
                        item.id
                    );


                option.textContent =
                    item.nome;


                local.appendChild(
                    option
                );

            }
        );


        /*
           Preserva seleção quando
           possível.
        */

        if (
            valorAtual &&
            LOCAIS.some(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        valorAtual
                    )
            )
        ) {

            local.value =
                valorAtual;

        }

    }


    /*
       DESTINO
    */

    const destino =
        document.getElementById(
            'destino'
        );


    if (destino) {

        const valorAtual =
            destino.value;


        destino.innerHTML =
            '';


        const primeiraOpcao =
            document.createElement(
                'option'
            );


        primeiraOpcao.value =
            '';


        primeiraOpcao.textContent =
            'Selecione o Destino';


        destino.appendChild(
            primeiraOpcao
        );


        LOCAIS.forEach(
            item => {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    String(
                        item.id
                    );


                option.textContent =
                    item.nome;


                destino.appendChild(
                    option
                );

            }
        );


        if (
            valorAtual &&
            LOCAIS.some(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        valorAtual
                    )
            )
        ) {

            destino.value =
                valorAtual;

        }

    }


    /*
       TOTAL DE LOCAIS
    */

    const totalLocais =
        document.getElementById(
            'totalLocais'
        );


    if (totalLocais) {

        totalLocais.innerText =
            LOCAIS.length;

    }

}


/* =====================================================
   FILTRO DE LOCAIS DO DASHBOARD
===================================================== */

function carregarFiltroLocaisDashboard() {

    const select =
        document.getElementById(
            'filtroLocalDashboard'
        );


    if (!select) {

        return;

    }


    const valorAtual =
        select.value;


    select.innerHTML =
        '';


    const todos =
        document.createElement(
            'option'
        );


    todos.value =
        '';


    todos.textContent =
        'Todos os Locais';


    select.appendChild(
        todos
    );


    [
        ...LOCAIS
    ]
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

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    normalizarTexto(
                        local.nome
                    );


                option.textContent =
                    local.nome;


                select.appendChild(
                    option
                );

            }
        );


    if (
        valorAtual
    ) {

        select.value =
            valorAtual;

    }

}


/* =====================================================
   TIPO DE CONTROLE
===================================================== */

function obterTipoControleCadastro() {

    const radio =
        document.querySelector(
            'input[name="tipoControle"]:checked'
        );


    return (
        radio?.value ||
        'estoque'
    );

}


/* =====================================================
   VERIFICAR SE É ESTOQUE
===================================================== */

function itemEhEstoque(
    item
) {

    if (!item) {

        return false;

    }


    const controle =
        normalizarTexto(
            item.controle
        );


    const tipoControle =
        normalizarTexto(
            item.tipo_controle
        );


    /*
       Registros antigos sem patrimônio
       continuam sendo tratados como estoque.
    */

    return (
        controle === 'estoque' ||
        tipoControle === 'estoque' ||
        String(
            item.patrimonio ||
            ''
        ).trim() === ''
    );

}


/* =====================================================
   ALTERNAR TIPO DE CONTROLE
===================================================== */

function alternarTipoControle() {

    const tipo =
        obterTipoControleCadastro();


    const quantidade =
        document.getElementById(
            'quantidadeLote'
        );


    const campoQuantidade =
        document.getElementById(
            'campoQuantidade'
        );


    if (
        tipo ===
        'patrimonio'
    ) {

        if (quantidade) {

            quantidade.value =
                '1';

        }


        if (campoQuantidade) {

            campoQuantidade.style.display =
                'none';

        }

    } else {

        if (campoQuantidade) {

            campoQuantidade.style.display =
                '';

        }

    }

}


/* =====================================================
   GERAR NÚMERO DE PATRIMÔNIO
===================================================== */

function gerarNumeroPatrimonio() {

    if (
        !itens.length
    ) {

        return 0;

    }


    const numeros =
        itens.map(
            item =>
                parseInt(
                    item.patrimonio,
                    10
                ) ||
                0
        );


    return Math.max(
        ...numeros
    );

}


/* =====================================================
   GRUPO DE ESTOQUE
===================================================== */

function obterGrupoEstoque(
    item
) {

    if (!item) {

        return [];

    }


    return itens.filter(
        i => {

            return (
                itemEhEstoque(i) &&
                normalizarTexto(
                    i.nome
                ) ===
                normalizarTexto(
                    item.nome
                ) &&
                String(
                    i.local_id
                ) ===
                String(
                    item.local_id
                )
            );

        }
    );

}


/* =====================================================
   SALVAR ITEM
===================================================== */

async function salvarItem() {

    if (
        !exigirPermissaoGestor()
    ) {

        return;

    }


    if (!supabaseClient) {

        alert(
            'Supabase não está disponível.'
        );

        return;

    }


    /*
       GARANTIR QUE OS LOCAIS
       ESTEJAM CARREGADOS
    */

    carregarLocais();


    try {

        const nome =
            document.getElementById(
                'nome'
            )
                ?.value
                ?.trim() ||
            '';


        const descricao =
            document.getElementById(
                'descricao'
            )
                ?.value
                ?.trim() ||
            '';


        const tipo =
            document.getElementById(
                'tipoItem'
            )
                ?.value
                ?.trim() ||
            nome;


        const quantidade =
            parseInt(
                document.getElementById(
                    'quantidadeLote'
                )
                    ?.value ||
                '1',
                10
            );


        const local_id =
            document.getElementById(
                'local'
            )
                ?.value ||
            '';


        const status =
            document.getElementById(
                'status'
            )
                ?.value ||
            'Ativo';


        const fotoInput =
            document.getElementById(
                'foto'
            );


        const arquivo =
            fotoInput
                ?.files
                ?. [0] ||
            null;


        const controle =
            obterTipoControleCadastro();


        if (!nome) {

            alert(
                'Informe o nome do item.'
            );

            return;

        }


        if (!local_id) {

            alert(
                'Selecione o local.'
            );

            return;

        }


        if (
            !Number.isInteger(
                quantidade
            ) ||
            quantidade < 1
        ) {

            alert(
                'A quantidade deve ser igual ou maior que 1.'
            );

            return;

        }


        /*
           FOTO
        */

        let foto_url =
            '';


        if (arquivo) {

            const extensao =
                arquivo.name
                    .split('.')
                    .pop()
                    ?.toLowerCase() ||
                'jpg';


            const nomeArquivo =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}.${extensao}`;


            const {
                error:
                    uploadError
            } =
                await supabaseClient
                    .storage
                    .from(
                        'inventario'
                    )
                    .upload(
                        nomeArquivo,
                        arquivo,
                        {
                            upsert:
                                true
                        }
                    );


            if (
                uploadError
            ) {

                console.error(
                    uploadError
                );

                alert(
                    'Erro ao enviar a imagem:\n' +
                    uploadError.message
                );

                return;

            }


            const {
                data:
                    urlData
            } =
                supabaseClient
                    .storage
                    .from(
                        'inventario'
                    )
                    .getPublicUrl(
                        nomeArquivo
                    );


            foto_url =
                urlData
                    ?.publicUrl ||
                '';

        }


        /*
           ESTOQUE
        */

        if (
            controle ===
            'estoque'
        ) {

            const lote =
                [];


            /*
               Cada unidade fica
               como registro separado.
               Não recebe patrimônio.
            */

            for (
                let i = 0;
                i < quantidade;
                i++
            ) {

                lote.push({

                    patrimonio:
                        '',

                    nome:
                        nome,

                    tipo:
                        tipo,

                    descricao:
                        descricao,

                    local_id:
                        Number(
                            local_id
                        ),

                    status:
                        status,

                    foto_url:
                        foto_url,

                    controle:
                        'Estoque'

                });

            }


            const {
                error
            } =
                await supabaseClient
                    .from(
                        'itens'
                    )
                    .insert(
                        lote
                    );


            if (error) {

                console.error(
                    'Erro ao inserir estoque:',
                    error
                );

                alert(
                    'Erro ao salvar estoque:\n' +
                    error.message
                );

                return;

            }


            alert(
                `${quantidade} unidade(s) de "${nome}" cadastrada(s) com sucesso!`
            );


        } else {

            /*
               PATRIMÔNIO INDIVIDUAL
            */

            let maiorNumero =
                gerarNumeroPatrimonio();


            const lote =
                [];


            for (
                let i = 1;
                i <= quantidade;
                i++
            ) {

                maiorNumero++;


                lote.push({

                    patrimonio:
                        String(
                            maiorNumero
                        )
                            .padStart(
                                4,
                                '0'
                            ),

                    nome:
                        nome,

                    tipo:
                        tipo,

                    descricao:
                        descricao,

                    local_id:
                        Number(
                            local_id
                        ),

                    status:
                        status,

                    foto_url:
                        foto_url,

                    controle:
                        'Patrimônio'

                });

            }


            const {
                error
            } =
                await supabaseClient
                    .from(
                        'itens'
                    )
                    .insert(
                        lote
                    );


            if (error) {

                console.error(
                    'Erro ao inserir patrimônio:',
                    error
                );

                alert(
                    'Erro ao salvar patrimônio:\n' +
                    error.message
                );

                return;

            }


            alert(
                `${quantidade} patrimônio(s) cadastrado(s) com sucesso!`
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


    } catch (err) {

        console.error(
            'Erro inesperado ao cadastrar:',
            err
        );

        alert(
            'Erro inesperado ao cadastrar item.'
        );

    }

}


/* =====================================================
   LIMPAR FORMULÁRIO
===================================================== */

function limparFormulario() {

    [
        'nome',
        'tipoItem',
        'descricao',
        'foto'
    ]
        .forEach(
            id => {

                const campo =
                    document.getElementById(
                        id
                    );


                if (campo) {

                    campo.value =
                        '';

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


    const quantidade =
        document.getElementById(
            'quantidadeLote'
        );


    if (quantidade) {

        quantidade.value =
            '1';

    }


    const estoque =
        document.getElementById(
            'controleEstoque'
        );


    if (estoque) {

        estoque.checked =
            true;

    }


    alternarTipoControle();

}


/* =====================================================
   CARREGAR ITENS
===================================================== */

async function carregarItens() {

    if (
        !supabaseClient
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    'itens'
                )
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
                'Erro ao carregar itens:',
                error
            );

            return;

        }


        itens =
            data ||
            [];


        renderizarEstoque();

        preencherItensMovimentacao();

        atualizarDashboardAvancado();

        gerarRelatorioLocais();


    } catch (err) {

        console.error(
            'Erro inesperado ao carregar itens:',
            err
        );

    }

}


/* =====================================================
   RENDERIZAR ESTOQUE
===================================================== */

function renderizarEstoque() {

    const tabela =
        document.getElementById(
            'listaItens'
        );


    const itemMov =
        document.getElementById(
            'itemMov'
        );


    if (tabela) {

        tabela.innerHTML =
            '';

    }


    if (itemMov) {

        itemMov.innerHTML = `
            <option value="">
                Selecione o item
            </option>
        `;

    }


    const gruposEstoque =
        {};


    const registrosPatrimonio =
        [];


    itens.forEach(
        item => {

            if (
                itemEhEstoque(
                    item
                )
            ) {

                const chave =
                    `${normalizarTexto(item.nome)}||${normalizarTexto(item.tipo || item.nome)}||${item.local_id}`;


                if (
                    !gruposEstoque[
                        chave
                    ]
                ) {

                    gruposEstoque[
                        chave
                    ] = {

                        item:
                            item,

                        quantidade:
                            0

                    };

                }


                gruposEstoque[
                    chave
                ]
                    .quantidade++;

            } else {

                registrosPatrimonio.push(
                    item
                );

            }

        }
    );


    /*
       ESTOQUE
    */

    Object.values(
        gruposEstoque
    )
        .forEach(
            grupo => {

                const item =
                    grupo.item;


                const local =
                    obterNomeLocal(
                        item.local_id
                    );


                const classeStatus =
                    normalizarTexto(
                        item.status
                    ) === 'ativo'
                        ? 'ativo'
                        :
                    normalizarTexto(
                        item.status
                    ) === 'em manutencao'
                        ? 'manutencao'
                        :
                    normalizarTexto(
                        item.status
                    ) === 'baixado'
                        ? 'baixado'
                        :
                    'extraviado';


                if (tabela) {

                    tabela.innerHTML += `

                        <tr>

                            <td>

                                <img
                                    src="${escaparHTML(
                                        item.foto_url ||
                                        'https://placehold.co/80x80/png?text=IMG'
                                    )}"
                                    alt="Foto"
                                    onclick="abrirModalFoto('${escaparHTML(
                                        item.foto_url ||
                                        ''
                                    )}')"
                                    style="
                                        width:60px;
                                        height:60px;
                                        object-fit:cover;
                                        border-radius:8px;
                                        cursor:pointer;
                                    "
                                >

                            </td>

                            <td>
                                -
                            </td>

                            <td>
                                ${escaparHTML(
                                    item.tipo ||
                                    item.nome ||
                                    '-'
                                )}
                            </td>

                            <td>
                                <strong>
                                    ${escaparHTML(
                                        item.nome
                                    )}
                                </strong>
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
                                <strong>
                                    ${grupo.quantidade}
                                </strong>
                            </td>

                            <td>
                                <span class="control-badge estoque">
                                    Estoque
                                </span>
                            </td>

                            <td>
                                <span class="status ${classeStatus}">
                                    ${escaparHTML(
                                        item.status ||
                                        '-'
                                    )}
                                </span>
                            </td>

                            <td>

                                <div class="actions">

                                    ${
                                        usuarioPodeGerenciar()
                                        ?

                                        `

                                        <button
                                            class="btn-edit"
                                            type="button"
                                            onclick="editarEstoque(
                                                '${encodeURIComponent(item.nome)}',
                                                '${item.local_id}'
                                            )"
                                        >

                                            <i class="fa-solid fa-pen"></i>
                                            Editar

                                        </button>


                                        <button
                                            class="btn-delete"
                                            type="button"
                                            onclick="excluirEstoque(
                                                '${encodeURIComponent(item.nome)}',
                                                '${item.local_id}'
                                            )"
                                        >

                                            <i class="fa-solid fa-trash"></i>
                                            Excluir

                                        </button>

                                        `

                                        :

                                        '-'
                                    }

                                </div>

                            </td>

                        </tr>

                    `;

                }


                if (itemMov) {

                    itemMov.innerHTML += `

                        <option
                            value="${item.id}"
                        >

                            ESTOQUE —
                            ${escaparHTML(
                                item.nome
                            )}
                            —
                            ${grupo.quantidade}
                            unidade(s)
                            —
                            ${escaparHTML(
                                local
                            )}

                        </option>

                    `;

                }

            }
        );


    /*
       PATRIMÔNIOS
    */

    registrosPatrimonio
        .forEach(
            item => {

                const local =
                    obterNomeLocal(
                        item.local_id
                    );


                let classeStatus =
                    '';


                switch (
                    normalizarTexto(
                        item.status
                    )
                ) {

                    case 'ativo':

                        classeStatus =
                            'ativo';

                        break;


                    case 'em manutencao':

                        classeStatus =
                            'manutencao';

                        break;


                    case 'baixado':

                        classeStatus =
                            'baixado';

                        break;


                    case 'extraviado':

                        classeStatus =
                            'extraviado';

                        break;

                }


                if (tabela) {

                    tabela.innerHTML += `

                        <tr>

                            <td>

                                <img
                                    src="${escaparHTML(
                                        item.foto_url ||
                                        'https://placehold.co/80x80/png?text=IMG'
                                    )}"
                                    alt="Foto"
                                    onclick="abrirModalFoto('${escaparHTML(
                                        item.foto_url ||
                                        ''
                                    )}')"
                                    style="
                                        width:60px;
                                        height:60px;
                                        object-fit:cover;
                                        border-radius:8px;
                                        cursor:pointer;
                                    "
                                >

                            </td>

                            <td>
                                <strong>
                                    ${escaparHTML(
                                        item.patrimonio
                                    )}
                                </strong>
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
                                1
                            </td>

                            <td>
                                <span class="control-badge patrimonio">
                                    Patrimônio
                                </span>
                            </td>

                            <td>

                                <span class="status ${classeStatus}">
                                    ${escaparHTML(
                                        item.status ||
                                        '-'
                                    )}
                                </span>

                            </td>

                            <td>

                                <div class="actions">

                                    ${
                                        usuarioPodeGerenciar()
                                        ?

                                        `

                                        <button
                                            class="btn-edit"
                                            type="button"
                                            onclick="editarItem(${item.id})"
                                        >

                                            <i class="fa-solid fa-pen"></i>
                                            Editar

                                        </button>


                                        <button
                                            class="btn-delete"
                                            type="button"
                                            onclick="excluirItem(${item.id})"
                                        >

                                            <i class="fa-solid fa-trash"></i>
                                            Excluir

                                        </button>

                                        `

                                        :

                                        '-'
                                    }

                                </div>

                            </td>

                        </tr>

                    `;

                }


                if (itemMov) {

                    itemMov.innerHTML += `

                        <option
                            value="${item.id}"
                        >

                            ${escaparHTML(
                                item.patrimonio
                            )}
                            —
                            ${escaparHTML(
                                item.nome
                            )}
                            —
                            ${escaparHTML(
                                local
                            )}

                        </option>

                    `;

                }

            }
        );


    /*
       DASHBOARD
    */

    const totalItens =
        document.getElementById(
            'totalItens'
        ) ||
        document.getElementById(
            'dashTotal'
        );


    if (totalItens) {

        totalItens.innerText =
            itens.length;

    }


    const totalBaixados =
        document.getElementById(
            'totalBaixados'
        );


    if (totalBaixados) {

        totalBaixados.innerText =
            itens.filter(
                item =>
                    normalizarTexto(
                        item.status
                    ) ===
                    'baixado'
            ).length;

    }

}


/* =====================================================
   PREENCHER ITENS DA MOVIMENTAÇÃO
===================================================== */

function preencherItensMovimentacao() {

    const select =
        document.getElementById(
            'itemMov'
        );


    if (!select) {

        return;

    }


    const valorAtual =
        select.value;


    /*
       renderizarEstoque()
       já constrói as opções.
       Esta função existe para
       garantir compatibilidade.
    */

    if (
        select.options.length <= 1
    ) {

        renderizarEstoque();

    }


    if (
        valorAtual
    ) {

        select.value =
            valorAtual;

    }

}


/* =====================================================
   EDITAR PATRIMÔNIO
===================================================== */

async function editarItem(
    id
) {

    if (
        !exigirPermissaoGestor()
    ) {

        return;

    }


    const item =
        itens.find(
            i =>
                String(i.id) ===
                String(id)
        );


    if (!item) {

        alert(
            'Patrimônio não encontrado.'
        );

        return;

    }


    const novoNome =
        prompt(
            'Novo nome do patrimônio:',
            item.nome ||
            ''
        );


    if (
        novoNome === null ||
        !novoNome.trim()
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from(
                'itens'
            )
            .update({

                nome:
                    novoNome.trim()

            })
            .eq(
                'id',
                id
            );


    if (error) {

        console.error(
            error
        );

        alert(
            'Erro ao editar patrimônio:\n' +
            error.message
        );

        return;

    }


    await carregarDashboard();


    alert(
        'Patrimônio atualizado com sucesso.'
    );

}


/* =====================================================
   EDITAR ESTOQUE
===================================================== */

async function editarEstoque(
    nomeEncoded,
    localId
) {

    if (
        !exigirPermissaoGestor()
    ) {

        return;

    }


    const nome =
        decodeURIComponent(
            nomeEncoded
        );


    const grupo =
        itens.filter(
            item => {

                return (
                    itemEhEstoque(
                        item
                    ) &&
                    normalizarTexto(
                        item.nome
                    ) ===
                    normalizarTexto(
                        nome
                    ) &&
                    String(
                        item.local_id
                    ) ===
                    String(
                        localId
                    )
                );

            }
        );


    if (
        !grupo.length
    ) {

        alert(
            'Estoque não encontrado.'
        );

        return;

    }


    const novoNome =
        prompt(
            'Novo nome do estoque:',
            grupo[0].nome
        );


    if (
        novoNome === null ||
        !novoNome.trim()
    ) {

        return;

    }


    const novaDescricao =
        prompt(
            'Nova descrição:',
            grupo[0].descricao ||
            ''
        );


    const ids =
        grupo.map(
            item =>
                item.id
        );


    const {
        error
    } =
        await supabaseClient
            .from(
                'itens'
            )
            .update({

                nome:
                    novoNome.trim(),

                descricao:
                    novaDescricao ||
                    ''

            })
            .in(
                'id',
                ids
            );


    if (error) {

        console.error(
            error
        );

        alert(
            'Erro ao editar estoque:\n' +
            error.message
        );

        return;

    }


    await carregarDashboard();


    alert(
        'Estoque atualizado com sucesso.'
    );

}


/* =====================================================
   EXCLUIR PATRIMÔNIO
===================================================== */

async function excluirItem(
    id
) {

    if (
        !exigirPermissaoGestor()
    ) {

        return;

    }


    const item =
        itens.find(
            i =>
                String(i.id) ===
                String(id)
        );


    const confirmar =
        confirm(
            `Deseja excluir o patrimônio ${
                item?.patrimonio ||
                ''
            }?`
        );


    if (!confirmar) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from(
                'itens'
            )
            .delete()
            .eq(
                'id',
                id
            );


    if (error) {

        console.error(
            error
        );

        alert(
            'Erro ao excluir patrimônio:\n' +
            error.message
        );

        return;

    }


    await carregarDashboard();


    alert(
        'Patrimônio excluído com sucesso.'
    );

}


/* =====================================================
   EXCLUIR ESTOQUE
===================================================== */

async function excluirEstoque(
    nomeEncoded,
    localId
) {

    if (
        !exigirPermissaoGestor()
    ) {

        return;

    }


    const nome =
        decodeURIComponent(
            nomeEncoded
        );


    const grupo =
        itens.filter(
            item => {

                return (
                    itemEhEstoque(
                        item
                    ) &&
                    normalizarTexto(
                        item.nome
                    ) ===
                    normalizarTexto(
                        nome
                    ) &&
                    String(
                        item.local_id
                    ) ===
                    String(
                        localId
                    )
                );

            }
        );


    if (
        !grupo.length
    ) {

        alert(
            'Estoque não encontrado.'
        );

        return;

    }


    const confirmar =
        confirm(
            `Deseja excluir todo o estoque de "${nome}" neste local?\n\nQuantidade: ${grupo.length} unidade(s).`
        );


    if (!confirmar) {

        return;

    }


    const ids =
        grupo.map(
            item =>
                item.id
        );


    const {
        error
    } =
        await supabaseClient
            .from(
                'itens'
            )
            .delete()
            .in(
                'id',
                ids
            );


    if (error) {

        console.error(
            error
        );

        alert(
            'Erro ao excluir estoque:\n' +
            error.message
        );

        return;

    }


    await carregarDashboard();


    alert(
        'Estoque excluído com sucesso.'
    );

}
/* =====================================================
   MOVIMENTAÇÃO DE ESTOQUE / PATRIMÔNIO
===================================================== */

function preencherOrigemAutomaticamente() {

    const selectItem =
        document.getElementById(
            'itemMov'
        );

    const origemInput =
        document.getElementById(
            'origemAtual'
        ) ||
        document.getElementById(
            'origemNome'
        );


    if (
        !selectItem ||
        !origemInput
    ) {

        return;

    }


    const itemId =
        selectItem.value;


    if (!itemId) {

        origemInput.value =
            '';

        return;

    }


    const item =
        itens.find(
            i =>
                String(i.id) ===
                String(itemId)
        );


    if (!item) {

        origemInput.value =
            '';

        return;

    }


    origemInput.value =
        obterNomeLocal(
            item.local_id
        );

}


/* =====================================================
   MOVIMENTAR ITEM
===================================================== */

async function movimentarItem() {

    if (
        !exigirPermissaoGestor()
    ) {

        return;

    }


    try {

        const itemSelect =
            document.getElementById(
                'itemMov'
            );


        const destinoSelect =
            document.getElementById(
                'destino'
            );


        const observacaoCampo =
            document.getElementById(
                'observacaoMov'
            );


        const quantidadeCampo =
            document.getElementById(
                'quantidadeMov'
            );


        const statusCampo =
            document.getElementById(
                'statusMov'
            );


        const itemId =
            itemSelect?.value ||
            '';


        const destinoId =
            destinoSelect?.value ||
            '';


        const observacao =
            observacaoCampo
                ?.value
                ?.trim() ||
            '';


        const quantidadeSolicitada =
            parseInt(
                quantidadeCampo?.value ||
                '1',
                10
            );


        const novoStatus =
            statusCampo?.value ||
            '';


        /*
           VALIDAÇÕES
        */

        if (!itemId) {

            alert(
                'Selecione o item que será movimentado.'
            );

            return;

        }


        if (!destinoId) {

            alert(
                'Selecione o destino.'
            );

            return;

        }


        if (
            !Number.isInteger(
                quantidadeSolicitada
            ) ||
            quantidadeSolicitada < 1
        ) {

            alert(
                'Informe uma quantidade válida.'
            );

            return;

        }


        const item =
            itens.find(
                i =>
                    String(i.id) ===
                    String(itemId)
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


        const destinoIdNumber =
            Number(
                destinoId
            );


        /*
           NÃO PERMITE ORIGEM = DESTINO
        */

        if (
            origemId ===
            destinoIdNumber
        ) {

            alert(
                'O destino precisa ser diferente do local atual.'
            );

            return;

        }


        /*
           =================================================
           ESTOQUE
           =================================================

           Se o item for estoque, a movimentação
           pode ser parcial.

           Exemplo:

           CD1
           Copos = 300

           Movimentar 100 para DORYO

           Resultado:

           CD1  = 200
           DORYO = 100
        */

        if (
            itemEhEstoque(
                item
            )
        ) {

            await movimentarEstoqueParcial(
                item,
                destinoIdNumber,
                quantidadeSolicitada,
                observacao,
                novoStatus
            );

            return;

        }


        /*
           =================================================
           PATRIMÔNIO
           =================================================

           Patrimônio individual é sempre
           movimentado como uma unidade.
        */

        if (
            quantidadeSolicitada !== 1
        ) {

            alert(
                'Patrimônio individual deve ser movimentado com quantidade 1.'
            );

            return;

        }


        await movimentarPatrimonio(
            item,
            destinoIdNumber,
            observacao,
            novoStatus
        );


    } catch (err) {

        console.error(
            'Erro ao movimentar item:',
            err
        );

        alert(
            'Erro inesperado ao movimentar o item.'
        );

    }

}


/* =====================================================
   MOVIMENTAR ESTOQUE PARCIAL
===================================================== */

async function movimentarEstoqueParcial(
    item,
    destinoId,
    quantidade,
    observacao,
    novoStatus
) {

    /*
       Localiza TODAS as unidades
       do mesmo estoque no local de origem.
    */

    const estoqueOrigem =
        itens.filter(
            registro => {

                return (
                    itemEhEstoque(
                        registro
                    ) &&

                    normalizarTexto(
                        registro.nome
                    ) ===
                    normalizarTexto(
                        item.nome
                    ) &&

                    String(
                        registro.local_id
                    ) ===
                    String(
                        item.local_id
                    )
                );

            }
        );


    const quantidadeDisponivel =
        estoqueOrigem.length;


    /*
       NÃO PERMITIR MOVIMENTAÇÃO
       MAIOR QUE O ESTOQUE
    */

    if (
        quantidade >
        quantidadeDisponivel
    ) {

        alert(
            `Quantidade insuficiente.\n\nDisponível: ${quantidadeDisponivel}\nSolicitado: ${quantidade}`
        );

        return;

    }


    /*
       CONFIRMAÇÃO
    */

    const origemNome =
        obterNomeLocal(
            item.local_id
        );


    const destinoNome =
        obterNomeLocal(
            destinoId
        );


    const confirmar =
        confirm(
            `CONFIRMAR MOVIMENTAÇÃO?\n\n` +

            `Item: ${item.nome}\n` +

            `Quantidade: ${quantidade}\n` +

            `Origem: ${origemNome}\n` +

            `Destino: ${destinoNome}`
        );


    if (!confirmar) {

        return;

    }


    /*
       SELECIONA EXATAMENTE
       A QUANTIDADE SOLICITADA.
    */

    const unidadesMover =
        estoqueOrigem.slice(
            0,
            quantidade
        );


    const idsMover =
        unidadesMover.map(
            registro =>
                registro.id
        );


    /*
       =================================================
       ATUALIZAR LOCAL
       =================================================
    */

    const dadosAtualizacao = {

        local_id:
            destinoId

    };


    /*
       Se o usuário escolheu
       alterar status, aplica.
    */

    if (
        novoStatus
    ) {

        dadosAtualizacao.status =
            novoStatus;

    }


    const {
        error:
            updateError
    } =
        await supabaseClient
            .from(
                'itens'
            )
            .update(
                dadosAtualizacao
            )
            .in(
                'id',
                idsMover
            );


    if (updateError) {

        console.error(
            'Erro ao atualizar estoque:',
            updateError
        );

        alert(
            'Erro ao movimentar estoque:\n' +
            updateError.message
        );

        return;

    }


    /*
       =================================================
       HISTÓRICO
       =================================================
    */

    const registroHistorico = {

        item_id:
            item.id,

        origem_id:
            Number(
                item.local_id
            ),

        destino_id:
            Number(
                destinoId
            ),

        quantidade:
            quantidade,

        observacao:
            observacao,

        data:
            new Date()
                .toISOString()

    };


    const {
        error:
            historicoError
    } =
        await supabaseClient
            .from(
                'movimentacoes'
            )
            .insert([
                registroHistorico
            ]);


    if (historicoError) {

        /*
           A movimentação já ocorreu.
           Portanto apenas registramos
           o erro para diagnóstico.
        */

        console.error(
            'Erro ao registrar histórico:',
            historicoError
        );

        alert(
            'O estoque foi movimentado, mas houve erro ao registrar o histórico:\n' +
            historicoError.message
        );

    } else {

        alert(
            `Movimentação realizada com sucesso!\n\n${quantidade} unidade(s) de "${item.nome}" foram transferidas de ${origemNome} para ${destinoNome}.`
        );

    }


    limparFormularioMovimentacao();


    await carregarDashboard();

}


/* =====================================================
   MOVIMENTAR PATRIMÔNIO
===================================================== */

async function movimentarPatrimonio(
    item,
    destinoId,
    observacao,
    novoStatus
) {

    const origemId =
        Number(
            item.local_id
        );


    const origemNome =
        obterNomeLocal(
            origemId
        );


    const destinoNome =
        obterNomeLocal(
            destinoId
        );


    const confirmar =
        confirm(
            `CONFIRMAR MOVIMENTAÇÃO?\n\n` +

            `Patrimônio: ${item.patrimonio}\n` +

            `Item: ${item.nome}\n` +

            `Origem: ${origemNome}\n` +

            `Destino: ${destinoNome}`
        );


    if (!confirmar) {

        return;

    }


    const dadosAtualizacao = {

        local_id:
            destinoId

    };


    if (
        novoStatus
    ) {

        dadosAtualizacao.status =
            novoStatus;

    }


    /*
       ATUALIZAR PATRIMÔNIO
    */

    const {
        error:
            updateError
    } =
        await supabaseClient
            .from(
                'itens'
            )
            .update(
                dadosAtualizacao
            )
            .eq(
                'id',
                item.id
            );


    if (updateError) {

        console.error(
            updateError
        );

        alert(
            'Erro ao movimentar patrimônio:\n' +
            updateError.message
        );

        return;

    }


    /*
       REGISTRAR HISTÓRICO
    */

    const {
        error:
            historicoError
    } =
        await supabaseClient
            .from(
                'movimentacoes'
            )
            .insert([
                {

                    item_id:
                        item.id,

                    origem_id:
                        origemId,

                    destino_id:
                        destinoId,

                    quantidade:
                        1,

                    observacao:
                        observacao,

                    data:
                        new Date()
                            .toISOString()

                }
            ]);


    if (historicoError) {

        console.error(
            historicoError
        );

        alert(
            'O patrimônio foi movimentado, porém ocorreu um erro ao registrar o histórico:\n' +
            historicoError.message
        );

    } else {

        alert(
            'Patrimônio movimentado com sucesso!'
        );

    }


    limparFormularioMovimentacao();


    await carregarDashboard();

}


/* =====================================================
   LIMPAR FORMULÁRIO DE MOVIMENTAÇÃO
===================================================== */

function limparFormularioMovimentacao() {

    const itemMov =
        document.getElementById(
            'itemMov'
        );


    const destino =
        document.getElementById(
            'destino'
        );


    const origem =
        document.getElementById(
            'origemAtual'
        ) ||
        document.getElementById(
            'origemNome'
        );


    const quantidade =
        document.getElementById(
            'quantidadeMov'
        );


    const observacao =
        document.getElementById(
            'observacaoMov'
        );


    const status =
        document.getElementById(
            'statusMov'
        );


    if (itemMov) {

        itemMov.value =
            '';

    }


    if (destino) {

        destino.value =
            '';

    }


    if (origem) {

        origem.value =
            '';

    }


    if (quantidade) {

        quantidade.value =
            '1';

    }


    if (observacao) {

        observacao.value =
            '';

    }


    if (status) {

        status.value =
            '';

    }

}


/* =====================================================
   HISTÓRICO
===================================================== */

async function carregarHistorico() {

    if (
        !supabaseClient
    ) {

        return;

    }


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

            console.error(
                'Erro ao carregar histórico:',
                error
            );

            return;

        }


        movimentacoes =
            data ||
            [];


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
            mov => {

                const item =
                    itens.find(
                        registro =>
                            String(
                                registro.id
                            ) ===
                            String(
                                mov.item_id
                            )
                    );


                const origem =
                    obterNomeLocal(
                        mov.origem_id
                    );


                const destino =
                    obterNomeLocal(
                        mov.destino_id
                    );


                const quantidade =
                    mov.quantidade ||
                    1;


                let dataFormatada =
                    '-';


                if (
                    mov.data
                ) {

                    const data =
                        new Date(
                            mov.data
                        );


                    if (
                        !Number.isNaN(
                            data.getTime()
                        )
                    ) {

                        dataFormatada =
                            data.toLocaleString(
                                'pt-BR'
                            );

                    }

                }


                tabela.innerHTML += `

                    <tr>

                        <td>

                            ${
                                escaparHTML(
                                    item?.patrimonio ||
                                    '-'
                                )
                            }

                        </td>

                        <td>

                            ${
                                escaparHTML(
                                    item?.nome ||
                                    '-'
                                )
                            }

                        </td>

                        <td>

                            ${
                                escaparHTML(
                                    origem
                                )
                            }

                        </td>

                        <td>

                            ${
                                escaparHTML(
                                    destino
                                )
                            }

                        </td>

                        <td>

                            ${
                                quantidade
                            }

                        </td>

                        <td>

                            ${
                                escaparHTML(
                                    mov.observacao ||
                                    '-'
                                )
                            }

                        </td>

                        <td>

                            ${
                                dataFormatada
                            }

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

    } catch (err) {

        console.error(
            'Erro inesperado no histórico:',
            err
        );

    }

}


/* =====================================================
   DASHBOARD — STATUS
===================================================== */

function atualizarDashboardAvancado() {

    const total =
        itens.length;


    const ativos =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) ===
                'ativo'
        ).length;


    const manutencao =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) ===
                'em manutencao'
        ).length;


    const baixados =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) ===
                'baixado'
        ).length;


    const extraviados =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) ===
                'extraviado'
        ).length;


    /*
       TOTAL
    */

    [
        'totalItens',
        'dashTotal'
    ]
        .forEach(
            id => {

                const elemento =
                    document.getElementById(
                        id
                    );


                if (elemento) {

                    elemento.innerText =
                        total;

                }

            }
        );


    /*
       ATIVOS
    */

    [
        'dashAtivo',
        'totalAtivos'
    ]
        .forEach(
            id => {

                const elemento =
                    document.getElementById(
                        id
                    );


                if (elemento) {

                    elemento.innerText =
                        ativos;

                }

            }
        );


    /*
       MANUTENÇÃO
    */

    [
        'dashManutencao',
        'totalManutencao'
    ]
        .forEach(
            id => {

                const elemento =
                    document.getElementById(
                        id
                    );


                if (elemento) {

                    elemento.innerText =
                        manutencao;

                }

            }
        );


    /*
       BAIXADOS
    */

    [
        'dashBaixado',
        'totalBaixados'
    ]
        .forEach(
            id => {

                const elemento =
                    document.getElementById(
                        id
                    );


                if (elemento) {

                    elemento.innerText =
                        baixados;

                }

            }
        );


    /*
       EXTRAVIADOS
    */

    [
        'dashExtraviado',
        'totalExtraviados'
    ]
        .forEach(
            id => {

                const elemento =
                    document.getElementById(
                        id
                    );


                if (elemento) {

                    elemento.innerText =
                        extraviados;

                }

            }
        );


    /*
       LOCAIS
    */

    const totalLocais =
        document.getElementById(
            'totalLocais'
        );


    if (totalLocais) {

        totalLocais.innerText =
            LOCAIS.length;

    }


    /*
       MOVIMENTAÇÕES
    */

    const totalMov =
        document.getElementById(
            'totalMov'
        );


    if (
        totalMov &&
        Array.isArray(
            movimentacoes
        )
    ) {

        totalMov.innerText =
            movimentacoes.length;

    }

}


/* =====================================================
   RELATÓRIO POR LOCAL
===================================================== */

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


    /*
       AGRUPA POR:
       ITEM + LOCAL
    */

    const agrupado =
        {};


    itens.forEach(
        item => {

            const localNome =
                obterNomeLocal(
                    item.local_id
                );


            const nomeItem =
                item.nome ||
                'SEM NOME';


            const tipo =
                item.tipo ||
                nomeItem;


            const chave =
                `${normalizarTexto(nomeItem)}||${normalizarTexto(tipo)}||${normalizarTexto(localNome)}`;


            if (
                !agrupado[chave]
            ) {

                agrupado[chave] = {

                    item:
                        nomeItem,

                    tipo:
                        tipo,

                    local:
                        localNome,

                    quantidade:
                        0

                };

            }


            agrupado[
                chave
            ]
                .quantidade++;

        }
    );


    /*
       RENDERIZA
    */

    Object.values(
        agrupado
    )
        .sort(
            (
                a,
                b
            ) => {

                const localCompare =
                    a.local.localeCompare(
                        b.local,
                        'pt-BR'
                    );


                if (
                    localCompare !==
                    0
                ) {

                    return localCompare;

                }


                return a.item.localeCompare(
                    b.item,
                    'pt-BR'
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
                                normalizarTexto(
                                    registro.local
                                )
                            )}"
                        >
                            ${escaparHTML(
                                registro.local
                            )}
                        </td>

                        <td>
                            <strong>
                                ${
                                    registro.quantidade
                                }
                            </strong>
                        </td>

                    </tr>

                `;

            }
        );


    filtrarDashboard();

}


/* =====================================================
   FILTRAR DASHBOARD
===================================================== */

function filtrarDashboard() {

    const busca =
        normalizarTexto(
            document.getElementById(
                'filtroDashboard'
            )
                ?.value ||
            ''
        );


    const localFiltro =
        normalizarTexto(
            document.getElementById(
                'filtroLocalDashboard'
            )
                ?.value ||
            ''
        );


    const linhas =
        document.querySelectorAll(
            '#dashboardLocais tr'
        );


    linhas.forEach(
        linha => {

            const item =
                normalizarTexto(
                    linha.children[
                        0
                    ]?.innerText ||
                    ''
                );


            const local =
                normalizarTexto(
                    linha.children[
                        1
                    ]?.innerText ||
                    ''
                );


            const texto =
                `${item} ${local}`;


            const correspondeBusca =
                !busca ||
                texto.includes(
                    busca
                );


            const correspondeLocal =
                !localFiltro ||
                local ===
                localFiltro;


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


/* =====================================================
   FILTRAR ESTOQUE
===================================================== */

function filtrarItens() {

    const termo =
        normalizarTexto(
            document.getElementById(
                'busca'
            )
                ?.value ||
            ''
        );


    const linhas =
        document.querySelectorAll(
            '#listaItens tr'
        );


    linhas.forEach(
        linha => {

            const texto =
                normalizarTexto(
                    linha.innerText
                );


            linha.style.display =
                !termo ||
                texto.includes(
                    termo
                )
                    ? ''
                    : 'none';

        }
    );

}


/* =====================================================
   DASHBOARD COMPLETO
===================================================== */

async function carregarDashboard() {

    if (
        !usuarioLogado
    ) {

        return;

    }


    try {

        /*
           Locais são locais fixos.
        */

        carregarLocais();

        carregarFiltroLocaisDashboard();


        /*
           Carrega dados.
        */

        await carregarItens();


        await carregarHistorico();


        /*
           Atualiza indicadores.
        */

        atualizarDashboardAvancado();


        gerarRelatorioLocais();


        /*
           Filtros.
        */

        filtrarDashboard();


    } catch (err) {

        console.error(
            'Erro ao carregar dashboard:',
            err
        );

    }

}


/* =====================================================
   MODAL DE FOTO
===================================================== */

function abrirModalFoto(
    url
) {

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

        return;

    }


    imagem.src =
        url;


    modal.classList.add(
        'active'
    );

}


/* =====================================================
   FECHAR MODAL FOTO
===================================================== */

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


    const imagem =
        document.getElementById(
            'imagemModal'
        );


    if (imagem) {

        imagem.src =
            '';

    }

}


/* =====================================================
   EXPORTAR CSV / EXCEL
===================================================== */

function exportarExcel() {

    if (
        !itens.length
    ) {

        alert(
            'Nenhum item cadastrado para exportar.'
        );

        return;

    }


    let csv =
        'PATRIMÔNIO;TIPO;NOME;DESCRIÇÃO;LOCAL;QUANTIDADE;CONTROLE;STATUS\n';


    /*
       AGRUPAMENTO DO ESTOQUE
    */

    const grupos =
        {};


    itens.forEach(
        item => {

            const local =
                obterNomeLocal(
                    item.local_id
                );


            if (
                itemEhEstoque(
                    item
                )
            ) {

                const chave =
                    `${normalizarTexto(item.nome)}||${item.local_id}`;


                if (
                    !grupos[chave]
                ) {

                    grupos[chave] = {

                        item:
                            item,

                        quantidade:
                            0,

                        local:
                            local

                    };

                }


                grupos[
                    chave
                ]
                    .quantidade++;

            } else {

                csv +=
                    `"${String(
                        item.patrimonio ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}";`;


                csv +=
                    `"${String(
                        item.tipo ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}";`;


                csv +=
                    `"${String(
                        item.nome ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}";`;


                csv +=
                    `"${String(
                        item.descricao ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}";`;


                csv +=
                    `"${local}";`;


                csv +=
                    `1;`;


                csv +=
                    `"Patrimônio";`;


                csv +=
                    `"${String(
                        item.status ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}"\n`;

            }

        }
    );


    /*
       ESTOQUE
    */

    Object.values(
        grupos
    )
        .forEach(
            grupo => {

                const item =
                    grupo.item;


                csv +=
                    `"";`;


                csv +=
                    `"${String(
                        item.tipo ||
                        item.nome ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}";`;


                csv +=
                    `"${String(
                        item.nome ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}";`;


                csv +=
                    `"${String(
                        item.descricao ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}";`;


                csv +=
                    `"${grupo.local}";`;


                csv +=
                    `${grupo.quantidade};`;


                csv +=
                    `"Estoque";`;


                csv +=
                    `"${String(
                        item.status ||
                        ''
                    )
                        .replace(
                            /"/g,
                            '""'
                        )}"\n`;

            }
        );


    /*
       BOM UTF-8
    */

    const blob =
        new Blob(
            [
                '\uFEFF' +
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


/* =====================================================
   ENTER NO LOGIN
===================================================== */

function configurarLogin() {

    const form =
        document.getElementById(
            'loginForm'
        );


    if (!form) {

        return;

    }


    /*
       Evita cadastro duplicado
       do evento.
    */

    if (
        form.dataset.loginConfigurado ===
        'true'
    ) {

        return;

    }


    form.dataset.loginConfigurado =
        'true';


    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            await login();

        }
    );

}


/* =====================================================
   EVENTO DO SELECT DE MOVIMENTAÇÃO
===================================================== */

function configurarMovimentacao() {

    const select =
        document.getElementById(
            'itemMov'
        );


    if (!select) {

        return;

    }


    if (
        select.dataset.movConfigurado ===
        'true'
    ) {

        return;

    }


    select.dataset.movConfigurado =
        'true';


    select.addEventListener(
        'change',
        preencherOrigemAutomaticamente
    );

}


/* =====================================================
   EVENTO DO FORMULÁRIO DE CADASTRO
===================================================== */

function configurarCadastro() {

    const form =
        document.getElementById(
            'cadastroForm'
        );


    if (!form) {

        return;

    }


    if (
        form.dataset.cadastroConfigurado ===
        'true'
    ) {

        return;

    }


    form.dataset.cadastroConfigurado =
        'true';


    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            await salvarItem();

        }
    );

}


/* =====================================================
   TIPO DE CONTROLE
===================================================== */

function configurarControleCadastro() {

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


/* =====================================================
   MODAL — ESC
===================================================== */

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


/* =====================================================
   CLIQUE FORA DO MODAL
===================================================== */

document.addEventListener(
    'click',
    event => {

        const modal =
            document.getElementById(
                'modalFoto'
            );


        if (
            !modal
        ) {

            return;

        }


        if (
            event.target ===
            modal
        ) {

            fecharModalFoto();

        }

    }
);


/* =====================================================
   MENU MOBILE
===================================================== */

document.addEventListener(
    'click',
    event => {

        const sidebar =
            document.getElementById(
                'sidebar'
            );


        const menuButton =
            document.querySelector(
                '.mobile-menu-btn'
            );


        const overlay =
            document.getElementById(
                'sidebarOverlay'
            );


        if (
            !sidebar
        ) {

            return;

        }


        /*
           Se estiver deslogado,
           menu nunca deve abrir.
        */

        if (
            !usuarioLogado
        ) {

            sidebar.classList.remove(
                'sidebar-open'
            );

            if (overlay) {

                overlay.classList.remove(
                    'show'
                );

            }

            return;

        }


        const clicouDentro =
            sidebar.contains(
                event.target
            );


        const clicouBotao =
            menuButton &&
            menuButton.contains(
                event.target
            );


        const clicouOverlay =
            overlay &&
            overlay.contains(
                event.target
            );


        if (
            clicouOverlay
        ) {

            toggleSidebar(
                false
            );

            return;

        }


        if (
            window.innerWidth <= 900 &&
            !clicouDentro &&
            !clicouBotao
        ) {

            toggleSidebar(
                false
            );

        }

    }
);


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

async function inicializarSistema() {

    if (
        sistemaInicializado
    ) {

        return;

    }


    sistemaInicializado =
        true;


    console.log(
        '================================'
    );


    console.log(
        'SISTEMA DE INVENTÁRIO'
    );


    console.log(
        'INICIANDO SISTEMA...'
    );


    console.log(
        '================================'
    );


    /*
       SUPABASE
    */

    if (
        !supabaseClient
    ) {

        console.error(
            'SUPABASE NÃO DISPONÍVEL.'
        );

        alert(
            'Não foi possível conectar ao Supabase.'
        );

        return;

    }


    /*
       LOCAIS
    */

    carregarLocais();

    carregarFiltroLocaisDashboard();


    /*
       FORMULÁRIOS
    */

    configurarLogin();

    configurarCadastro();

    configurarMovimentacao();

    configurarControleCadastro();


    /*
       ESTADO INICIAL
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
            'Erro ao recuperar sessão:',
            error
        );

    }


    /*
       USUÁRIO JÁ LOGADO
    */

    if (
        data?.session?.user
    ) {

        usuarioLogado =
            data.session.user;


        await verificarPerfil();


        if (
            perfilUsuario
        ) {

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

            /*
               Sessão existe, mas
               não existe perfil.
            */

            await supabaseClient
                .auth
                .signOut();


            usuarioLogado =
                null;


            perfilUsuario =
                null;


            atualizarMenus();


            abrirTela(
                'loginTela',
                document.getElementById(
                    'menuLogin'
                )
            );

        }


    } else {

        /*
           VISITANTE
        */

        usuarioLogado =
            null;


        perfilUsuario =
            null;


        atualizarMenus();


        abrirTela(
            'loginTela',
            document.getElementById(
                'menuLogin'
            )
        );

    }


    /*
       OBSERVADOR DE AUTENTICAÇÃO
    */

    supabaseClient
        .auth
        .onAuthStateChange(
            async (
                event,
                session
            ) => {

                console.log(
                    'Evento de autenticação:',
                    event
                );


                /*
                   LOGIN
                */

                if (
                    event ===
                        'SIGNED_IN' &&
                    session?.user
                ) {

                    usuarioLogado =
                        session.user;


                    await verificarPerfil();


                    atualizarMenus();

                    atualizarUsuarioInterface();


                    if (
                        perfilUsuario
                    ) {

                        abrirTela(
                            'dashboardTela',
                            document.getElementById(
                                'menuDashboard'
                            )
                        );


                        await carregarDashboard();

                    }

                }


                /*
                   LOGOUT
                */

                if (
                    event ===
                    'SIGNED_OUT'
                ) {

                    usuarioLogado =
                        null;


                    perfilUsuario =
                        null;


                    itens =
                        [];


                    movimentacoes =
                        [];


                    atualizarMenus();

                    atualizarUsuarioInterface();


                    abrirTela(
                        'loginTela',
                        document.getElementById(
                            'menuLogin'
                        )
                    );

                }

            }
        );


    console.log(
        '================================'
    );


    console.log(
        'SISTEMA DE INVENTÁRIO INICIADO'
    );


    console.log(
        'SUPABASE ONLINE'
    );


    console.log(
        'LOCAIS DISPONÍVEIS:',
        LOCAIS.length
    );


    console.log(
        '================================'
    );

}


/* =====================================================
   WINDOW LOAD
===================================================== */

window.addEventListener(
    'load',
    async () => {

        try {

            await inicializarSistema();

        } catch (err) {

            console.error(
                'Erro ao iniciar sistema:',
                err
            );

            sistemaInicializado =
                false;

        }

    }
);


/* =====================================================
   DISPONIBILIZAR FUNÇÕES GLOBALMENTE
   NECESSÁRIO PARA onclick="" DO HTML
===================================================== */

window.login =
    login;

window.logout =
    logout;

window.abrirTela =
    abrirTela;

window.toggleSidebar =
    toggleSidebar;

window.salvarItem =
    salvarItem;

window.editarItem =
    editarItem;

window.excluirItem =
    excluirItem;

window.editarEstoque =
    editarEstoque;

window.excluirEstoque =
    excluirEstoque;

window.movimentarItem =
    movimentarItem;

window.preencherOrigemAutomaticamente =
    preencherOrigemAutomaticamente;

window.carregarLocais =
    carregarLocais;

window.carregarItens =
    carregarItens;

window.carregarHistorico =
    carregarHistorico;

window.carregarDashboard =
    carregarDashboard;

window.filtrarItens =
    filtrarItens;

window.filtrarDashboard =
    filtrarDashboard;

window.exportarExcel =
    exportarExcel;

window.abrirModalFoto =
    abrirModalFoto;

window.fecharModalFoto =
    fecharModalFoto;

window.alternarTipoControle =
    alternarTipoControle;


/* =====================================================
   FIM DO APP.JS
===================================================== */