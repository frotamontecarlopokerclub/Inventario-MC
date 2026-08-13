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

let supabaseClient = null;


/* =========================================================
   VARIÁVEIS GLOBAIS
========================================================= */

let itens = [];
let movimentacoes = [];

let usuarioLogado = null;
let perfilUsuario = null;

let sistemaInicializado = false;


/* =========================================================
   LOCAIS FIXOS
========================================================= */

const LOCAIS = [

    { id:1, nome:'CASA 1 CHEFIA' },

    { id:2, nome:'CASA 2 CHEFIA' },

    { id:3, nome:'CASA 3 CHEFIA' },

    { id:4, nome:'CASA 1 DOS FUNCIONARIOS' },

    { id:5, nome:'CASA 2 DOS FUNCIONARIOS' },

    { id:6, nome:'CASA 3 DOS FUNCIONARIOS' },

    { id:7, nome:'CASA 4 DOS FUNCIONARIOS' },

    { id:8, nome:'CONSERTO' },

    { id:9, nome:'CD1' },

    { id:10, nome:'CD2' },

    { id:11, nome:'CD3' },

    { id:12, nome:'DORYO' },

    { id:13, nome:'ESCRITÓRIO 1' },

    { id:14, nome:'ESCRITÓRIO 2' },

    { id:15, nome:'ESCRITÓRIO 3' },

    { id:16, nome:'ESTACIONAMENTO 1' },

    { id:17, nome:'ESTACIONAMENTO 2' },

    { id:18, nome:'ESTACIONAMENTO 3' },

    { id:19, nome:'M.C.' },

    { id:20, nome:'M.G.' },

    { id:21, nome:'DESCARTE/BAIXA TOTAL' }

];


/* =========================================================
   INICIALIZAR SUPABASE
========================================================= */

function inicializarSupabase(){

    if(
        typeof window.supabase === 'undefined'
    ){

        console.error(
            'Biblioteca do Supabase não carregada.'
        );

        return false;
    }

    if(!supabaseClient){

        supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );
    }

    return true;
}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function obterElemento(id){

    return document.getElementById(id);

}


function numeroSeguro(valor){

    const numero =
    Number(valor);

    if(
        !Number.isFinite(numero)
    ){

        return 0;
    }

    return numero;
}


function escaparHTML(valor){

    if(
        valor === null ||
        valor === undefined
    ){

        return '';
    }

    return String(valor)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

}


function obterNomeLocal(localId){

    const local =
    LOCAIS.find(
        item =>
        String(item.id) === String(localId)
    );

    return local?.nome || 'SEM LOCAL';

}


function obterLocal(localId){

    return LOCAIS.find(
        item =>
        String(item.id) === String(localId)
    );

}


/* =========================================================
   PERFIL / PERMISSÕES
========================================================= */

function usuarioPodeEditar(){

    if(!usuarioLogado){

        return false;
    }

    return perfilUsuario !== 'consulta';

}


function usuarioPodeMovimentar(){

    if(!usuarioLogado){

        return false;
    }

    return perfilUsuario !== 'consulta';

}


/* =========================================================
   LOGIN
========================================================= */

async function login(){

    console.log(
        '======================================'
    );

    console.log(
        'INICIANDO LOGIN'
    );

    console.log(
        '======================================'
    );


    /* -----------------------------------------------------
       GARANTE SUPABASE
    ----------------------------------------------------- */

    if(!supabaseClient){

        console.log(
            'Supabase ainda não inicializado. Inicializando...'
        );


        const inicializou =
        inicializarSupabase();


        if(!inicializou){

            alert(
                'Erro: o sistema não conseguiu conectar ao Supabase.'
            );

            return;
        }

    }


    /* -----------------------------------------------------
       CAMPOS
    ----------------------------------------------------- */

    const emailInput =
    document.getElementById(
        'email'
    );


    const passwordInput =
    document.getElementById(
        'password'
    );


    if(!emailInput){

        console.error(
            'Campo #email não encontrado.'
        );

        alert(
            'Erro interno: campo de e-mail não encontrado.'
        );

        return;
    }


    if(!passwordInput){

        console.error(
            'Campo #password não encontrado.'
        );

        alert(
            'Erro interno: campo de senha não encontrado.'
        );

        return;
    }


    const email =
    emailInput.value
    .trim()
    .toLowerCase();


    const password =
    passwordInput.value;


    console.log(
        'E-mail informado:',
        email
    );


    if(!email){

        alert(
            'Informe seu e-mail.'
        );

        emailInput.focus();

        return;
    }


    if(!password){

        alert(
            'Informe sua senha.'
        );

        passwordInput.focus();

        return;
    }


    /* -----------------------------------------------------
       BOTÃO
    ----------------------------------------------------- */

    const botao =
    document.getElementById(
        'btnLogin'
    );


    const textoBotao =
    document.getElementById(
        'textoBtnLogin'
    );


    if(botao){

        botao.disabled =
        true;

    }


    if(textoBotao){

        textoBotao.innerText =
        'Entrando...';

    }


    try{

        console.log(
            'Enviando autenticação para o Supabase...'
        );


        /* -------------------------------------------------
           LOGIN SUPABASE
        ------------------------------------------------- */

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
            password

        });


        console.log(
            'Resposta do Supabase:',
            data,
            error
        );


        /* -------------------------------------------------
           ERRO DE AUTENTICAÇÃO
        ------------------------------------------------- */

        if(error){

            console.error(
                'ERRO DE LOGIN SUPABASE:',
                error
            );


            if(
                error.message
                ?.toLowerCase()
                .includes(
                    'invalid login credentials'
                )
            ){

                alert(
                    'E-mail ou senha incorretos.'
                );

            }else{

                alert(
                    'Erro ao fazer login: ' +
                    error.message
                );

            }


            return;
        }


        /* -------------------------------------------------
           USUÁRIO AUTENTICADO
        ------------------------------------------------- */

        if(
            !data ||
            !data.user
        ){

            console.error(
                'Supabase não retornou usuário.'
            );

            alert(
                'O login não retornou um usuário válido.'
            );

            return;
        }


        usuarioLogado =
        data.user;


        console.log(
            'USUÁRIO AUTENTICADO:',
            usuarioLogado.email
        );


        /* -------------------------------------------------
           BUSCAR PERFIL
        ------------------------------------------------- */

        await verificarPerfil();


        console.log(
            'PERFIL IDENTIFICADO:',
            perfilUsuario
        );


        /* -------------------------------------------------
           ATUALIZAR INTERFACE
        ------------------------------------------------- */

        atualizarMenus();


        /* -------------------------------------------------
           ABRIR DASHBOARD
        ------------------------------------------------- */

        abrirTela(
            'dashboardTela',
            document.getElementById(
                'menuDashboard'
            )
        );


        /* -------------------------------------------------
           CARREGAR SISTEMA
        ------------------------------------------------- */

        await carregarDashboard();


        console.log(
            'LOGIN CONCLUÍDO COM SUCESSO!'
        );


    }catch(error){

        console.error(
            'ERRO INESPERADO NO LOGIN:',
            error
        );


        alert(
            'Erro inesperado ao realizar o login. Veja o Console para detalhes.'
        );


    }finally{

        if(botao){

            botao.disabled =
            false;

        }


        if(textoBotao){

            textoBotao.innerText =
            'Entrar no Sistema';

        }

    }

}

/* =========================================================
   LOGOUT
========================================================= */

async function logout(){

    try{

        if(
            supabaseClient
        ){

            await supabaseClient
            .auth
            .signOut();

        }


        usuarioLogado = null;

        perfilUsuario = null;

        itens = [];

        movimentacoes = [];


        atualizarMenus();


        abrirTela(
            'loginTela',
            obterElemento('menuLogin')
        );


        console.log(
            'Logout realizado.'
        );


    }catch(error){

        console.error(
            'Erro no logout:',
            error
        );

        alert(
            'Erro ao sair do sistema.'
        );
    }

}


/* =========================================================
   VERIFICAR PERFIL
========================================================= */

async function verificarPerfil(){

    if(!usuarioLogado){

        perfilUsuario =
        'consulta';

        return;
    }


    try{

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


        if(error){

            console.error(
                'Erro ao buscar perfil:',
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


        console.log(
            'Perfil:',
            perfilUsuario
        );


    }catch(error){

        console.error(
            'Erro ao verificar perfil:',
            error
        );

        perfilUsuario =
        'consulta';
    }

}


/* =========================================================
   CONTROLE DE MENUS
========================================================= */

function atualizarMenus(){

    const loginMenu =
    obterElemento('menuLogin');

    const dashboardMenu =
    obterElemento('menuDashboard');

    const cadastroMenu =
    obterElemento('menuCadastro');

    const movimentacaoMenu =
    obterElemento('menuMovimentacao');

    const estoqueMenu =
    obterElemento('menuEstoque');

    const historicoMenu =
    obterElemento('menuHistorico');

    const logoutMenu =
    obterElemento('menuLogout');


    const elementos = [

        loginMenu,
        dashboardMenu,
        cadastroMenu,
        movimentacaoMenu,
        estoqueMenu,
        historicoMenu,
        logoutMenu

    ];


    elementos.forEach(elemento => {

        if(elemento){

            elemento.style.display =
            'none';

        }

    });


    if(!usuarioLogado){

        if(loginMenu){

            loginMenu.style.display =
            'flex';

        }

        return;
    }


    if(dashboardMenu){

        dashboardMenu.style.display =
        'flex';

    }


    if(estoqueMenu){

        estoqueMenu.style.display =
        'flex';

    }


    if(historicoMenu){

        historicoMenu.style.display =
        'flex';

    }


    if(logoutMenu){

        logoutMenu.style.display =
        'flex';

    }


    /*
       CONSULTA:
       SOMENTE VISUALIZAÇÃO
    */

    if(
        perfilUsuario ===
        'consulta'
    ){

        if(cadastroMenu){

            cadastroMenu.style.display =
            'none';

        }

        if(movimentacaoMenu){

            movimentacaoMenu.style.display =
            'none';

        }

        return;
    }


    /*
       GESTOR / ADMIN:
       ACESSO COMPLETO
    */

    if(cadastroMenu){

        cadastroMenu.style.display =
        'flex';

    }


    if(movimentacaoMenu){

        movimentacaoMenu.style.display =
        'flex';

    }

}


/* =========================================================
   CARREGAR LOCAIS
========================================================= */

function carregarLocais(){

    const local =
    obterElemento('local');

    const destino =
    obterElemento('destino');


    if(local){

        local.innerHTML =
        `
        <option value="">
            Selecione o Local
        </option>
        `;


        LOCAIS.forEach(item => {

            local.innerHTML +=
            `
            <option value="${item.id}">
                ${escaparHTML(item.nome)}
            </option>
            `;

        });

    }


    if(destino){

        destino.innerHTML =
        `
        <option value="">
            Selecione o Destino
        </option>
        `;


        LOCAIS.forEach(item => {

            destino.innerHTML +=
            `
            <option value="${item.id}">
                ${escaparHTML(item.nome)}
            </option>
            `;

        });

    }


    const filtro =
    obterElemento(
        'filtroLocalDashboard'
    );


    if(filtro){

        filtro.innerHTML =
        `
        <option value="">
            Todos os Locais
        </option>
        `;


        LOCAIS
        .slice()
        .sort(
            (a,b) =>
            a.nome.localeCompare(
                b.nome
            )
        )
        .forEach(localItem => {

            filtro.innerHTML +=
            `
            <option
                value="${escaparHTML(
                    localItem.nome.toLowerCase()
                )}"
            >
                ${escaparHTML(localItem.nome)}
            </option>
            `;

        });

    }


    const totalLocais =
    obterElemento(
        'totalLocais'
    );


    if(totalLocais){

        totalLocais.innerText =
        LOCAIS.length;

    }

}


/* =========================================================
   GERAR PRÓXIMO NÚMERO
   COMPATIBILIDADE COM REGISTROS ANTIGOS
========================================================= */

function gerarNumeroPatrimonio(){

    if(
        !Array.isArray(itens) ||
        itens.length === 0
    ){

        return 0;
    }


    const numeros =
    itens.map(item => {

        return parseInt(
            item.patrimonio
        ) || 0;

    });


    return Math.max(
        ...numeros
    );

}


/* =========================================================
   SALVAR ITEM / ESTOQUE
========================================================= */

async function salvarItem(){

    if(!usuarioPodeEditar()){

        alert(
            'Usuário sem permissão para cadastrar.'
        );

        return;
    }


    try{

        const nome =
        obterElemento('nome')
        ?.value
        ?.trim()
        || '';


        const tipo =
        obterElemento('tipoItem')
        ?.value
        ?.trim()
        || '';


        const descricao =
        obterElemento('descricao')
        ?.value
        ?.trim()
        || '';


        const quantidade =
        parseInt(
            obterElemento(
                'quantidadeLote'
            )
            ?.value
            || '1'
        );


        const local_id =
        obterElemento('local')
        ?.value
        || '';


        const status =
        obterElemento('status')
        ?.value
        || 'Ativo';


        const fotoInput =
        obterElemento('foto');


        const arquivo =
        fotoInput
        ?.files
        ?.[0]
        || null;


        if(!nome){

            alert(
                'Informe o nome do item.'
            );

            return;
        }


        if(!tipo){

            alert(
                'Informe o tipo / categoria.'
            );

            return;
        }


        if(
            !Number.isInteger(
                quantidade
            ) ||
            quantidade <= 0
        ){

            alert(
                'Informe uma quantidade válida.'
            );

            return;
        }


        if(!local_id){

            alert(
                'Selecione o local.'
            );

            return;
        }


        let foto_url =
        '';


        /* =================================================
           UPLOAD
        ================================================= */

        if(arquivo){

            const extensao =
            arquivo.name
            .split('.')
            .pop()
            ?.toLowerCase()
            || 'jpg';


            const nomeArquivo =
            `inventario/${Date.now()}_${Math.random()
                .toString(36)
                .substring(2,8)}.${extensao}`;


            const {
                error:uploadError
            } =
            await supabaseClient
            .storage
            .from('inventario')
            .upload(
                nomeArquivo,
                arquivo,
                {
                    upsert:false
                }
            );


            if(uploadError){

                console.error(
                    'Erro upload:',
                    uploadError
                );

                alert(
                    'Erro ao enviar a imagem.'
                );

                return;
            }


            const {
                data:urlData
            } =
            supabaseClient
            .storage
            .from('inventario')
            .getPublicUrl(
                nomeArquivo
            );


            foto_url =
            urlData
            ?.publicUrl
            || '';

        }


        /*
           IMPORTANTE:

           O sistema trabalha com estoque por
           quantidade.

           Portanto 300 copos são UM registro
           com quantidade = 300.

           Não criamos 300 patrimônios.
        */


        const novoItem = {

            nome:nome,

            tipo:tipo,

            descricao:descricao,

            quantidade:quantidade,

            local_id:Number(local_id),

            status:status,

            foto_url:foto_url

        };


        /*
           Compatibilidade:

           Caso sua tabela antiga ainda possua
           patrimônio obrigatório, tentamos gerar
           um código de referência.

           O estoque continua sendo controlado
           pela quantidade.
        */

        const proximoNumero =
        gerarNumeroPatrimonio() + 1;


        novoItem.patrimonio =
        String(proximoNumero)
        .padStart(4,'0');


        const {
            error
        } =
        await supabaseClient
        .from('itens')
        .insert([
            novoItem
        ]);


        if(error){

            console.error(
                'Erro ao cadastrar item:',
                error
            );

            alert(
                'Erro ao cadastrar o item. Verifique o console.'
            );

            return;
        }


        alert(
            `${quantidade} unidade(s) cadastrada(s) com sucesso!`
        );


        limparFormulario();


        await carregarDashboard();


    }catch(error){

        console.error(
            'Erro salvarItem:',
            error
        );

        alert(
            'Erro inesperado ao cadastrar item.'
        );
    }

}


/* =========================================================
   LIMPAR FORMULÁRIO
========================================================= */

function limparFormulario(){

    const campos = [

        'nome',
        'tipoItem',
        'descricao',
        'foto'

    ];


    campos.forEach(id => {

        const elemento =
        obterElemento(id);

        if(elemento){

            elemento.value =
            '';

        }

    });


    const quantidade =
    obterElemento(
        'quantidadeLote'
    );


    if(quantidade){

        quantidade.value =
        '1';

    }


    const local =
    obterElemento('local');


    if(local){

        local.value =
        '';

    }


    const status =
    obterElemento('status');


    if(status){

        status.value =
        'Ativo';

    }

}


/* =========================================================
   CARREGAR ITENS
========================================================= */

async function carregarItens(){

    try{

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
                ascending:false
            }
        );


        if(error){

            console.error(
                'Erro carregar itens:',
                error
            );

            alert(
                'Erro ao carregar o estoque.'
            );

            return;

        }


        itens =
        data || [];


        renderizarItens();

        atualizarTotaisEstoque();


    }catch(error){

        console.error(
            'Erro carregarItens:',
            error
        );

    }

}


/* =========================================================
   RENDERIZAR ESTOQUE
========================================================= */

function renderizarItens(){

    const tabela =
    obterElemento(
        'listaItens'
    );


    const itemMov =
    obterElemento(
        'itemMov'
    );


    if(tabela){

        tabela.innerHTML =
        '';

    }


    if(itemMov){

        itemMov.innerHTML =
        `
        <option value="">
            Selecione o Item
        </option>
        `;

    }


    itens.forEach(item => {

        const localNome =
        obterNomeLocal(
            item.local_id
        );


        const quantidade =
        numeroSeguro(
            item.quantidade
        );


        let classeStatus =
        '';


        if(
            item.status ===
            'Ativo'
        ){

            classeStatus =
            'ativo';

        }


        if(
            item.status ===
            'Em manutenção'
        ){

            classeStatus =
            'manutencao';

        }


        if(
            item.status ===
            'Baixado'
        ){

            classeStatus =
            'baixado';

        }


        if(
            item.status ===
            'Extraviado'
        ){

            classeStatus =
            'extraviado';

        }


        if(tabela){

            tabela.innerHTML +=
            `

            <tr>

                <td>

                    <img
                        src="${
                            item.foto_url ||
                            'https://placehold.co/60x60/png?text=IMG'
                        }"
                        alt="Foto do item"
                        onclick="abrirModalFoto('${String(
                            item.foto_url || ''
                        ).replace(/'/g,"\\'")}')"
                    >

                </td>


                <td>

                    ${
                        escaparHTML(
                            item.patrimonio ||
                            '-'
                        )
                    }

                </td>


                <td>

                    ${
                        escaparHTML(
                            item.tipo ||
                            '-'
                        )
                    }

                </td>


                <td>

                    ${
                        escaparHTML(
                            item.nome ||
                            '-'
                        )
                    }

                </td>


                <td>

                    ${
                        escaparHTML(
                            item.descricao ||
                            '-'
                        )
                    }

                </td>


                <td>

                    ${
                        escaparHTML(
                            localNome
                        )
                    }

                </td>


                <td>

                    <strong>
                        ${quantidade}
                    </strong>

                </td>


                <td>

                    <span
                        class="status ${classeStatus}"
                    >

                        ${
                            escaparHTML(
                                item.status ||
                                '-'
                            )
                        }

                    </span>

                </td>


                <td>

                    <div class="actions">

                        ${
                            usuarioPodeEditar()
                            ?

                            `

                            <button
                                class="btn-edit"
                                onclick="editarItem(${item.id})"
                            >

                                <i class="fa fa-pen"></i>
                                Editar

                            </button>


                            <button
                                class="btn-delete"
                                onclick="excluirItem(${item.id})"
                            >

                                <i class="fa fa-trash"></i>
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


        if(itemMov){

            itemMov.innerHTML +=
            `

            <option
                value="${item.id}"
            >

                ${escaparHTML(
                    item.nome || '-'
                )}

                — ${escaparHTML(
                    item.tipo || '-'
                )}

                — ${escaparHTML(
                    localNome
                )}

                — ${quantidade} un.

            </option>

            `;

        }

    });

}


/* =========================================================
   ATUALIZAR TOTAIS
========================================================= */

function atualizarTotaisEstoque(){

    const totalItens =
    obterElemento(
        'totalItens'
    );


    const totalBaixados =
    obterElemento(
        'totalBaixados'
    );


    const totalQuantidade =
    itens.reduce(
        (
            total,
            item
        ) =>
        total +
        numeroSeguro(
            item.quantidade
        ),
        0
    );


    if(totalItens){

        totalItens.innerText =
        totalQuantidade;

    }


    if(totalBaixados){

        totalBaixados.innerText =
        itens
        .filter(
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
            numeroSeguro(
                item.quantidade
            ),
            0
        );

    }

}


/* =========================================================
   EDITAR ITEM
========================================================= */

async function editarItem(id){

    if(!usuarioPodeEditar()){

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


    if(!item){

        alert(
            'Item não encontrado.'
        );

        return;
    }


    const novoNome =
    prompt(
        'Nome do item:',
        item.nome || ''
    );


    if(
        novoNome === null
    ){

        return;
    }


    const nome =
    novoNome.trim();


    if(!nome){

        alert(
            'O nome não pode ficar vazio.'
        );

        return;
    }


    const novaQuantidade =
    prompt(
        'Quantidade atual:',
        numeroSeguro(
            item.quantidade
        )
    );


    if(
        novaQuantidade === null
    ){

        return;
    }


    const quantidade =
    parseInt(
        novaQuantidade
    );


    if(
        !Number.isInteger(
            quantidade
        ) ||
        quantidade < 0
    ){

        alert(
            'Quantidade inválida.'
        );

        return;
    }


    const novoTipo =
    prompt(
        'Tipo / Categoria:',
        item.tipo || ''
    );


    if(
        novoTipo === null
    ){

        return;
    }


    const tipo =
    novoTipo.trim();


    const {
        error
    } =
    await supabaseClient
    .from('itens')
    .update({

        nome:nome,

        tipo:tipo,

        quantidade:quantidade

    })
    .eq(
        'id',
        id
    );


    if(error){

        console.error(
            'Erro editar:',
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

async function excluirItem(id){

    if(!usuarioPodeEditar()){

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


    if(!item){

        return;
    }


    const confirmar =
    confirm(
        `Deseja excluir "${item.nome}" do estoque?`
    );


    if(!confirmar){

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


    if(error){

        console.error(
            'Erro excluir:',
            error
        );

        alert(
            'Erro ao excluir o item.'
        );

        return;
    }


    alert(
        'Item excluído com sucesso!'
    );


    await carregarDashboard();

}


/* =========================================================
   PREENCHER ORIGEM AUTOMATICAMENTE
========================================================= */

function preencherOrigemAutomaticamente(){

    const selectItem =
    obterElemento(
        'itemMov'
    );


    const origemInput =
    obterElemento(
        'origemNome'
    );


    if(
        !selectItem ||
        !origemInput
    ){

        return;
    }


    const itemId =
    selectItem.value;


    if(!itemId){

        origemInput.value =
        '';

        atualizarQuantidadeDisponivel();

        return;
    }


    const item =
    itens.find(
        registro =>
        String(registro.id) ===
        String(itemId)
    );


    if(!item){

        origemInput.value =
        '';

        atualizarQuantidadeDisponivel();

        return;
    }


    origemInput.value =
    obterNomeLocal(
        item.local_id
    );


    atualizarQuantidadeDisponivel();

}


/* =========================================================
   QUANTIDADE DISPONÍVEL
========================================================= */

function atualizarQuantidadeDisponivel(){

    const itemMov =
    obterElemento(
        'itemMov'
    );


    const quantidadeCampo =
    obterElemento(
        'quantidadeMov'
    );


    if(
        !itemMov ||
        !quantidadeCampo
    ){

        return;
    }


    const item =
    itens.find(
        registro =>
        String(registro.id) ===
        String(itemMov.value)
    );


    if(!item){

        quantidadeCampo.max =
        '';

        quantidadeCampo.value =
        1;

        return;
    }


    const quantidade =
    numeroSeguro(
        item.quantidade
    );


    quantidadeCampo.max =
    quantidade;


    if(
        quantidade <= 0
    ){

        quantidadeCampo.value =
        0;

    }else{

        quantidadeCampo.value =
        1;

    }

}


/* =========================================================
   MOVIMENTAR ITEM
========================================================= */

async function movimentarItem(){

    if(!usuarioPodeMovimentar()){

        alert(
            'Usuário sem permissão para movimentar estoque.'
        );

        return;
    }


    try{

        const item_id =
        obterElemento(
            'itemMov'
        )
        ?.value
        || '';


        const destino_id =
        obterElemento(
            'destino'
        )
        ?.value
        || '';


        const quantidadeMov =
        parseInt(
            obterElemento(
                'quantidadeMov'
            )
            ?.value
            || '0'
        );


        const observacao =
        obterElemento(
            'observacaoMov'
        )
        ?.value
        ?.trim()
        || '';


        const statusMov =
        obterElemento(
            'statusMov'
        )
        ?.value
        || '';


        if(!item_id){

            alert(
                'Selecione o item.'
            );

            return;
        }


        if(!destino_id){

            alert(
                'Selecione o destino.'
            );

            return;
        }


        if(
            !Number.isInteger(
                quantidadeMov
            ) ||
            quantidadeMov <= 0
        ){

            alert(
                'Informe uma quantidade válida.'
            );

            return;
        }


        const item =
        itens.find(
            registro =>
            String(registro.id) ===
            String(item_id)
        );


        if(!item){

            alert(
                'Item não encontrado.'
            );

            return;
        }


        const origem_id =
        Number(
            item.local_id
        );


        const estoqueAtual =
        numeroSeguro(
            item.quantidade
        );


        if(
            quantidadeMov >
            estoqueAtual
        ){

            alert(
                `Quantidade insuficiente. Estoque disponível: ${estoqueAtual}.`
            );

            return;
        }


        /*
           CASO ESPECIAL:

           Se o destino for o mesmo local,
           não faz sentido criar movimentação.
        */

        if(
            Number(destino_id) ===
            origem_id
        ){

            alert(
                'O destino é igual ao local atual.'
            );

            return;
        }


        /*
           ==================================================
           ESTRATÉGIA DE ESTOQUE

           Exemplo:

           CD1:
           300 copos

           Movimentação:
           100 copos → DORYO

           Resultado:

           CD1:
           200 copos

           DORYO:
           100 copos

           Portanto o sistema precisa:

           1. Diminuir o registro de origem.
           2. Procurar registro igual no destino.
           3. Se existir, somar quantidade.
           4. Se não existir, criar registro.
        */


        const novaQuantidadeOrigem =
        estoqueAtual -
        quantidadeMov;


        /*
           ==================================================
           ATUALIZA ORIGEM
        ==================================================
        */

        const {
            error:erroOrigem
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


        if(erroOrigem){

            console.error(
                'Erro ao atualizar origem:',
                erroOrigem
            );

            alert(
                'Erro ao retirar quantidade do local de origem.'
            );

            return;
        }


        /*
           ==================================================
           PROCURAR MESMO ITEM NO DESTINO
        ==================================================
        */

        const {
            data:itensDestino,
            error:erroBuscaDestino
        } =
        await supabaseClient
        .from('itens')
        .select('*')
        .eq(
            'nome',
            item.nome
        )
        .eq(
            'tipo',
            item.tipo
        )
        .eq(
            'local_id',
            Number(destino_id)
        )
        .eq(
            'status',
            statusMov ||
            item.status
        );


        if(erroBuscaDestino){

            console.error(
                'Erro buscar destino:',
                erroBuscaDestino
            );


            /*
               TENTA REVERTER A ORIGEM
            */

            await supabaseClient
            .from('itens')
            .update({

                quantidade:
                estoqueAtual

            })
            .eq(
                'id',
                item.id
            );


            alert(
                'Erro ao localizar o estoque de destino.'
            );

            return;
        }


        const itemDestino =
        itensDestino?.[0]
        || null;


        let destinoItemId =
        null;


        /*
           ==================================================
           DESTINO JÁ EXISTE
        ==================================================
        */

        if(itemDestino){

            const quantidadeDestinoAtual =
            numeroSeguro(
                itemDestino.quantidade
            );


            const novaQuantidadeDestino =
            quantidadeDestinoAtual +
            quantidadeMov;


            const {
                error:erroDestinoUpdate
            } =
            await supabaseClient
            .from('itens')
            .update({

                quantidade:
                novaQuantidadeDestino

            })
            .eq(
                'id',
                itemDestino.id
            );


            if(erroDestinoUpdate){

                console.error(
                    'Erro atualizar destino:',
                    erroDestinoUpdate
                );


                /*
                   REVERTER ORIGEM
                */

                await supabaseClient
                .from('itens')
                .update({

                    quantidade:
                    estoqueAtual

                })
                .eq(
                    'id',
                    item.id
                );


                alert(
                    'Erro ao adicionar quantidade ao destino.'
                );

                return;
            }


            destinoItemId =
            itemDestino.id;

        }


        /*
           ==================================================
           DESTINO NÃO EXISTE
        ==================================================
        */

        else{

            const novoDestino = {

                patrimonio:
                item.patrimonio
                || '',

                nome:
                item.nome,

                tipo:
                item.tipo,

                descricao:
                item.descricao,

                quantidade:
                quantidadeMov,

                local_id:
                Number(destino_id),

                status:
                statusMov ||
                item.status,

                foto_url:
                item.foto_url ||
                ''

            };


            const {
                data:novoRegistroDestino,
                error:erroNovoDestino
            } =
            await supabaseClient
            .from('itens')
            .insert([
                novoDestino
            ])
            .select()
            .single();


            if(erroNovoDestino){

                console.error(
                    'Erro criar destino:',
                    erroNovoDestino
                );


                /*
                   REVERTER ORIGEM
                */

                await supabaseClient
                .from('itens')
                .update({

                    quantidade:
                    estoqueAtual

                })
                .eq(
                    'id',
                    item.id
                );


                alert(
                    'Erro ao criar o estoque no destino.'
                );

                return;
            }


            destinoItemId =
            novoRegistroDestino?.id
            || null;

        }


        /*
           ==================================================
           HISTÓRICO
        ==================================================
        */

        const {
            error:erroHistorico
        } =
        await supabaseClient
        .from('movimentacoes')
        .insert([{

            item_id:
            Number(item.id),

            origem_id:
            origem_id,

            destino_id:
            Number(destino_id),

            quantidade:
            quantidadeMov,

            observacao:
            observacao,

            data:
            new Date().toISOString()

        }]);


        if(erroHistorico){

            console.warn(
                'Movimentação realizada, mas histórico não foi salvo:',
                erroHistorico
            );

        }


        /*
           ==================================================
           STATUS DA ORIGEM
        ==================================================

           Se acabou o estoque, podemos manter o registro
           com quantidade 0.

           Isso é melhor para preservar histórico e
           rastreabilidade.
        */


        if(
            novaQuantidadeOrigem ===
            0
        ){

            /*
               Não excluímos o registro.
               Apenas deixamos quantidade 0.
            */

        }


        /*
           ==================================================
           LIMPAR FORMULÁRIO
        ==================================================
        */

        const itemMov =
        obterElemento(
            'itemMov'
        );


        const destino =
        obterElemento(
            'destino'
        );


        const origemNome =
        obterElemento(
            'origemNome'
        );


        const quantidadeCampo =
        obterElemento(
            'quantidadeMov'
        );


        const observacaoCampo =
        obterElemento(
            'observacaoMov'
        );


        const statusCampo =
        obterElemento(
            'statusMov'
        );


        if(itemMov){

            itemMov.value =
            '';

        }


        if(destino){

            destino.value =
            '';

        }


        if(origemNome){

            origemNome.value =
            '';

        }


        if(quantidadeCampo){

            quantidadeCampo.value =
            '1';

        }


        if(observacaoCampo){

            observacaoCampo.value =
            '';

        }


        if(statusCampo){

            statusCampo.value =
            '';

        }


        alert(
            `${quantidadeMov} unidade(s) movimentada(s) com sucesso!`
        );


        await carregarDashboard();


    }catch(error){

        console.error(
            'Erro movimentarItem:',
            error
        );

        alert(
            'Erro inesperado ao movimentar o estoque.'
        );

    }

}


/* =========================================================
   HISTÓRICO
========================================================= */

async function carregarHistorico(){

    try{

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
                ascending:false
            }
        );


        if(error){

            console.error(
                'Erro histórico:',
                error
            );

            return;
        }


        movimentacoes =
        data || [];


        const tabela =
        obterElemento(
            'historico'
        );


        if(!tabela){

            return;
        }


        tabela.innerHTML =
        '';


        movimentacoes.forEach(mov => {

            const item =
            itens.find(
                registro =>
                String(registro.id) ===
                String(mov.item_id)
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
            mov.quantidade !== undefined &&
            mov.quantidade !== null
            ?
            mov.quantidade
            :
            '-';


            const dataFormatada =
            mov.data
            ?
            new Date(
                mov.data
            ).toLocaleString(
                'pt-BR'
            )
            :
            '-';


            tabela.innerHTML +=
            `

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

        });


        const totalMov =
        obterElemento(
            'totalMov'
        );


        if(totalMov){

            totalMov.innerText =
            movimentacoes.length;

        }


    }catch(error){

        console.error(
            'Erro carregarHistorico:',
            error
        );

    }

}


/* =========================================================
   DASHBOARD STATUS
========================================================= */

function atualizarDashboardAvancado(){

    const dashAtivo =
    obterElemento(
        'dashAtivo'
    );


    const dashManutencao =
    obterElemento(
        'dashManutencao'
    );


    const dashBaixado =
    obterElemento(
        'dashBaixado'
    );


    const dashExtraviado =
    obterElemento(
        'dashExtraviado'
    );


    const contarStatus =
    status => {

        return itens
        .filter(
            item =>
            item.status ===
            status
        )
        .reduce(
            (
                total,
                item
            ) =>
            total +
            numeroSeguro(
                item.quantidade
            ),
            0
        );

    };


    if(dashAtivo){

        dashAtivo.innerText =
        contarStatus(
            'Ativo'
        );

    }


    if(dashManutencao){

        dashManutencao.innerText =
        contarStatus(
            'Em manutenção'
        );

    }


    if(dashBaixado){

        dashBaixado.innerText =
        contarStatus(
            'Baixado'
        );

    }


    if(dashExtraviado){

        dashExtraviado.innerText =
        contarStatus(
            'Extraviado'
        );

    }

}


/* =========================================================
   RELATÓRIO POR ITEM E LOCAL
========================================================= */

function gerarRelatorioLocais(){

    const tabela =
    obterElemento(
        'dashboardLocais'
    );


    if(!tabela){

        return;
    }


    tabela.innerHTML =
    '';


    const agrupado =
    {};


    itens.forEach(item => {

        const nomeLocal =
        obterNomeLocal(
            item.local_id
        );


        const nomeItem =
        item.nome ||
        'SEM NOME';


        const tipo =
        item.tipo ||
        'SEM CATEGORIA';


        const chave =
        `${nomeItem}||${tipo}||${nomeLocal}`;


        if(
            !agrupado[chave]
        ){

            agrupado[chave] = {

                item:
                nomeItem,

                tipo:
                tipo,

                local:
                nomeLocal,

                quantidade:
                0

            };

        }


        agrupado[chave]
        .quantidade +=
        numeroSeguro(
            item.quantidade
        );

    });


    Object.values(
        agrupado
    )
    .sort(
        (a,b) => {

            const localComparacao =
            a.local.localeCompare(
                b.local
            );


            if(
                localComparacao !== 0
            ){

                return localComparacao;

            }


            return a.item.localeCompare(
                b.item
            );

        }
    )
    .forEach(
        registro => {

            tabela.innerHTML +=
            `

            <tr>

                <td>

                    ${
                        escaparHTML(
                            registro.item
                        )
                    }

                </td>


                <td>

                    ${
                        escaparHTML(
                            registro.tipo
                        )
                    }

                </td>


                <td
                    data-local="${
                        escaparHTML(
                            registro.local.toLowerCase()
                        )
                    }"
                >

                    ${
                        escaparHTML(
                            registro.local
                        )
                    }

                </td>


                <td>

                    <strong>
                        ${registro.quantidade}
                    </strong>

                </td>

            </tr>

            `;

        }
    );

}


/* =========================================================
   FILTRAR DASHBOARD
========================================================= */

function filtrarDashboard(){

    const busca =
    obterElemento(
        'filtroDashboard'
    )
    ?.value
    ?.toLowerCase()
    ?.trim()
    || '';


    const localFiltro =
    obterElemento(
        'filtroLocalDashboard'
    )
    ?.value
    ?.toLowerCase()
    ?.trim()
    || '';


    const linhas =
    document.querySelectorAll(
        '#dashboardLocais tr'
    );


    linhas.forEach(linha => {

        const texto =
        linha.innerText
        ?.toLowerCase()
        || '';


        const local =
        linha
        .children[2]
        ?.dataset
        ?.local
        || '';


        const matchBusca =
        texto.includes(
            busca
        );


        const matchLocal =
        !localFiltro ||
        local ===
        localFiltro;


        linha.style.display =
        (
            matchBusca &&
            matchLocal
        )
        ?
        ''
        :
        'none';

    });

}


/* =========================================================
   FILTRO DE LOCAIS DO DASHBOARD
========================================================= */

function carregarFiltroLocaisDashboard(){

    const select =
    obterElemento(
        'filtroLocalDashboard'
    );


    if(!select){

        return;
    }


    select.innerHTML =
    `
    <option value="">
        Todos os Locais
    </option>
    `;


    LOCAIS
    .slice()
    .sort(
        (a,b) =>
        a.nome.localeCompare(
            b.nome
        )
    )
    .forEach(local => {

        select.innerHTML +=
        `
        <option
            value="${escaparHTML(
                local.nome.toLowerCase()
            )}"
        >
            ${escaparHTML(local.nome)}
        </option>
        `;

    });

}


/* =========================================================
   FILTRAR ITENS DO ESTOQUE
========================================================= */

function filtrarItens(){

    const termo =
    obterElemento(
        'busca'
    )
    ?.value
    ?.toLowerCase()
    ?.trim()
    || '';


    const linhas =
    document.querySelectorAll(
        '#listaItens tr'
    );


    linhas.forEach(linha => {

        const texto =
        linha.innerText
        ?.toLowerCase()
        || '';


        linha.style.display =
        texto.includes(
            termo
        )
        ?
        ''
        :
        'none';

    });

}


/* =========================================================
   DASHBOARD COMPLETO
========================================================= */

async function carregarDashboard(){

    if(!supabaseClient){

        if(
            !inicializarSupabase()
        ){

            return;
        }

    }


    carregarLocais();


    await carregarItens();


    await carregarHistorico();


    atualizarDashboardAvancado();


    gerarRelatorioLocais();


    carregarFiltroLocaisDashboard();


    atualizarMenus();

}


/* =========================================================
   EXPORTAR EXCEL / CSV
========================================================= */

function exportarExcel(){

    if(
        !itens ||
        itens.length === 0
    ){

        alert(
            'Nenhum item cadastrado.'
        );

        return;
    }


    let csv =
    'PATRIMÔNIO;TIPO;NOME;DESCRIÇÃO;LOCAL;QUANTIDADE;STATUS\n';


    itens.forEach(item => {

        const local =
        obterNomeLocal(
            item.local_id
        );


        const linha = [

            item.patrimonio || '-',

            item.tipo || '-',

            item.nome || '-',

            item.descricao || '-',

            local,

            numeroSeguro(
                item.quantidade
            ),

            item.status || '-'

        ];


        csv +=
        linha
        .map(
            valor =>
            `"${String(valor)
                .replace(/"/g,'""')}"`
        )
        .join(';');


        csv +=
        '\n';

    });


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
   MODAL FOTO
========================================================= */

function abrirModalFoto(url){

    if(!url){

        return;
    }


    const modal =
    obterElemento(
        'modalFoto'
    );


    const imagem =
    obterElemento(
        'imagemModal'
    );


    if(
        !modal ||
        !imagem
    ){

        return;
    }


    imagem.src =
    url;


    modal.classList.add(
        'active'
    );

}


function fecharModalFoto(){

    const modal =
    obterElemento(
        'modalFoto'
    );


    if(modal){

        modal.classList.remove(
            'active'
        );

    }

}


/* =========================================================
   MENU / TELAS
========================================================= */

function abrirTela(
    idTela,
    elemento
){

    if(
        !usuarioLogado &&
        idTela !==
        'loginTela'
    ){

        alert(
            'Faça login primeiro.'
        );

        return;
    }


    const tela =
    obterElemento(
        idTela
    );


    if(!tela){

        console.warn(
            `Tela ${idTela} não encontrada.`
        );

        return;
    }


    const telas =
    document.querySelectorAll(
        '.tela'
    );


    telas.forEach(
        telaItem => {

            telaItem.classList.remove(
                'activeTela'
            );

        }
    );


    tela.classList.add(
        'activeTela'
    );


    const menus =
    document.querySelectorAll(
        '.menu-item'
    );


    menus.forEach(
        menu => {

            menu.classList.remove(
                'active'
            );

        }
    );


    if(elemento){

        elemento.classList.add(
            'active'
        );

    }


    if(
        window.innerWidth <=
        900
    ){

        const sidebar =
        obterElemento(
            'sidebar'
        );


        if(sidebar){

            sidebar.classList.remove(
                'open'
            );

        }

    }


    /*
       Sempre que entrar na tela de movimentação,
       atualizamos os locais.
    */

    if(
        idTela ===
        'movimentacaoTela'
    ){

        carregarLocais();

        renderizarItens();

    }


    /*
       Sempre que entrar no cadastro,
       atualizamos os locais.
    */

    if(
        idTela ===
        'cadastroTela'
    ){

        carregarLocais();

    }

}


/* =========================================================
   MENU MOBILE
========================================================= */

function toggleSidebar(){

    const sidebar =
    obterElemento(
        'sidebar'
    );


    if(!sidebar){

        return;
    }


    sidebar.classList.toggle(
        'open'
    );

}


/* =========================================================
   FECHAR MENU AO CLICAR FORA
========================================================= */

document.addEventListener(
    'click',
    function(event){

        const sidebar =
        obterElemento(
            'sidebar'
        );


        const menuBtn =
        document.querySelector(
            '.mobile-menu-btn'
        );


        if(
            !sidebar ||
            !menuBtn
        ){

            return;
        }


        const clicouDentro =
        sidebar.contains(
            event.target
        );


        const clicouBotao =
        menuBtn.contains(
            event.target
        );


        if(
            window.innerWidth <=
            900 &&
            !clicouDentro &&
            !clicouBotao
        ){

            sidebar.classList.remove(
                'open'
            );

        }

    }
);


/* =========================================================
   FECHAR MODAL COM ESC
========================================================= */

document.addEventListener(
    'keydown',
    function(event){

        if(
            event.key ===
            'Escape'
        ){

            fecharModalFoto();

        }

    }
);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function inicializarSistema(){

    if(
        sistemaInicializado
    ){

        return;
    }


    sistemaInicializado =
    true;


    console.log(
        'Inicializando Sistema de Inventário Central...'
    );


    /*
       IMPORTANTE:

       O Supabase precisa estar disponível
       antes de qualquer chamada.
    */

    if(
        !inicializarSupabase()
    ){

        alert(
            'Não foi possível carregar o Supabase.'
        );

        return;
    }


    /*
       Locais carregados imediatamente.
    */

    carregarLocais();


    /*
       Antes do login:
       nenhum menu operacional.
    */

    usuarioLogado =
    null;

    perfilUsuario =
    null;


    atualizarMenus();


    /*
       Verifica sessão existente.
    */

    try{

        const {
            data,
            error
        } =
        await supabaseClient
        .auth
        .getSession();


        if(error){

            console.error(
                'Erro getSession:',
                error
            );

        }


        if(
            data?.session
        ){

            usuarioLogado =
            data.session.user;


            await verificarPerfil();


            atualizarMenus();


            abrirTela(
                'dashboardTela',
                obterElemento(
                    'menuDashboard'
                )
            );


            await carregarDashboard();


            console.log(
                'Sessão restaurada:',
                usuarioLogado.email
            );


        }else{

            abrirTela(
                'loginTela',
                obterElemento(
                    'menuLogin'
                )
            );


            console.log(
                'Nenhuma sessão ativa.'
            );

        }


    }catch(error){

        console.error(
            'Erro ao verificar sessão:',
            error
        );


        usuarioLogado =
        null;


        perfilUsuario =
        null;


        atualizarMenus();


        abrirTela(
            'loginTela',
            obterElemento(
                'menuLogin'
            )
        );

    }


    /*
       Listener para mudanças de autenticação.
    */

    supabaseClient
    .auth
    .onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                'Auth:',
                event
            );


            if(session?.user){

                usuarioLogado =
                session.user;


                await verificarPerfil();


                atualizarMenus();

            }else{

                usuarioLogado =
                null;


                perfilUsuario =
                null;


                atualizarMenus();

            }

        }
    );


    console.log(
        'Sistema conectado ao Supabase!'
    );

}

/* =========================================================
   EVENTO DO FORMULÁRIO DE LOGIN
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function(){

        const loginForm =
        document.getElementById(
            'loginForm'
        );


        if(!loginForm){

            console.error(
                'ERRO: formulário loginForm não encontrado.'
            );

            return;
        }


        loginForm.addEventListener(
            'submit',
            async function(event){

                event.preventDefault();

                console.log(
                    'FORMULÁRIO DE LOGIN ENVIADO'
                );

                await login();

            }
        );

    }
);
/* =========================================================
   WINDOW LOAD
========================================================= */

window.addEventListener(
    'load',
    inicializarSistema
);
/* =========================================================
   EVENTO DO FORMULÁRIO DE LOGIN
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function(){

        const loginForm =
        document.getElementById(
            'loginForm'
        );


        if(!loginForm){

            console.error(
                'ERRO: formulário loginForm não encontrado.'
            );

            return;
        }


        loginForm.addEventListener(
            'submit',
            async function(event){

                event.preventDefault();

                console.log(
                    'FORMULÁRIO DE LOGIN ENVIADO'
                );

                await login();

            }
        );

    }
);


/* =========================================================
   WINDOW LOAD
========================================================= */

window.addEventListener(
    'load',
    inicializarSistema
);

