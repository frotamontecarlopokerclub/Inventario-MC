/* =====================================================
   SISTEMA DE INVENTÁRIO CENTRAL
   APP.JS - VERSÃO COMPLETA
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

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   VARIÁVEIS GLOBAIS
===================================================== */

let itens = [];
let movimentacoes = [];
let usuarioLogado = null;
let perfilUsuario = null;


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
   UTILITÁRIOS
===================================================== */

function normalizarTexto(valor) {

    return String(valor || '')
        .trim()
        .toLowerCase();

}


function escaparHTML(valor) {

    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function obterLocal(id) {

    return LOCAIS.find(
        local =>
            String(local.id) === String(id)
    );

}


function obterNomeLocal(id) {

    return obterLocal(id)?.nome ||
        'SEM LOCAL';

}


/* =====================================================
   PERMISSÕES
===================================================== */

/*
   CONSULTA
   - Dashboard
   - Estoque
   - Histórico

   GESTOR / ADMIN / ADMINISTRADOR
   - Dashboard
   - Cadastro
   - Movimentação
   - Estoque
   - Histórico
   - Editar
   - Excluir
*/


function usuarioPodeGerenciar() {

    if (!usuarioLogado)
        return false;

    const perfil =
        normalizarTexto(
            perfilUsuario
        );

    return [

        'gestor',
        'admin',
        'administrador',
        'administrador do sistema'

    ].includes(perfil);

}


function exigirPermissaoGestor() {

    if (!usuarioLogado) {

        alert(
            'Faça login primeiro!'
        );

        return false;
    }

    if (!usuarioPodeGerenciar()) {

        alert(
            'Seu usuário não possui permissão de Gestor.'
        );

        return false;
    }

    return true;

}


/* =====================================================
   USUÁRIO NA INTERFACE
===================================================== */

function atualizarUsuarioInterface() {

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


    if (!usuarioLogado) {

        if (usuarioNome)
            usuarioNome.innerText =
                'Visitante';

        if (usuarioPerfil)
            usuarioPerfil.innerText =
                'Acesso restrito';

        if (topbarUserName)
            topbarUserName.innerText =
                'Visitante';

        if (topbarUserRole)
            topbarUserRole.innerText =
                'Não autenticado';

        return;
    }


    const email =
        usuarioLogado.email ||
        'Usuário';


    const nome =
        email.includes('@')
            ? email.split('@')[0]
            : email;


    const perfil =
        usuarioPodeGerenciar()
            ? 'Gestor'
            : 'Consulta';


    if (usuarioNome)
        usuarioNome.innerText =
            nome;


    if (usuarioPerfil)
        usuarioPerfil.innerText =
            `Perfil: ${perfil}`;


    if (topbarUserName)
        topbarUserName.innerText =
            nome;


    if (topbarUserRole)
        topbarUserRole.innerText =
            `Perfil: ${perfil}`;

}


/* =====================================================
   LOGIN
===================================================== */

async function login() {

    const emailInput =
        document.getElementById(
            'email'
        );

    const passwordInput =
        document.getElementById(
            'password'
        );


    if (!emailInput || !passwordInput) {

        alert(
            'Campos de login não encontrados.'
        );

        return;
    }


    const email =
        emailInput.value
            .trim();

    const password =
        passwordInput.value;


    if (!email || !password) {

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

                    email,
                    password

                });


        if (error) {

            console.error(
                'Erro de login:',
                error
            );

            alert(
                'Login inválido. Verifique seu e-mail e senha.'
            );

            return;
        }


        usuarioLogado =
            data.user;


        await verificarPerfil();


        if (!perfilUsuario) {

            await supabaseClient
                .auth
                .signOut();

            usuarioLogado = null;

            alert(
                'Seu usuário está autenticado, porém não possui um perfil válido cadastrado na tabela usuarios.'
            );

            atualizarMenus();

            return;
        }


        atualizarUsuarioInterface();

        atualizarMenus();


        abrirTela(
            'dashboardTela',
            document.getElementById(
                'menuDashboard'
            )
        );


        await carregarDashboard();


        emailInput.value = '';
        passwordInput.value = '';


        alert(
            'Login realizado com sucesso!'
        );


    } catch (err) {

        console.error(
            'Erro inesperado no login:',
            err
        );

        alert(
            'Erro ao realizar login.'
        );

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


        usuarioLogado = null;
        perfilUsuario = null;

        itens = [];
        movimentacoes = [];


        atualizarUsuarioInterface();
        atualizarMenus();


        abrirTela(
            'loginTela',
            document.getElementById(
                'menuLogin'
            )
        );


        alert(
            'Logout realizado com sucesso.'
        );


    } catch (err) {

        console.error(
            'Erro ao sair:',
            err
        );

        alert(
            'Erro ao sair do sistema.'
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

        const email =
            usuarioLogado.email;


        const {
            data,
            error
        } =
            await supabaseClient
                .from('usuarios')
                .select('perfil')
                .eq(
                    'email',
                    email
                )
                .maybeSingle();


        if (error) {

            console.error(
                'Erro ao consultar perfil:',
                error
            );

            perfilUsuario = null;

            return;
        }


        if (!data) {

            console.warn(
                'Usuário sem perfil cadastrado:',
                email
            );

            perfilUsuario = null;

            return;
        }


        perfilUsuario =
            normalizarTexto(
                data.perfil
            );


        console.log(
            'Usuário:',
            email
        );

        console.log(
            'Perfil:',
            perfilUsuario
        );


    } catch (err) {

        console.error(
            'Erro ao verificar perfil:',
            err
        );

        perfilUsuario = null;
    }

}


/* =====================================================
   CONTROLE DE MENUS
===================================================== */

function atualizarMenus() {

    document.body.classList.toggle(
    'login-mode',
    !usuarioLogado
);

    const menuLogin =
        document.getElementById(
            'menuLogin'
        );

    const menuDashboard =
        document.getElementById(
            'menuDashboard'
        );

    const menuCadastro =
        document.getElementById(
            'menuCadastro'
        );

    const menuMovimentacao =
        document.getElementById(
            'menuMovimentacao'
        );

    const menuEstoque =
        document.getElementById(
            'menuEstoque'
        );

    const menuHistorico =
        document.getElementById(
            'menuHistorico'
        );

    const menuLogout =
        document.getElementById(
            'menuLogout'
        );


    if (!usuarioLogado) {

        if (menuLogin)
            menuLogin.style.display =
                'flex';

        if (menuDashboard)
            menuDashboard.style.display =
                'none';

        if (menuCadastro)
            menuCadastro.style.display =
                'none';

        if (menuMovimentacao)
            menuMovimentacao.style.display =
                'none';

        if (menuEstoque)
            menuEstoque.style.display =
                'none';

        if (menuHistorico)
            menuHistorico.style.display =
                'none';

        if (menuLogout)
            menuLogout.style.display =
                'none';


        atualizarUsuarioInterface();

        return;
    }


    if (menuLogin)
        menuLogin.style.display =
            'none';


    if (menuDashboard)
        menuDashboard.style.display =
            'flex';

    if (menuEstoque)
        menuEstoque.style.display =
            'flex';

    if (menuHistorico)
        menuHistorico.style.display =
            'flex';

    if (menuLogout)
        menuLogout.style.display =
            'flex';


    /*
       SOMENTE CONSULTA NÃO TEM
       CADASTRO E MOVIMENTAÇÃO.
    */

    if (usuarioPodeGerenciar()) {

        if (menuCadastro)
            menuCadastro.style.display =
                'flex';

        if (menuMovimentacao)
            menuMovimentacao.style.display =
                'flex';

    } else {

        if (menuCadastro)
            menuCadastro.style.display =
                'none';

        if (menuMovimentacao)
            menuMovimentacao.style.display =
                'none';

    }


    atualizarUsuarioInterface();

}


/* =====================================================
   CARREGAR LOCAIS
===================================================== */

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


    const totalLocais =
        document.getElementById(
            'totalLocais'
        );


    if (totalLocais)
        totalLocais.innerText =
            LOCAIS.length;

}


/* =====================================================
   GERAR NÚMERO DE PATRIMÔNIO
===================================================== */

function gerarNumeroPatrimonio() {

    if (!itens.length)
        return 0;


    const numeros =
        itens.map(item => {

            return parseInt(
                item.patrimonio,
                10
            ) || 0;

        });


    return Math.max(
        ...numeros
    );

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


        if (!nome) {

            alert(
                'Informe o nome do patrimônio.'
            );

            nomeElement?.focus();

            return;
        }


        if (!local_id) {

            alert(
                'Selecione o local.'
            );

            localElement?.focus();

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

            quantidadeElement?.focus();

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
           GERAR LOTE
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

                foto_url

            });

        }


        /* =================================================
           INSERT
        ================================================= */

        const {
            data,
            error
        } =
            await supabaseClient
                .from('itens')
                .insert(
                    lote
                )
                .select();


        if (error) {

            console.error(
                'Erro ao inserir:',
                error
            );

            alert(
                'Erro ao salvar patrimônio:\n' +
                error.message
            );

            return;
        }


        console.log(
            'Patrimônios cadastrados:',
            data
        );


        alert(
            `${quantidade} patrimônio(s) cadastrado(s) com sucesso!`
        );


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
            'Erro inesperado:',
            err
        );

        alert(
            'Erro inesperado ao cadastrar patrimônio.'
        );

    }

}


/* =====================================================
   LIMPAR FORMULÁRIO
===================================================== */

function limparFormulario() {

    const campos = [

        'nome',
        'descricao',
        'foto'

    ];


    campos.forEach(id => {

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
        status.value =
            'Ativo';


    const quantidade =
        document.getElementById(
            'quantidadeLote'
        );

    if (quantidade)
        quantidade.value =
            '1';


    const tipo =
        document.getElementById(
            'tipoItem'
        );

    if (tipo)
        tipo.value = '';

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
                    Selecione o Patrimônio
                </option>
            `;

        }


        itens.forEach(item => {

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

                case 'em manutenção':
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

                const foto =
                    item.foto_url ||
                    'https://placehold.co/80x80/png?text=IMG';


                tabela.innerHTML += `

                    <tr>

                        <td>

                            <img
                                src="${escaparHTML(foto)}"
                                alt="Foto do patrimônio"
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

                                    ? `

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

                                    : '-'
                                }

                            </div>

                        </td>

                    </tr>

                `;

            }


            if (itemMov) {

                itemMov.innerHTML += `

                    <option value="${item.id}">
                        ${escaparHTML(
                            item.patrimonio
                        )}
                        -
                        ${escaparHTML(
                            item.nome
                        )}
                    </option>

                `;

            }

        });


        const totalItens =
            document.getElementById(
                'totalItens'
            );


        if (totalItens)
            totalItens.innerText =
                itens.length;


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
   EDITAR ITEM
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

        console.error(
            'Erro ao editar:',
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
   EXCLUIR ITEM
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

        console.error(
            'Erro ao excluir:',
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


        movimentacoes.forEach(mov => {

            const item =
                itens.find(
                    i =>
                        String(i.id) ===
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

        });


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
   DASHBOARD STATUS
===================================================== */

function atualizarDashboardAvancado() {

    const ativo =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) === 'ativo'
        ).length;


    const manutencao =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) ===
                'em manutenção'
        ).length;


    const baixado =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) === 'baixado'
        ).length;


    const extraviado =
        itens.filter(
            item =>
                normalizarTexto(
                    item.status
                ) === 'extraviado'
        ).length;


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
            `${tipo}||${nomeLocal}`;


        if (!agrupado[chave]) {

            agrupado[chave] = {

                item: tipo,

                local: nomeLocal,

                quantidade: 0

            };

        }


        agrupado[chave]
            .quantidade++;

    });


    Object.values(agrupado)

        .sort(
            (a, b) =>
                a.local.localeCompare(
                    b.local,
                    'pt-BR'
                )
        )

        .forEach(registro => {

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

        });

}


/* =====================================================
   FILTRAR DASHBOARD
===================================================== */

function filtrarDashboard() {

    const busca =
        normalizarTexto(
            document.getElementById(
                'filtroDashboard'
            )?.value
        );


    const localFiltro =
        normalizarTexto(
            document.getElementById(
                'filtroLocalDashboard'
            )?.value
        );


    const linhas =
        document.querySelectorAll(
            '#dashboardLocais tr'
        );


    linhas.forEach(linha => {

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
            local === localFiltro;


        linha.style.display =
            matchBusca &&
            matchLocal
                ? ''
                : 'none';

    });

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


    [...LOCAIS]

        .sort(
            (a, b) =>
                a.nome.localeCompare(
                    b.nome,
                    'pt-BR'
                )
        )

        .forEach(local => {

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

        });

}


/* =====================================================
   FILTRAR ESTOQUE
===================================================== */

function filtrarItens() {

    const termo =
        normalizarTexto(
            document.getElementById(
                'busca'
            )?.value
        );


    const linhas =
        document.querySelectorAll(
            '#listaItens tr'
        );


    linhas.forEach(linha => {

        const texto =
            normalizarTexto(
                linha.innerText
            );


        linha.style.display =
            texto.includes(
                termo
            )
                ? ''
                : 'none';

    });

}


/* =====================================================
   DASHBOARD COMPLETO
===================================================== */

async function carregarDashboard() {

    carregarLocais();

    carregarFiltroLocaisDashboard();


    await carregarItens();

    await carregarHistorico();


    atualizarDashboardAvancado();

    gerarRelatorioLocais();

    filtrarDashboard();

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
        'active'
    );

}


function fecharModalFoto() {

    const modal =
        document.getElementById(
            'modalFoto'
        );


    if (modal)
        modal.classList.remove(
            'active'
        );


    const imagem =
        document.getElementById(
            'imagemModal'
        );


    if (imagem)
        imagem.src = '';

}


/* =====================================================
   ABRIR TELA
===================================================== */

function abrirTela(
    idTela,
    elemento
) {

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
       Impede Consulta de abrir
       telas administrativas manualmente.
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


    if (!tela)
        return;


    document
        .querySelectorAll(
            '.tela'
        )
        .forEach(item => {

            item.classList.remove(
                'activeTela'
            );

        });


    tela.classList.add(
        'activeTela'
    );


    document
        .querySelectorAll(
            '.menu-item'
        )
        .forEach(menu => {

            menu.classList.remove(
                'active'
            );

        });


    if (elemento)
        elemento.classList.add(
            'active'
        );


    atualizarTituloTela(
        idTela
    );


    if (
        window.innerWidth <=
        900
    ) {

        toggleSidebar(
            false
        );

    }

}


/* =====================================================
   TÍTULO DAS TELAS
===================================================== */

function atualizarTituloTela(
    idTela
) {

    const pageTitle =
        document.getElementById(
            'pageTitle'
        );


    const breadcrumb =
        document.getElementById(
            'breadcrumb'
        );


    const titulos = {

        loginTela: {

            titulo:
                'Acesso ao sistema',

            breadcrumb:
                'Autenticação'

        },

        dashboardTela: {

            titulo:
                'Dashboard',

            breadcrumb:
                'Visão geral'

        },

        cadastroTela: {

            titulo:
                'Cadastrar Patrimônio',

            breadcrumb:
                'Patrimônio'

        },

        movimentacaoTela: {

            titulo:
                'Movimentações',

            breadcrumb:
                'Logística'

        },

        estoqueTela: {

            titulo:
                'Estoque',

            breadcrumb:
                'Inventário'

        },

        historicoTela: {

            titulo:
                'Histórico',

            breadcrumb:
                'Rastreabilidade'

        }

    };


    const dados =
        titulos[idTela] ||
        titulos.dashboardTela;


    if (pageTitle)
        pageTitle.innerText =
            dados.titulo;


    if (breadcrumb)
        breadcrumb.innerText =
            dados.breadcrumb;

}


/* =====================================================
   EXPORTAR CSV / EXCEL
===================================================== */

function exportarExcel() {

    if (!itens.length) {

        alert(
            'Nenhum patrimônio cadastrado.'
        );

        return;
    }


    const linhas = [];


    linhas.push([

        'PATRIMÔNIO',
        'TIPO',
        'NOME',
        'DESCRIÇÃO',
        'LOCAL',
        'STATUS'

    ]);


    itens.forEach(item => {

        linhas.push([

            item.patrimonio || '',

            item.tipo ||
            item.nome ||
            '',

            item.nome || '',

            item.descricao || '',

            obterNomeLocal(
                item.local_id
            ),

            item.status || ''

        ]);

    });


    const csv =
        linhas
            .map(linha =>

                linha
                    .map(valor =>

                        `"${String(
                            valor ?? ''
                        ).replace(
                            /"/g,
                            '""'
                        )}"`

                    )
                    .join(';')

            )
            .join('\n');


    const blob =
        new Blob(
            [
                '\ufeff' + csv
            ],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );


    const link =
        document.createElement(
            'a'
        );


    const url =
        URL.createObjectURL(
            blob
        );


    link.href = url;

    link.download =
        'inventario.csv';


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
   MENU MOBILE
===================================================== */

function toggleSidebar(
    forceState
) {

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


    let abrir;


    if (
        typeof forceState ===
        'boolean'
    ) {

        abrir =
            forceState;

    } else {

        abrir =
            !sidebar.classList.contains(
                'open'
            );

    }


    sidebar.classList.toggle(
        'open',
        abrir
    );


    if (overlay) {

        overlay.classList.toggle(
            'active',
            abrir
        );

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
        ) ||
        document.getElementById(
            'origemNome'
        );


    const destino =
        document.getElementById(
            'destino'
        );


    const status =
        document.getElementById(
            'statusMov'
        );


    const observacao =
        document.getElementById(
            'observacaoMov'
        );


    if (item)
        item.value = '';


    if (origem)
        origem.value = '';


    if (destino)
        destino.value = '';


    if (status)
        status.value = '';


    if (observacao)
        observacao.value = '';

}


/* =====================================================
   PREENCHER ORIGEM
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

        console.warn(
            'Campo de origem não encontrado.'
        );

        return;
    }


    const itemId =
        selectItem.value;


    if (!itemId) {

        origemInput.value = '';

        return;
    }


    const item =
        itens.find(
            i =>
                String(i.id) ===
                String(itemId)
        );


    if (!item) {

        origemInput.value = '';

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


        const observacao =
            document
                .getElementById(
                    'observacaoMov'
                )
                ?.value
                ?.trim() ||
            '';


        if (!item_id) {

            alert(
                'Selecione o patrimônio.'
            );

            return;
        }


        if (!destino_id) {

            alert(
                'Selecione o destino.'
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
                'Patrimônio não encontrado.'
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


        /*
           Pode alterar o status
           sem alterar o local.
        */

        if (
            origem_id === novoLocal &&
            !statusMov
        ) {

            alert(
                'O patrimônio já está neste local.'
            );

            return;
        }


        /* =================================================
           ATUALIZA PATRIMÔNIO
        ================================================= */

        const dadosAtualizacao = {

            local_id:
                novoLocal

        };


        if (statusMov) {

            dadosAtualizacao.status =
                statusMov;

        }


        const {
            error: updateError
        } =
            await supabaseClient
                .from('itens')
                .update(
                    dadosAtualizacao
                )
                .eq(
                    'id',
                    item_id
                );


        if (updateError) {

            console.error(
                'Erro ao atualizar patrimônio:',
                updateError
            );

            alert(
                'Erro ao movimentar patrimônio:\n' +
                updateError.message
            );

            return;
        }


        /* =================================================
           REGISTRAR HISTÓRICO
        ================================================= */

        const {
            error: movError
        } =
            await supabaseClient
                .from('movimentacoes')
                .insert([{

                    item_id:
                        Number(
                            item_id
                        ),

                    origem_id:
                        origem_id,

                    destino_id:
                        novoLocal,

                    observacao:
                        observacao,

                    data:
                        new Date()
                            .toISOString()

                }]);


        if (movError) {

            console.error(
                'Erro no histórico:',
                movError
            );

            alert(
                'O patrimônio foi movimentado, porém ocorreu um erro ao registrar o histórico:\n' +
                movError.message
            );

        } else {

            alert(
                'Patrimônio movimentado com sucesso!'
            );

        }


        limparMovimentacao();


        await carregarDashboard();


    } catch (err) {

        console.error(
            'Erro inesperado:',
            err
        );

        alert(
            'Erro inesperado ao movimentar patrimônio.'
        );

    }

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


                console.log(
                    'Usuário:',
                    usuarioLogado.email
                );


                console.log(
                    'Perfil:',
                    perfilUsuario
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

supabaseClient.auth.onAuthStateChange(
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