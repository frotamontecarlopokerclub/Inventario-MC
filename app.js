/* =====================================================
   CONFIGURAÇÃO SUPABASE
===================================================== */

/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    'https://sxmimxomehdhyifqsgqa.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_NbyYYTsRnSqu_TMpQvzS6A_rJuyzq9_';


/* =====================================================
   CLIENTE SUPABASE
===================================================== */

if (
    !window.supabase ||
    typeof window.supabase.createClient !== 'function'
) {

    console.error(
        'Biblioteca Supabase não carregada.'
    );

} else {

    window.supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

}


/* =====================================================
   VALIDAÇÃO DO CLIENTE SUPABASE
===================================================== */

if (!window.supabaseClient) {

    console.error(
        'Cliente Supabase não foi inicializado. ' +
        'Verifique se o script do Supabase foi carregado antes do app.js.'
    );

}


/* =====================================================
   VARIÁVEIS GLOBAIS
===================================================== */

let usuarioLogado = null;

let perfilUsuario = null;

let itens = [];

let movimentacoes = [];

/* =====================================================
   LOCAIS FIXOS
===================================================== */

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

/* =====================================================
   NORMALIZAR TEXTO
===================================================== */

function normalizarTexto(texto) {

    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

}


/* =====================================================
   ESCAPAR HTML
===================================================== */

function escaparHTML(valor) {

    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


/* =====================================================
   PERMISSÃO
===================================================== */

function usuarioPodeGerenciar() {

    return (
        perfilUsuario &&
        normalizarTexto(perfilUsuario) !== 'consulta'
    );

}


function exigirPermissaoGestor() {

    if (!usuarioPodeGerenciar()) {

        alert(
            'Usuário sem permissão para realizar esta operação.'
        );

        return false;
    }

    return true;
}


/* =====================================================
   MENUS
===================================================== */

function atualizarMenus() {

    const menus = {

        login:
            document.getElementById('menuLogin'),

        dashboard:
            document.getElementById('menuDashboard'),

        cadastro:
            document.getElementById('menuCadastro'),

        movimentacao:
            document.getElementById('menuMovimentacao'),

        estoque:
            document.getElementById('menuEstoque'),

        historico:
            document.getElementById('menuHistorico'),

        logout:
            document.getElementById('menuLogout')

    };


    Object.values(menus).forEach(menu => {

        if (menu)
            menu.style.display = 'none';

    });


    if (!usuarioLogado) {

        if (menus.login)
            menus.login.style.display = 'flex';

        return;
    }


    if (menus.dashboard)
        menus.dashboard.style.display = 'flex';

    if (menus.estoque)
        menus.estoque.style.display = 'flex';

    if (menus.historico)
        menus.historico.style.display = 'flex';

    if (menus.logout)
        menus.logout.style.display = 'flex';


    if (
        normalizarTexto(perfilUsuario) ===
        'consulta'
    ) {

        if (menus.cadastro)
            menus.cadastro.style.display = 'none';

        if (menus.movimentacao)
            menus.movimentacao.style.display = 'none';

    } else {

        if (menus.cadastro)
            menus.cadastro.style.display = 'flex';

        if (menus.movimentacao)
            menus.movimentacao.style.display = 'flex';

    }

    atualizarUsuarioInterface();

}


/* =====================================================
   INTERFACE USUÁRIO
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


    if (usuarioNome)
        usuarioNome.innerText = nome;

    if (usuarioPerfil)
        usuarioPerfil.innerText = perfil;

    if (topbarUserName)
        topbarUserName.innerText = nome;

    if (topbarUserRole)
        topbarUserRole.innerText = perfil;

}


/* =====================================================
   ABRIR TELA
===================================================== */

function abrirTela(id, botao = null) {

    document
        .querySelectorAll('.tela')
        .forEach(tela => {

            tela.classList.remove(
                'activeTela'
            );

        });


    const tela =
        document.getElementById(id);

    if (tela)
        tela.classList.add(
            'activeTela'
        );


    document
        .querySelectorAll('.menu-item')
        .forEach(menu => {

            menu.classList.remove(
                'active'
            );

        });


    if (botao)
        botao.classList.add(
            'active'
        );


    atualizarTituloTela(id);

    toggleSidebar(false);


    if (id === 'dashboardTela') {

        carregarDashboard();

    }

    if (id === 'estoqueTela') {

        carregarItens();

    }

    if (id === 'historicoTela') {

        carregarItens()
            .then(() =>
                carregarHistorico()
            );

    }

}


/* =====================================================
   TÍTULO DA TELA
===================================================== */

function atualizarTituloTela(id) {

    const titles = {

        loginTela:
            [
                'Sistema',
                'Inventário Central Grupo Monte Carlo'
            ],

        dashboardTela:
            [
                'Dashboard',
                'Dashboard'
            ],

        cadastroTela:
            [
                'Inventário',
                'Cadastro de patrimônio'
            ],

        movimentacaoTela:
            [
                'Logística',
                'Movimentar Item'
            ],

        estoqueTela:
            [
                'Inventário',
                'Estoque'
            ],

        historicoTela:
            [
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


    if (breadcrumb)
        breadcrumb.innerText =
            dados[0];

    if (title)
        title.innerText =
            dados[1];

}


/* =====================================================
   SIDEBAR MOBILE
===================================================== */

function toggleSidebar(force = null) {

    const sidebar =
        document.getElementById(
            'sidebar'
        );

    const overlay =
        document.getElementById(
            'sidebarOverlay'
        );


    if (!sidebar)
        return;


    let abrir =
        force;


    if (abrir === null) {

        abrir =
            !sidebar.classList.contains(
                'sidebar-open'
            );

    }


    sidebar.classList.toggle(
        'sidebar-open',
        abrir
    );


    if (overlay)
        overlay.classList.toggle(
            'show',
            abrir
        );

}


/* =====================================================
   LOGIN
===================================================== */

async function login() {

    const email =
        document.getElementById(
            'email'
        )?.value
        ?.trim();

    const senha =
        document.getElementById(
            'senha'
        )?.value;


    if (!email || !senha) {

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
            await window.supabaseClient
                .auth
                .signInWithPassword({

                    email,
                    password: senha

                });


        if (error) {

            console.error(error);

            alert(
                'Erro ao entrar:\n' +
                error.message
            );

            return;
        }


        usuarioLogado =
            data.user;


        await verificarPerfil();


        if (!perfilUsuario) {

            await window.supabaseClient
                .auth
                .signOut();

            usuarioLogado = null;

            alert(
                'Usuário autenticado, porém sem perfil cadastrado.'
            );

            atualizarMenus();

            abrirTela(
                'loginTela',
                document.getElementById(
                    'menuLogin'
                )
            );

            return;
        }


        atualizarMenus();

        atualizarUsuarioInterface();


        abrirTela(
            'dashboardTela',
            document.getElementById(
                'menuDashboard'
            )
        );


        await carregarDashboard();


    } catch (err) {

        console.error(err);

        alert(
            'Erro inesperado ao realizar login.'
        );

    }

}

/* =====================================================
   VERIFICAR PERFIL
===================================================== */

async function verificarPerfil() {

    perfilUsuario = null;


    if (!usuarioLogado)
        return;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
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

        console.error(err);

    }

}

/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    try {

        await supabaseClient
            .auth
            .signOut();

    } catch (err) {

        console.error(err);

    }

}


/* =====================================================
   LOCAIS
===================================================== */

async function carregarLocaisBanco() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from('locais')
                .select('*')
                .order(
                    'nome',
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                'Erro ao carregar locais:',
                error
            );

            return;
        }


        LOCAIS =
            data || [];


        carregarLocais();

        carregarFiltroLocaisDashboard();


    } catch (err) {

        console.error(err);

    }

}


function carregarLocais() {

    const local =
        document.getElementById(
            'local'
        );

    const destino =
        document.getElementById(
            'destino'
        );


    if (local) {

        local.innerHTML =
            '<option value="">Selecione o Local</option>';


        LOCAIS.forEach(item => {

            local.innerHTML += `
                <option value="${item.id}">
                    ${escaparHTML(item.nome)}
                </option>
            `;

        });

    }


    if (destino) {

        destino.innerHTML =
            '<option value="">Selecione o Destino</option>';


        LOCAIS.forEach(item => {

            destino.innerHTML += `
                <option value="${item.id}">
                    ${escaparHTML(item.nome)}
                </option>
            `;

        });

    }

}


/* =====================================================
   NOME LOCAL
===================================================== */

function obterNomeLocal(id) {

    const local =
        LOCAIS.find(
            item =>
                String(item.id) ===
                String(id)
        );


    return local?.nome ||
        'SEM LOCAL';

}


/* =====================================================
   TIPO DE CONTROLE
===================================================== */

function obterTipoControleCadastro() {

    const radio =
        document.querySelector(
            'input[name="tipoControle"]:checked'
        );


    return radio?.value ||
        'estoque';

}


function itemEhEstoque(item) {

    return (
        normalizarTexto(
            item.controle
        ) ===
        'estoque'
        ||
        normalizarTexto(
            item.tipo_controle
        ) ===
        'estoque'
        ||
        normalizarTexto(
            item.patrimonio
        ) ===
        ''
    );

}


/* =====================================================
   ALTERNAR CONTROLE
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

        if (quantidade)
            quantidade.value = '1';

        if (campoQuantidade)
            campoQuantidade.style.display =
                'none';

    } else {

        if (campoQuantidade)
            campoQuantidade.style.display =
                '';

    }

}


/* =====================================================
   GERAR NÚMERO PATRIMÔNIO
===================================================== */

function gerarNumeroPatrimonio() {

    if (!itens.length)
        return 0;


    const numeros =
        itens
            .map(item =>
                parseInt(
                    item.patrimonio,
                    10
                ) || 0
            );


    return Math.max(
        ...numeros
    );

}


/* =====================================================
   GRUPO DE ESTOQUE
===================================================== */

function obterGrupoEstoque(item) {

    if (!item)
        return [];


    return itens.filter(i => {

        return (
            itemEhEstoque(i) &&
            normalizarTexto(i.nome) ===
            normalizarTexto(item.nome) &&
            String(i.local_id) ===
            String(item.local_id)
        );

    });

}


/* =====================================================
   SALVAR ITEM
===================================================== */

async function salvarItem() {

    if (!exigirPermissaoGestor())
        return;


    try {

        const nomeElement =
            document.getElementById(
                'nome'
            );

        const descricaoElement =
            document.getElementById(
                'descricao'
            );

        const tipoElement =
            document.getElementById(
                'tipoItem'
            );

        const quantidadeElement =
            document.getElementById(
                'quantidadeLote'
            );

        const localElement =
            document.getElementById(
                'local'
            );

        const statusElement =
            document.getElementById(
                'status'
            );

        const fotoInput =
            document.getElementById(
                'foto'
            );


        const nome =
            nomeElement?.value
                ?.trim() || '';


        const descricao =
            descricaoElement?.value
                ?.trim() || '';


        const tipo =
            tipoElement?.value
                ?.trim() ||
            nome;


        const quantidade =
            parseInt(
                quantidadeElement?.value ||
                '1',
                10
            );


        const local_id =
            localElement?.value ||
            '';


        const status =
            statusElement?.value ||
            'Ativo';


        const arquivo =
            fotoInput?.files?.[0];


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


        let foto_url = '';


        /* =================================================
           UPLOAD FOTO
        ================================================= */

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
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from('inventario')
                    .upload(
                        nomeArquivo,
                        arquivo,
                        {
                            upsert: true
                        }
                    );


            if (uploadError) {

                console.error(
                    uploadError
                );

                alert(
                    'Erro ao enviar a imagem.'
                );

                return;
            }


            const {
                data: urlData
            } =
                supabaseClient
                    .storage
                    .from('inventario')
                    .getPublicUrl(
                        nomeArquivo
                    );


            foto_url =
                urlData?.publicUrl ||
                '';

        }


        /* =================================================
           ESTOQUE POR QUANTIDADE
        ================================================= */

        if (
            controle ===
            'estoque'
        ) {

            const lote = [];


            /*
               Cada unidade recebe um registro
               interno, mas não recebe número
               de patrimônio.
            */

            for (
                let i = 0;
                i < quantidade;
                i++
            ) {

                lote.push({

                    patrimonio: '',

                    nome,

                    tipo,

                    descricao,

                    local_id:
                        Number(local_id),

                    status,

                    foto_url,

                    controle:
                        'Estoque'

                });

            }


            const {
                error
            } =
                await supabaseClient
                    .from('itens')
                    .insert(lote);


            if (error) {

                console.error(
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


            /* =================================================
               PATRIMÔNIO INDIVIDUAL
            ================================================= */

            let maiorNumero =
                gerarNumeroPatrimonio();


            const lote = [];


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
                        ).padStart(
                            4,
                            '0'
                        ),

                    nome,

                    tipo,

                    descricao,

                    local_id:
                        Number(local_id),

                    status,

                    foto_url,

                    controle:
                        'Patrimônio'

                });

            }


            const {
                error
            } =
                await supabaseClient
                    .from('itens')
                    .insert(lote);


            if (error) {

                console.error(
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

        console.error(err);

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
    ].forEach(id => {

        const campo =
            document.getElementById(
                id
            );

        if (campo)
            campo.value = '';

    });


    const local =
        document.getElementById(
            'local'
        );

    if (local)
        local.value = '';


    const status =
        document.getElementById(
            'status'
        );

    if (status)
        status.value = 'Ativo';


    const quantidade =
        document.getElementById(
            'quantidadeLote'
        );

    if (quantidade)
        quantidade.value = '1';


    const estoque =
        document.getElementById(
            'controleEstoque'
        );

    if (estoque)
        estoque.checked = true;


    alternarTipoControle();

}


/* =====================================================
   CARREGAR ITENS
===================================================== */

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
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                'Erro ao carregar itens:',
                error
            );

            alert(
                'Erro ao carregar patrimônios:\n' +
                error.message
            );

            return;
        }


        itens =
            data || [];


        const tabela =
            document.getElementById(
                'listaItens'
            );


        const itemMov =
            document.getElementById(
                'itemMov'
            );


        if (tabela)
            tabela.innerHTML = '';


        if (itemMov) {

            itemMov.innerHTML = `
                <option value="">
                    Selecione o item
                </option>
            `;

        }


        /*
           Agrupar estoque por:
           nome + tipo + local
        */

        const gruposEstoque = {};

        const registrosPatrimonio = [];


        itens.forEach(item => {

            if (
                itemEhEstoque(item)
            ) {

                const chave =
                    `${normalizarTexto(item.nome)}||${normalizarTexto(item.tipo || item.nome)}||${item.local_id}`;


                if (
                    !gruposEstoque[chave]
                ) {

                    gruposEstoque[chave] = {

                        item,

                        quantidade: 0

                    };

                }


                gruposEstoque[chave]
                    .quantidade++;


            } else {

                registrosPatrimonio
                    .push(item);

            }

        });


        /*
           EXIBIR ESTOQUES
        */

        Object.values(
            gruposEstoque
        ).forEach(grupo => {

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
                    : normalizarTexto(
                        item.status
                    ) === 'em manutencao'
                        ? 'manutencao'
                        : normalizarTexto(
                            item.status
                        ) === 'baixado'
                            ? 'baixado'
                            : 'extraviado';


            if (tabela) {

                tabela.innerHTML += `

                    <tr>

                        <td>

                            <img
                                src="${escaparHTML(item.foto_url || 'https://placehold.co/80x80/png?text=IMG')}"
                                alt="Foto"
                                onclick="abrirModalFoto('${escaparHTML(item.foto_url || '')}')"
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

                            <span
                                class="status ${classeStatus}"
                            >
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
                                        onclick="editarEstoque('${encodeURIComponent(item.nome)}','${item.local_id}')"
                                    >

                                        <i class="fa-solid fa-pen"></i>

                                        Editar

                                    </button>


                                    <button
                                        class="btn-delete"
                                        type="button"
                                        onclick="excluirEstoque('${encodeURIComponent(item.nome)}','${item.local_id}')"
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

        });


        /*
           EXIBIR PATRIMÔNIOS
        */

        registrosPatrimonio
            .forEach(item => {

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
                                    src="${escaparHTML(item.foto_url || 'https://placehold.co/80x80/png?text=IMG')}"
                                    alt="Foto"
                                    onclick="abrirModalFoto('${escaparHTML(item.foto_url || '')}')"
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

                                <span
                                    class="status ${classeStatus}"
                                >

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

            });


        const totalItens =
            document.getElementById(
                'totalItens'
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
                        ) === 'baixado'
                ).length;

        }


    } catch (err) {

        console.error(
            'Erro inesperado ao carregar itens:',
            err
        );

    }

}


/* =====================================================
   EDITAR PATRIMÔNIO
===================================================== */

async function editarItem(id) {

    if (!exigirPermissaoGestor())
        return;


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
            item.nome || ''
        );


    if (
        novoNome === null ||
        !novoNome.trim()
    )
        return;


    const {
        error
    } =
        await supabaseClient
            .from('itens')
            .update({
                nome:
                    novoNome.trim()
            })
            .eq(
                'id',
                id
            );


    if (error) {

        console.error(error);

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

    if (!exigirPermissaoGestor())
        return;


    const nome =
        decodeURIComponent(
            nomeEncoded
        );


    const grupo =
        itens.filter(item =>

            itemEhEstoque(item) &&

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


    if (!grupo.length) {

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
    )
        return;


    const novaDescricao =
        prompt(
            'Nova descrição:',
            grupo[0].descricao || ''
        );


    const ids =
        grupo.map(
            item => item.id
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
                    novaDescricao ||
                    ''

            })
            .in(
                'id',
                ids
            );


    if (error) {

        console.error(error);

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

async function excluirItem(id) {

    if (!exigirPermissaoGestor())
        return;


    const item =
        itens.find(
            i =>
                String(i.id) ===
                String(id)
        );


    const confirmar =
        confirm(
            `Deseja excluir o patrimônio ${
                item?.patrimonio || ''
            }?`
        );


    if (!confirmar)
        return;


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

        console.error(error);

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

    if (!exigirPermissaoGestor())
        return;


    const nome =
        decodeURIComponent(
            nomeEncoded
        );


    const grupo =
        itens.filter(item =>

            itemEhEstoque(item) &&

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


    if (!grupo.length) {

        alert(
            'Estoque não encontrado.'
        );

        return;
    }


    const confirmar =
        confirm(
            `Deseja excluir todo o estoque de "${nome}" neste local?\n\nQuantidade: ${grupo.length} unidade(s).`
        );


    if (!confirmar)
        return;


    const ids =
        grupo.map(
            item => item.id
        );


    const {
        error
    } =
        await supabaseClient
            .from('itens')
            .delete()
            .in(
                'id',
                ids
            );


    if (error) {

        console.error(error);

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
   HISTÓRICO
===================================================== */

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
                        ascending: false
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
            data || [];


        const tabela =
            document.getElementById(
                'historico'
            );


        if (!tabela)
            return;


        tabela.innerHTML = '';


        movimentacoes.forEach(
            mov => {

                const item =
                    itens.find(
                        i =>
                            String(i.id) ===
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


                const dataFormatada =
                    mov.data
                        ? new Date(
                            mov.data
                        ).toLocaleString(
                            'pt-BR'
                        )
                        : '-';


                tabela.innerHTML += `

                    <tr>

                        <td>

                            <strong>

                                ${escaparHTML(
                                    item?.patrimonio ||
                                    item?.nome ||
                                    '-'
                                )}

                            </strong>

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
                                dataFormatada
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


        if (totalMov)
            totalMov.innerText =
                movimentacoes.length;


    } catch (err) {

        console.error(
            'Erro no histórico:',
            err
        );

    }

}


/* =====================================================
   PREENCHER ORIGEM
===================================================== */

function preencherOrigemAutomaticamente() {

    const select =
        document.getElementById(
            'itemMov'
        );


    const origem =
        document.getElementById(
            'origemAtual'
        );


    const qtd =
        document.getElementById(
            'quantidadeMov'
        );


    const disp =
        document.getElementById(
            'quantidadeDisponivel'
        );


    if (
        !select ||
        !origem
    )
        return;


    const item =
        itens.find(
            i =>
                String(i.id) ===
                String(
                    select.value
                )
        );


    if (!item) {

        origem.value = '';


        if (qtd) {

            qtd.value = '1';

            qtd.disabled = true;

            qtd.removeAttribute(
                'max'
            );

        }


        if (disp)
            disp.innerText =
                'Selecione um item';


        return;
    }


    origem.value =
        obterNomeLocal(
            item.local_id
        );


    const estoque =
        itemEhEstoque(
            item
        );


    const disponivel =
        estoque
            ? obterGrupoEstoque(
                item
            ).length
            : 1;


    if (qtd) {

        qtd.disabled =
            !estoque;

        qtd.max =
            String(
                disponivel
            );

        qtd.value =
            '1';

    }


    if (disp) {

        disp.innerText =
            estoque

                ? `${disponivel} unidade(s) disponível(is) neste local`

                : 'Patrimônio individual • 1 unidade';

    }

}


/* =====================================================
   LIMPAR MOVIMENTAÇÃO
===================================================== */

function limparMovimentacao() {

    const item =
        document.getElementById(
            'itemMov'
        );


    const origem =
        document.getElementById(
            'origemAtual'
        );


    const destino =
        document.getElementById(
            'destino'
        );


    const status =
        document.getElementById(
            'statusMov'
        );


    const obs =
        document.getElementById(
            'observacaoMov'
        );


    const qtd =
        document.getElementById(
            'quantidadeMov'
        );


    const disp =
        document.getElementById(
            'quantidadeDisponivel'
        );


    if (item)
        item.value = '';


    if (origem)
        origem.value = '';


    if (destino)
        destino.value = '';


    if (status)
        status.value = '';


    if (obs)
        obs.value = '';


    if (qtd) {

        qtd.value = '1';

        qtd.disabled = true;

        qtd.removeAttribute(
            'max'
        );

    }


    if (disp)
        disp.innerText =
            'Selecione um item';

}


/* =====================================================
   MOVIMENTAR ITEM / ESTOQUE
===================================================== */

async function movimentarItem() {

    if (!exigirPermissaoGestor())
        return;


    try {

        const item_id =
            document
                .getElementById(
                    'itemMov'
                )
                ?.value;


        const destino_id =
            document
                .getElementById(
                    'destino'
                )
                ?.value;


        const statusMov =
            document
                .getElementById(
                    'statusMov'
                )
                ?.value ||
            '';


        const obsBase =
            document
                .getElementById(
                    'observacaoMov'
                )
                ?.value
                ?.trim() ||
            '';


        const qtdSolicitada =
            parseInt(
                document
                    .getElementById(
                        'quantidadeMov'
                    )
                    ?.value ||
                '1',
                10
            );


        if (!item_id) {

            alert(
                'Selecione o item ou estoque.'
            );

            return;
        }


        if (!destino_id) {

            alert(
                'Selecione o destino.'
            );

            return;
        }


        if (
            !Number.isInteger(
                qtdSolicitada
            ) ||
            qtdSolicitada < 1
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
                    String(item_id)
            );


        if (!item) {

            alert(
                'Item não encontrado.'
            );

            return;
        }


        const origem_id =
            Number(
                item.local_id
            );


        const novoLocal =
            Number(
                destino_id
            );


        if (
            origem_id ===
            novoLocal &&
            !statusMov
        ) {

            alert(
                'O destino selecionado é o mesmo local atual.'
            );

            return;
        }


        let ids = [];


        /*
           ESTOQUE
        */

        if (
            itemEhEstoque(
                item
            )
        ) {

            const grupo =
                obterGrupoEstoque(
                    item
                );


            if (
                qtdSolicitada >
                grupo.length
            ) {

                alert(
                    `Quantidade indisponível. Existem apenas ${grupo.length} unidade(s) neste local.`
                );

                return;
            }


            ids =
                grupo
                    .slice(
                        0,
                        qtdSolicitada
                    )
                    .map(
                        i => i.id
                    );


        } else {


            /*
               PATRIMÔNIO INDIVIDUAL
            */

            if (
                qtdSolicitada !==
                1
            ) {

                alert(
                    'Patrimônio individual só pode ser movimentado na quantidade 1.'
                );

                return;
            }


            ids = [
                item.id
            ];

        }


        /*
           ATUALIZAR LOCAL
        */

        const dados = {

            local_id:
                novoLocal

        };


        if (statusMov)
            dados.status =
                statusMov;


        const {
            error:
                updateError
        } =
            await supabaseClient
                .from('itens')
                .update(
                    dados
                )
                .in(
                    'id',
                    ids
                );


        if (updateError) {

            console.error(
                updateError
            );

            alert(
                'Erro ao movimentar item:\n' +
                updateError.message
            );

            return;
        }


        /*
           HISTÓRICO
        */

        const observacao =
            itemEhEstoque(
                item
            )

                ?

                `[ESTOQUE] Transferidas ${ids.length} unidade(s) de "${item.nome}". ${obsBase}`.trim()

                :

                obsBase;


        const {
            error:
                movError
        } =
            await supabaseClient
                .from('movimentacoes')
                .insert([{

                    item_id:
                        Number(
                            item_id
                        ),

                    origem_id,

                    destino_id:
                        novoLocal,

                    observacao,

                    data:
                        new Date()
                            .toISOString()

                }]);


        if (movError) {

            console.error(
                movError
            );


            alert(
                `Movimentação realizada (${ids.length} unidade(s)), mas o histórico apresentou erro.\n${movError.message}`
            );

        } else {

            alert(
                `${ids.length} unidade(s) movimentada(s) com sucesso!`
            );

        }


        limparMovimentacao();


        await carregarDashboard();


    } catch (err) {

        console.error(
            err
        );


        alert(
            'Erro inesperado ao movimentar item.'
        );

    }

}


/* =====================================================
   DASHBOARD
===================================================== */

async function carregarDashboard() {

    await carregarItens();

    atualizarDashboardAvancado();

    gerarRelatorioLocais();

}


/* =====================================================
   DASHBOARD STATUS
===================================================== */

function atualizarDashboardAvancado() {

    const ativo =
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


    const baixado =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) ===
                'baixado'
        ).length;


    const extraviado =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) ===
                'extraviado'
        ).length;


    const dashTotal =
        document.getElementById(
            'dashTotal'
        );


    const dashAtivo =
        document.getElementById(
            'dashAtivo'
        );


    const dashManutencao =
        document.getElementById(
            'dashManutencao'
        );


    const dashBaixado =
        document.getElementById(
            'dashBaixado'
        );


    const dashExtraviado =
        document.getElementById(
            'dashExtraviado'
        );


    if (dashTotal)
        dashTotal.innerText =
            itens.length;


    if (dashAtivo)
        dashAtivo.innerText =
            ativo;


    if (dashManutencao)
        dashManutencao.innerText =
            manutencao;


    if (dashBaixado)
        dashBaixado.innerText =
            baixado;


    if (dashExtraviado)
        dashExtraviado.innerText =
            extraviado;

}


/* =====================================================
   RELATÓRIO POR LOCAL
===================================================== */

function gerarRelatorioLocais() {

    const tabela =
        document.getElementById(
            'dashboardLocais'
        );


    if (!tabela)
        return;


    tabela.innerHTML = '';


    const agrupado = {};


    itens.forEach(item => {

        const nomeLocal =
            obterNomeLocal(
                item.local_id
            );


        const tipo =
            item.tipo ||
            item.nome ||
            'SEM TIPO';


        const chave =
            `${item.nome}||${nomeLocal}`;


        if (
            !agrupado[chave]
        ) {

            agrupado[chave] = {

                item:
                    item.nome,

                local:
                    nomeLocal,

                quantidade:
                    0

            };

        }


        agrupado[chave]
            .quantidade++;

    });


    Object.values(
        agrupado
    )
        .sort(
            (a,b) =>
                a.local.localeCompare(
                    b.local,
                    'pt-BR'
                )
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
                                ${registro.quantidade}
                            </strong>

                        </td>

                    </tr>

                `;

            }
        );

}


/* =====================================================
   FILTRAR DASHBOARD
===================================================== */

function filtrarDashboard() {

    const busca =
        normalizarTexto(
            document
                .getElementById(
                    'filtroDashboard'
                )
                ?.value
        );


    const localFiltro =
        normalizarTexto(
            document
                .getElementById(
                    'filtroLocalDashboard'
                )
                ?.value
        );


    const linhas =
        document.querySelectorAll(
            '#dashboardLocais tr'
        );


    linhas.forEach(
        linha => {

            const item =
                normalizarTexto(
                    linha.children[0]
                        ?.innerText
                );


            const local =
                normalizarTexto(
                    linha.children[1]
                        ?.dataset
                        ?.local
                );


            const texto =
                `${item} ${local}`;


            const matchBusca =
                texto.includes(
                    busca
                );


            const matchLocal =
                !localFiltro ||
                local ===
                localFiltro;


            linha.style.display =
                matchBusca &&
                matchLocal
                    ? ''
                    : 'none';

        }
    );

}


/* =====================================================
   FILTRO DE LOCAIS
===================================================== */

function carregarFiltroLocaisDashboard() {

    const select =
        document.getElementById(
            'filtroLocalDashboard'
        );


    if (!select)
        return;


    select.innerHTML = `

        <option value="">
            Todos os Locais
        </option>

    `;


    [
        ...LOCAIS
    ]
        .sort(
            (a,b) =>
                a.nome.localeCompare(
                    b.nome,
                    'pt-BR'
                )
        )
        .forEach(
            local => {

                select.innerHTML += `

                    <option
                        value="${escaparHTML(
                            normalizarTexto(
                                local.nome
                            )
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


/* =====================================================
   MODAL FOTO
===================================================== */

function abrirModalFoto(url) {

    if (!url)
        return;


    const modal =
        document.getElementById(
            'modalFoto'
        );


    const imagem =
        document.getElementById(
            'imagemModal'
        );


    if (!modal || !imagem)
        return;


    imagem.src = url;


    modal.classList.add(
        'show'
    );

}


function fecharModalFoto() {

    const modal =
        document.getElementById(
            'modalFoto'
        );


    const imagem =
        document.getElementById(
            'imagemModal'
        );


    if (modal)
        modal.classList.remove(
            'show'
        );


    if (imagem)
        imagem.src = '';

}


/* =====================================================
   FECHAR MENU AO CLICAR FORA
===================================================== */

document.addEventListener(
    'click',
    function(event) {

        if (
            window.innerWidth >
            900
        )
            return;


        const sidebar =
            document.getElementById(
                'sidebar'
            );


        const menuBtn =
            document.getElementById(
                'mobileMenuBtn'
            ) ||
            document.querySelector(
                '.mobile-menu-btn'
            );


        if (!sidebar)
            return;


        const clicouDentro =
            sidebar.contains(
                event.target
            );


        const clicouBotao =
            menuBtn?.contains(
                event.target
            );


        if (
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
   ESC
===================================================== */

document.addEventListener(
    'keydown',
    function(event) {

        if (
            event.key ===
            'Escape'
        ) {

            fecharModalFoto();

            toggleSidebar(
                false
            );

        }

    }
);


/* =====================================================
   INIT
===================================================== */

window.addEventListener(
    'load',
    async function() {

        try {

            console.log(
                'Inicializando Sistema de Inventário...'
            );


            await carregarLocaisBanco();


            carregarLocais();

            carregarFiltroLocaisDashboard();

            atualizarMenus();

            atualizarUsuarioInterface();

            atualizarTituloTela(
                'loginTela'
            );


            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .getSession();


            if (error) {

                console.error(
                    'Erro ao verificar sessão:',
                    error
                );

                abrirTela(
                    'loginTela',
                    document.getElementById(
                        'menuLogin'
                    )
                );

                return;
            }


            if (
                data?.session
            ) {

                usuarioLogado =
                    data.session.user;


                await verificarPerfil();


                if (!perfilUsuario) {

                    await supabaseClient
                        .auth
                        .signOut();

                    usuarioLogado = null;


                    atualizarMenus();


                    abrirTela(
                        'loginTela',
                        document.getElementById(
                            'menuLogin'
                        )
                    );


                    alert(
                        'Usuário autenticado, porém sem perfil cadastrado na tabela usuarios.'
                    );


                    return;

                }


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

                usuarioLogado = null;

                perfilUsuario = null;


                atualizarMenus();

                atualizarUsuarioInterface();


                abrirTela(
                    'loginTela',
                    document.getElementById(
                        'menuLogin'
                    )
                );

            }


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


        } catch (err) {

            console.error(
                'Erro ao iniciar sistema:',
                err
            );


            alert(
                'Erro ao iniciar o sistema. Verifique o console do navegador.'
            );

        }

    }
);


/* =====================================================
   OBSERVAR AUTENTICAÇÃO
===================================================== */

supabaseClient
    .auth
    .onAuthStateChange(
        async function(
            event,
            session
        ) {

            console.log(
                'Evento de autenticação:',
                event
            );


            if (
                event ===
                'SIGNED_OUT'
            ) {

                usuarioLogado = null;

                perfilUsuario = null;

                itens = [];

                movimentacoes = [];


                atualizarMenus();

                atualizarUsuarioInterface();


                abrirTela(
                    'loginTela',
                    document.getElementById(
                        'menuLogin'
                    )
                );


                return;

            }


            if (
                session?.user
            ) {

                usuarioLogado =
                    session.user;


                await verificarPerfil();


                atualizarMenus();

                atualizarUsuarioInterface();

            }

        }
    );
    window.supabaseClient
    .auth
    .onAuthStateChange(
        async function(
            event,
            session
        ) {

            console.log(
                'Evento de autenticação:',
                event
            );


            if (
                event ===
                'SIGNED_OUT'
            ) {

                usuarioLogado = null;

                perfilUsuario = null;

                itens = [];

                movimentacoes = [];


                atualizarMenus();

                atualizarUsuarioInterface();


                abrirTela(
                    'loginTela',
                    document.getElementById(
                        'menuLogin'
                    )
                );


                return;

            }


            if (
                session?.user
            ) {

                usuarioLogado =
                    session.user;


                await verificarPerfil();


                atualizarMenus();

                atualizarUsuarioInterface();

            }

        }
    );