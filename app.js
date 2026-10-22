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
let nomeUsuarioLogado = '';
let subsetores = [];


/* =========================================================
   LOCAIS
========================================================= */

let LOCAIS = [
    { id: 1, nome: 'CASA 1' },
    { id: 2, nome: 'CASA 2' },
    { id: 3, nome: 'CASA 3' },
    { id: 4, nome: 'CASA 1 ( FUNCIONARIOS)' },
    { id: 5, nome: 'CASA 2 ( FUNCIONARIOS)' },
    { id: 6, nome: 'CASA 3 ( FUNCIONARIOS)' },
    { id: 7, nome: 'CASA 4 ( FUNCIONARIOS)' },
    { id: 8, nome: 'MANUTENCAO' },
    { id: 9, nome: 'CD1' },
    { id: 10, nome: 'CD2' },
    { id: 11, nome: 'PREDIO CARDOSO' },
    { id: 12, nome: 'DORYO' },
    { id: 13, nome: 'ESCRITÓRIO 1' },
    { id: 14, nome: 'ESCRITÓRIO 2' },
    { id: 15, nome: 'ESCRITÓRIO 3' },
    { id: 16, nome: 'ESTACIONAMENTO 1' },
    { id: 17, nome: 'ESTACIONAMENTO 2' },
    { id: 18, nome: 'ESTACIONAMENTO 3' },
    { id: 19, nome: 'M.C.' },
    { id: 20, nome: 'M.G.' },
    { id: 21, nome: 'DESCARTE/BAIXA TOTAL' },
    { id: 22, nome: 'CASA 4' },
    { id: 23, nome: 'CASA 5' },
    { id: 24, nome: 'CASA 6' }
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


        abrirTela(document.getElementById('ondeEstaTela') ? 'ondeEstaTela' : 'dashboardTela', document.getElementById('menuOndeEsta') || document.getElementById('menuDashboard'));


        await carregarDashboard();
        await carregarSubsetores();


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
    nomeUsuarioLogado = '';


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

        let perfilConsulta = await supabaseClient
            .from('usuarios')
            .select('perfil, nome, ativo')
            .eq('email', usuarioLogado.email)
            .maybeSingle();

        if (perfilConsulta.error) {
            // Compatibilidade temporária caso a migração ainda não tenha sido executada.
            perfilConsulta = await supabaseClient
                .from('usuarios')
                .select('perfil')
                .eq('email', usuarioLogado.email)
                .maybeSingle();
        }

        const data = perfilConsulta.data;
        const error = perfilConsulta.error;

        if (error) {
            console.error('ERRO PERFIL:', error);
            perfilUsuario = 'consulta';
            nomeUsuarioLogado = usuarioLogado.email || '';
            return;
        }


        if (data?.ativo === false) {
            await supabaseClient.auth.signOut();
            throw new Error('Usuário inativo.');
        }

        nomeUsuarioLogado =
            String(data?.nome || usuarioLogado.email || '').trim();

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

    const adminMenu = document.getElementById('menuAdministracao');


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

        if (adminMenu) adminMenu.style.display = 'none';

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

    if (adminMenu) {
        adminMenu.style.display = podeAdministrar() ? 'flex' : 'none';
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
        nomeUsuarioLogado ||
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


function limparFormulario() {
    limparFormularioCadastro();
}

/* =========================================================
   SUBSETORES / AUDITORIA — NOVAS FUNCIONALIDADES
========================================================= */

function nomeSubsetor(subsetorId) {
    if (!subsetorId) return 'Sem setor definido';
    const s = subsetores.find(x => String(x.id) === String(subsetorId));
    return s?.nome || 'Sem setor definido';
}

function formatarLocalSubsetor(localId, subsetorId) {
    const local = nomeLocal(localId);
    if (!subsetorId) return local;
    return `${local} / ${nomeSubsetor(subsetorId)}`;
}


function limparFormularioMovimentacao() {
    ['itemMov','destino','destinoSubsetor','quantidadeMov','observacaoMov','statusMov','origemNome','origemAtual'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'quantidadeMov') el.value = 1;
        else el.value = '';
    });
    atualizarResumoMovimentacao();
}

function podeAdministrar() {
    return ['administrador', 'gestor'].includes(String(perfilUsuario || '').toLowerCase());
}

async function carregarSubsetores() {
    try {
        const { data, error } = await supabaseClient
            .from('subsetores')
            .select('*')
            .eq('ativo', true)
            .order('local_id', { ascending: true })
            .order('nome', { ascending: true });
        if (error) throw error;
        subsetores = Array.isArray(data) ? data : [];
        popularSubsetoresCadastro();
        popularSubsetoresMovimentacao();
        popularFiltroSubsetoresEstoque();
        popularFiltroSubsetoresDashboard();
        const adminLocal = document.getElementById('adminSubsetorLocal');
        if (adminLocal) {
            const valorAdmin = adminLocal.value;
            adminLocal.innerHTML = '<option value="">Selecione o local</option>';
            LOCAIS.forEach(local => {
                adminLocal.innerHTML += `<option value="${local.id}">${escaparHTML(local.nome)}</option>`;
            });
            if ([...adminLocal.options].some(o => o.value === valorAdmin)) adminLocal.value = valorAdmin;
        }
        renderizarSubsetoresAdmin();
    } catch (erro) {
        console.warn('Subsetores ainda não configurados:', erro?.message || erro);
        subsetores = [];
    }
}

function popularSubsetorSelect(selectId, localId, placeholder = 'Local inteiro (sem setor definido)') {
    const select = document.getElementById(selectId);
    if (!select) return;
    const valorAtual = select.value;
    select.innerHTML = `<option value="">${escaparHTML(placeholder)}</option>`;
    if (!localId) return;
    subsetores
        .filter(s => String(s.local_id) === String(localId) && s.ativo !== false)
        .forEach(s => {
            select.innerHTML += `<option value="${Number(s.id)}">${escaparHTML(s.nome)}</option>`;
        });
    if ([...select.options].some(o => o.value === valorAtual)) select.value = valorAtual;
}

function popularSubsetoresCadastro() {
    popularSubsetorSelect('subsetorCadastro', document.getElementById('local')?.value, 'Local inteiro (sem setor definido)');
}

function popularSubsetoresMovimentacao() {
    popularSubsetorSelect('destinoSubsetor', document.getElementById('destino')?.value, 'Local inteiro (sem setor definido)');
}

async function registrarAuditoria(acao, payload = {}) {
    if (!usuarioLogado?.id) return;
    try {
        const { error } = await supabaseClient.from('auditoria').insert([{
            usuario_id: usuarioLogado.id,
            acao: String(acao || '').toUpperCase(),
            item_id: payload.item_id ?? null,
            descricao: payload.descricao || null,
            detalhes: payload.detalhes || {},
            data: new Date().toISOString()
        }]);
        if (error) console.warn('AUDITORIA:', error.message);
    } catch (erro) {
        console.warn('Falha ao registrar auditoria:', erro);
    }
}

async function carregarAuditoria() {
    const tbody = document.getElementById('listaAuditoria');
    if (!tbody) return;
    try {
        const { data, error } = await supabaseClient
            .from('auditoria')
            .select('*, usuarios:usuario_id(nome,email)')
            .order('data', { ascending: false });
        if (error) throw error;
        tbody.innerHTML = '';
        (data || []).forEach(reg => {
            const tr = document.createElement('tr');
            const detalhes = reg.detalhes && typeof reg.detalhes === 'object'
                ? JSON.stringify(reg.detalhes, null, 2)
                : String(reg.detalhes || '');
            tr.innerHTML = `
                <td>${escaparHTML(reg.data ? new Date(reg.data).toLocaleString('pt-BR') : '-')}</td>
                <td><strong>${escaparHTML(reg.usuarios?.nome || reg.usuarios?.email || '—')}</strong></td>
                <td><span class="auditoria-badge auditoria-${escaparHTML(String(reg.acao || '').toLowerCase())}">${escaparHTML(reg.acao || '-')}</span></td>
                <td>${escaparHTML(reg.descricao || '-')}</td>
                <td><pre class="auditoria-detalhes">${escaparHTML(detalhes)}</pre></td>
            `;
            tbody.appendChild(tr);
        });
        if (!data?.length) tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma ação registrada.</td></tr>';
    } catch (erro) {
        console.error('ERRO AO CARREGAR AUDITORIA:', erro);
    }
}

async function criarSubsetor() {
    if (!podeAdministrar()) return alert('Usuário sem permissão para administrar subsetores.');
    const localId = document.getElementById('adminSubsetorLocal')?.value;
    const nome = document.getElementById('adminSubsetorNome')?.value?.trim();
    if (!localId || !nome) return alert('Selecione o local e informe o nome do subsetor.');
    const { error } = await supabaseClient.from('subsetores').insert([{
        local_id: Number(localId), nome, ativo: true, created_by: usuarioLogado.id
    }]);
    if (error) return alert('Erro ao criar subsetor.\n\n' + error.message);
    document.getElementById('adminSubsetorNome').value = '';
    await carregarSubsetores();
    await registrarAuditoria('CRIACAO_SUBSETOR', { descricao: `Criação do subsetor: ${nome}`, detalhes: { local_id: Number(localId), nome } });
}

async function editarSubsetor(id) {
    if (!podeAdministrar()) return alert('Usuário sem permissão.');
    const atual = subsetores.find(s => Number(s.id) === Number(id));
    if (!atual) return;
    const nome = prompt('Nome do subsetor:', atual.nome);
    if (nome === null) return;
    const novoNome = nome.trim();
    if (!novoNome) return alert('O nome não pode ficar vazio.');
    const { error } = await supabaseClient.from('subsetores').update({ nome: novoNome }).eq('id', id);
    if (error) return alert('Erro ao editar subsetor.\n\n' + error.message);
    await registrarAuditoria('EDICAO_SUBSETOR', { descricao: `Edição do subsetor: ${atual.nome}`, detalhes: { id, antes: atual.nome, depois: novoNome } });
    await carregarSubsetores();
}

async function inativarSubsetor(id) {
    if (!podeAdministrar()) return alert('Usuário sem permissão.');
    const atual = subsetores.find(s => Number(s.id) === Number(id));
    if (!atual || !confirm(`Inativar o subsetor "${atual.nome}"?`)) return;
    const { error } = await supabaseClient.from('subsetores').update({ ativo: false }).eq('id', id);
    if (error) return alert('Erro ao inativar subsetor.\n\n' + error.message);
    await registrarAuditoria('INATIVACAO_SUBSETOR', { descricao: `Inativação do subsetor: ${atual.nome}`, detalhes: { id, local_id: atual.local_id } });
    await carregarSubsetores();
}

function renderizarSubsetoresAdmin() {
    const tbody = document.getElementById('listaSubsetoresAdmin');
    if (!tbody) return;
    tbody.innerHTML = '';
    subsetores.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escaparHTML(nomeLocal(s.local_id))}</td>
            <td><strong>${escaparHTML(s.nome)}</strong></td>
            <td><span class="status-badge ativo">Ativo</span></td>
            <td class="admin-actions">
                <button type="button" class="btn-secondary btn-small" onclick="editarSubsetor(${Number(s.id)})"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn-secondary btn-small" onclick="inativarSubsetor(${Number(s.id)})"><i class="fa-solid fa-ban"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
    if (!subsetores.length) tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum subsetor cadastrado.</td></tr>';
}

async function carregarUsuariosAdmin() {
    const tbody = document.getElementById('listaUsuariosAdmin');
    if (!tbody) return;
    try {
        const { data, error } = await supabaseClient.from('usuarios').select('id,email,nome,perfil,ativo,created_at').order('nome', { ascending: true });
        if (error) throw error;
        tbody.innerHTML = '';
        (data || []).forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escaparHTML(u.nome || '—')}</td>
                <td>${escaparHTML(u.email || '—')}</td>
                <td>${escaparHTML(u.perfil || 'consulta')}</td>
                <td><span class="status-badge ${u.ativo === false ? 'inativo' : 'ativo'}">${u.ativo === false ? 'Inativo' : 'Ativo'}</span></td>
                <td class="admin-actions">
                    <button type="button" class="btn-secondary btn-small" onclick="alternarStatusUsuario('${escaparHTML(u.id)}', ${u.ativo !== false})">
                        <i class="fa-solid fa-power-off"></i>
                    </button>
                </td>`;
            tbody.appendChild(tr);
        });
        if (!data?.length) tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum usuário encontrado.</td></tr>';
    } catch (erro) {
        console.error('ERRO USUÁRIOS:', erro);
    }
}

async function criarUsuario() {
    if (!podeAdministrar()) return alert('Usuário sem permissão para criar usuários.');
    const nome = document.getElementById('novoUsuarioNome')?.value?.trim();
    const email = document.getElementById('novoUsuarioEmail')?.value?.trim();
    const senha = document.getElementById('novoUsuarioSenha')?.value || '';
    const perfil = document.getElementById('novoUsuarioPerfil')?.value || 'consulta';
    if (!nome || !email || senha.length < 6) return alert('Informe nome, e-mail e uma senha com pelo menos 6 caracteres.');
    try {
        const { data, error } = await supabaseClient.functions.invoke('criar-usuario', {
            body: { nome, email, senha, perfil }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        alert('Usuário criado com sucesso.');
        document.getElementById('novoUsuarioNome').value = '';
        document.getElementById('novoUsuarioEmail').value = '';
        document.getElementById('novoUsuarioSenha').value = '';
        await carregarUsuariosAdmin();
        await registrarAuditoria('CRIACAO_USUARIO', { descricao: `Criação do usuário: ${email}`, detalhes: { nome, email, perfil } });
    } catch (erro) {
        alert('Não foi possível criar o usuário.\n\nVerifique se a Edge Function "criar-usuario" foi publicada no Supabase.\n\n' + (erro?.message || 'Erro desconhecido.'));
    }
}

async function alternarStatusUsuario(id, ativoAtual) {
    if (!podeAdministrar()) return alert('Usuário sem permissão.');
    if (String(id) === String(usuarioLogado?.id)) return alert('Não é permitido inativar o próprio usuário.');
    const novoStatus = !ativoAtual;
    const { error } = await supabaseClient.from('usuarios').update({ ativo: novoStatus }).eq('id', id);
    if (error) return alert('Erro ao alterar status.\n\n' + error.message);
    await registrarAuditoria('STATUS_USUARIO', { descricao: `Usuário ${novoStatus ? 'ativado' : 'inativado'}`, detalhes: { usuario_id: id, ativo: novoStatus } });
    await carregarUsuariosAdmin();
}

async function abrirAdministracao() {
    if (!podeAdministrar()) return alert('Usuário sem permissão para acessar a Administração.');
    abrirTela('administracaoTela', document.getElementById('menuAdministracao'));
    await carregarSubsetores();
    await carregarUsuariosAdmin();
    await carregarAuditoria();
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

    const subsetorId =
        document.getElementById('subsetorCadastro')?.value || null;


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

            let consultaEstoque = supabaseClient
                .from('itens')
                .select('*')
                .eq('nome', nome)
                .eq('local_id', Number(localId));

            consultaEstoque = subsetorId
                ? consultaEstoque.eq('subsetor_id', Number(subsetorId))
                : consultaEstoque.is('subsetor_id', null);

            const {
                data: existente,
                error: erroBusca
            } = await consultaEstoque
                .is('patrimonio', null)
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

                            subsetor_id:
                                subsetorId ? Number(subsetorId) : null,

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

                        subsetor_id:
                            subsetorId ? Number(subsetorId) : null,

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

        await registrarAuditoria('CADASTRO', {
            item_id: null,
            descricao: `Cadastro do item: ${nome}`,
            detalhes: {
                nome,
                tipo,
                quantidade,
                local_id: Number(localId),
                subsetor_id: subsetorId ? Number(subsetorId) : null,
                patrimonio: patrimonio || null,
                status
            }
        });


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


    const subsetor = document.getElementById('subsetorCadastro');
    if (subsetor) subsetor.value = '';

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
                    colspan="9"
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

            const subsetor = nomeSubsetor(item.subsetor_id);


            const status =
                item.status ||
                'Ativo';


            const quantidade =
                quantidadeItem(
                    item
                );


            tr.dataset.subsetorId =
                item.subsetor_id
                    ? String(item.subsetor_id)
                    : '';


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

                    ${escaparHTML(
                        subsetor
                    )}

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

function popularFiltroSubsetoresEstoque() {

    const select =
        document.getElementById(
            'filtroSubsetor'
        );

    if (!select) {
        return;
    }

    const valorAtual =
        select.value || '';

    select.innerHTML =
        '<option value="">Todos os Subsetores</option>';

    const lista =
        Array.isArray(subsetores)
            ? [...subsetores]
                .filter(
                    s =>
                        s &&
                        s.ativo !== false
                )
                .sort(
                    (a, b) => {

                        const localA =
                            nomeLocal(
                                a.local_id
                            );

                        const localB =
                            nomeLocal(
                                b.local_id
                            );

                        const porLocal =
                            String(localA)
                                .localeCompare(
                                    String(localB),
                                    'pt-BR',
                                    {
                                        sensitivity:
                                            'base'
                                    }
                                );

                        if (porLocal !== 0) {
                            return porLocal;
                        }

                        return String(a.nome || '')
                            .localeCompare(
                                String(b.nome || ''),
                                'pt-BR',
                                {
                                    sensitivity:
                                        'base'
                                }
                            );
                    }
                )
            : [];

    lista.forEach(
        s => {

            select.innerHTML += `
                <option value="${Number(s.id)}">
                    ${escaparHTML(
                        nomeLocal(s.local_id) +
                        ' / ' +
                        s.nome
                    )}
                </option>
            `;

        }
    );

    if (
        valorAtual &&
        [...select.options].some(
            option =>
                option.value ===
                valorAtual
        )
    ) {
        select.value =
            valorAtual;
    }
}


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

    const filtroSubsetor =
        document
            .getElementById(
                'filtroSubsetor'
            )
            ?.value ||
        '';

    const linhas =
        document.querySelectorAll(
            '#listaItens tr'
        );

    let totalVisiveis = 0;

    linhas.forEach(
        linha => {

            if (
                !linha.cells ||
                linha.cells.length < 9
            ) {
                return;
            }

            const texto =
                linha.innerText
                    .toLowerCase();

            const correspondeBusca =
                !busca ||
                texto.includes(
                    busca
                );

            const subsetorId =
                linha.dataset
                    .subsetorId ||
                '';

            const correspondeSubsetor =
                !filtroSubsetor ||
                String(subsetorId) ===
                    String(filtroSubsetor);

            const mostrar =
                correspondeBusca &&
                correspondeSubsetor;

            linha.style.display =
                mostrar
                    ? ''
                    : 'none';

            if (mostrar) {
                totalVisiveis++;
            }

        }
    );

    const total =
        document.getElementById(
            'estoqueTotal'
        );

    if (total) {
        total.innerText =
            totalVisiveis;
    }

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


        await registrarAuditoria('EDICAO', {
            item_id: Number(item.id),
            descricao: `Edição do item: ${item.nome || nome}`,
            detalhes: {
                antes: {
                    nome: item.nome,
                    descricao: item.descricao,
                    local_id: item.local_id,
                    subsetor_id: item.subsetor_id || null,
                    quantidade: item.quantidade,
                    status: item.status,
                    patrimonio: item.patrimonio || null
                },
                depois: {
                    nome,
                    descricao: novaDescricao.trim()
                }
            }
        });

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

        await registrarAuditoria('EXCLUSAO', {
            item_id: Number(item.id),
            descricao: `Exclusão do item: ${item.nome || 'Item'}`,
            detalhes: { ...item }
        });

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
                    formatarLocalSubsetor(
                        item.local_id,
                        item.subsetor_id
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

        // O filtro de Local acabou de ser montado.
        // Agora o Subsetor deve ser recalculado usando
        // o Local atualmente selecionado.
        popularFiltroSubsetoresDashboard();


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

            const subsetor =
                nomeSubsetor(
                    item.subsetor_id
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
                `${tipo}||${local}||${subsetor}`;


            if (
                !agrupado[chave]
            ) {

                agrupado[chave] = {

                    item:
                        tipo,

                    local:
                        local,

                    local_id:
                        item.local_id,

                    subsetor:
                        subsetor,

                    subsetor_id:
                        item.subsetor_id,

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
                    colspan="4"
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
                    data-local-id="${String(registro.local_id || '')}"
                >

                    ${escaparHTML(
                        registro.local
                    )}

                </td>


                <td
                    data-subsetor="${escaparHTML(
                        String(
                            registro.subsetor ||
                            ''
                        )
                        .trim()
                        .toLowerCase()
                    )}"
                    data-subsetor-id="${String(registro.subsetor_id || '')}"
                >

                    ${escaparHTML(
                        registro.subsetor
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
            ?.value ||
        '';


    const filtroSubsetor =
        document
            .getElementById(
                'filtroSubsetorDashboard'
            )
            ?.value ||
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
                    ?.localId ||
                '';


            const subsetor =
                linha.children[2]
                    ?.dataset
                    ?.subsetorId ||
                '';


            const texto =
                `${item} ${local} ${subsetor}`;


            const correspondeBusca =
                !busca ||
                texto.includes(
                    busca
                );


            const correspondeLocal =
                !filtroLocal ||
                local ===
                    filtroLocal;


            const correspondeSubsetor =
                !filtroSubsetor ||
                subsetor ===
                    filtroSubsetor;


            linha.style.display =
                (
                    correspondeBusca &&
                    correspondeLocal &&
                    correspondeSubsetor
                )
                    ? ''
                    : 'none';

        }
    );

}


function popularFiltroSubsetoresDashboard() {

    const select =
        document.getElementById(
            'filtroSubsetorDashboard'
        );

    if (!select) {
        return;
    }

    const selectLocal =
        document.getElementById(
            'filtroLocalDashboard'
        );

    // O Local usa diretamente o ID como value.
    const valorLocal =
        selectLocal?.value || '';

    const valorSubsetorAtual =
        select.value || '';

    select.innerHTML =
        '<option value="">Todos os Subsetores</option>';

    const localIdSelecionado =
        valorLocal !== ''
            ? Number(valorLocal)
            : null;

    const filtrarPorLocal =
        localIdSelecionado !== null &&
        Number.isFinite(localIdSelecionado);

    const lista =
        Array.isArray(subsetores)
            ? [...subsetores]
                .filter(
                    s => {

                        if (
                            !s ||
                            s.ativo === false
                        ) {
                            return false;
                        }

                        if (
                            !filtrarPorLocal
                        ) {
                            return true;
                        }

                        return Number(
                            s.local_id
                        ) ===
                        localIdSelecionado;

                    }
                )
                .sort(
                    (a, b) =>
                        String(a.nome || '')
                            .localeCompare(
                                String(b.nome || ''),
                                'pt-BR',
                                {
                                    sensitivity:
                                        'base'
                                }
                            )
                )
            : [];

    lista.forEach(
        s => {

            const option =
                document.createElement(
                    'option'
                );

            option.value =
                String(s.id);

            option.textContent =
                s.nome || '';

            select.appendChild(
                option
            );

        }
    );

    /*
       Se o subsetor anteriormente selecionado
       não pertence ao novo Local, limpa-o.
    */

    if (
        valorSubsetorAtual &&
        [...select.options].some(
            option =>
                option.value ===
                valorSubsetorAtual
        )
    ) {

        select.value =
            valorSubsetorAtual;

    } else {

        select.value =
            '';

    }

}


function atualizarSubsetoresDashboardPorLocal() {

    popularFiltroSubsetoresDashboard();

    filtrarDashboard();

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
                String(local.id);


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

    popularFiltroSubsetoresDashboard();

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
                .select('*, usuarios:usuario_id(nome,email)')
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

                const origemCompleta = formatarLocalSubsetor(mov.origem_id, mov.origem_subsetor_id);
                const destinoCompleto = formatarLocalSubsetor(mov.destino_id, mov.destino_subsetor_id);


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
                            origemCompleta
                        )}

                    </td>


                    <td>

                        ${escaparHTML(
                            destinoCompleto
                        )}

                    </td>


                    <td>

                        ${escaparHTML(
                            mov.observacao ||
                            '-'
                        )}

                    </td>


                    <td>
                        ${escaparHTML(mov.usuarios?.nome || mov.usuarios?.email || '—')}
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
        formatarLocalSubsetor(item.local_id, item.subsetor_id);

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
        formatarLocalSubsetor(
            item.local_id,
            item.subsetor_id
        );

    const destino =
        destinoSelect?.value
            ? formatarLocalSubsetor(
                destinoSelect.value,
                document.getElementById('destinoSubsetor')?.value || null
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

    const destinoSubsetorId =
        document.getElementById('destinoSubsetor')?.value || null;

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

    const origemSubsetorId = item.subsetor_id ? Number(item.subsetor_id) : null;
    const destino =
        Number(destinoId);
    const destinoSubsetor = destinoSubsetorId ? Number(destinoSubsetorId) : null;

    if (
        origemId === destino &&
        origemSubsetorId === destinoSubsetor
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
                    destino,

                subsetor_id:
                    destinoSubsetor

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

                        origem_subsetor_id:
                            origemSubsetorId,

                        destino_subsetor_id:
                            destinoSubsetor,

                        usuario_id:
                            usuarioLogado?.id || null,

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

            let consultaDestino = supabaseClient
                .from('itens')
                .select('*')
                .eq('nome', item.nome)
                .eq('local_id', destino);

            consultaDestino = destinoSubsetor
                ? consultaDestino.eq('subsetor_id', destinoSubsetor)
                : consultaDestino.is('subsetor_id', null);

            const {
                data: destinoExistente,
                error: erroBuscaDestino
            } = await consultaDestino
                .is('patrimonio', null)
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

                            subsetor_id:
                                destinoSubsetor,

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

                        origem_subsetor_id:
                            origemSubsetorId,

                        destino_subsetor_id:
                            destinoSubsetor,

                        usuario_id:
                            usuarioLogado?.id || null,

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

        await registrarAuditoria('MOVIMENTACAO', {
            item_id: Number(item.id),
            descricao: `Movimentação: ${item.nome || item.patrimonio || 'Item'}`,
            detalhes: {
                origem_id: origemId,
                origem_subsetor_id: origemSubsetorId,
                destino_id: destino,
                destino_subsetor_id: destinoSubsetor,
                quantidade,
                observacao,
                status: statusNovo || item.status || 'Ativo'
            }
        });

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
        const destinoSubsetorCampo = document.getElementById('destinoSubsetor');
        if (destinoSubsetorCampo) destinoSubsetorCampo.value = '';

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

            await carregarLocaisBanco();
            carregarLocais();
            await carregarSubsetores();

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

                abrirTela(document.getElementById('ondeEstaTela') ? 'ondeEstaTela' : 'dashboardTela', document.getElementById('menuOndeEsta') || document.getElementById('menuDashboard'));

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

/* =========================================================
   INTEGRAÇÃO DAS NOVAS FUNCIONALIDADES
========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
    const local = document.getElementById('local');
    const destino = document.getElementById('destino');
    if (local) local.addEventListener('change', popularSubsetoresCadastro);
    if (destino) destino.addEventListener('change', popularSubsetoresMovimentacao);

    await carregarSubsetores();
    if (usuarioLogado) {
        await carregarUsuariosAdmin();
        await carregarAuditoria();
    }
});

window.abrirAdministracao = abrirAdministracao;
window.criarUsuario = criarUsuario;
window.alternarStatusUsuario = alternarStatusUsuario;
window.criarSubsetor = criarSubsetor;
window.editarSubsetor = editarSubsetor;
window.inativarSubsetor = inativarSubsetor;
window.carregarUsuariosAdmin = carregarUsuariosAdmin;
window.carregarAuditoria = carregarAuditoria;


/* ######################## V3 — MOVIMENTAÇÃO SEGURA (manter no final) ######################## */



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
        .ilike('email', usuarioLogado.email)
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
        await Promise.all([carregarItens(), carregarProdutos()]);

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

        renderizarResumoExtra(error ? null : resumo);

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
            const foto = await enviarFoto(arquivo, 'inventario');
            caminhoFoto = foto.caminho;
            fotoUrl = foto.url;
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
            p_observacao: valor('observacaoMov') || null,
            p_definitivo: document.querySelector('input[name="tipoMovimentacao"]:checked')?.value === 'definitiva',
            p_retorno_previsto: valor('retornoPrevisto') || null
        });

        if (error) throw error;

        alert(
            ({ SAIDA_TEMPORARIA: 'Saída temporária registrada! A peça aparece em "Fora do lugar" até voltar.',
               REMANEJAMENTO: 'Remanejamento registrado! O destino agora é o local fixo da peça.',
               DEVOLUCAO: 'Devolução registrada! A peça voltou ao local de origem.',
               STATUS: 'Status alterado com sucesso!' }[data?.tipo] || 'Movimentação realizada com sucesso!') +
            (data?.saldo_origem > 0 ? `\n\nRestam ${data.saldo_origem} peça(s) no local de saída.` : '')
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
    ENTRADA: 'Cadastro',
    TRANSFERENCIA: 'Transferência',
    SAIDA_TEMPORARIA: 'Saída temporária',
    REMANEJAMENTO: 'Remanejamento',
    DEVOLUCAO: 'Devolução',
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
                mudouStatus ? `${mov.status_anterior} → ${mov.status_novo}` : '',
                mov.retorno_previsto ? `Retorno previsto: ${new Date(mov.retorno_previsto + 'T12:00:00').toLocaleDateString('pt-BR')}` : '',
                mov.observacao || ''
            ].filter(Boolean).join(' · ') || '—';

            return `
                <tr>
                    <td><span class="mov-tipo mov-${escaparHTML(String(mov.tipo_movimento || '').toLowerCase())}">${escaparHTML(ROTULOS_MOVIMENTO[mov.tipo_movimento] || 'Movimentação')}</span></td>
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


/* ######################## V4 — CATÁLOGO E LOCAIS (manter no final) ######################## */

/* =========================================================
   V4 — CATÁLOGO DE PEÇAS + LOCAIS ADMINISTRÁVEIS
   Requer migration_inventario_v4.sql.
   (Mantenha este bloco no FINAL do app.js.)
========================================================= */


/* =========================================================
   ESTADO
========================================================= */

let LOCAIS_TODOS = LOCAIS.map(local => ({ ...local, ativo: true }));
let produtos = [];


const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numero = new Intl.NumberFormat('pt-BR');

function normalizarTexto(valor) {
    return String(valor || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().trim().replace(/\s+/g, ' ');
}

function chaveNome(valor) {
    return String(valor || '').toLowerCase().trim();
}


/* =========================================================
   AVISOS (substituem o alert nas telas novas)
========================================================= */

function avisar(mensagem, tipo = 'sucesso') {
    let area = document.getElementById('mcAvisos');
    if (!area) {
        area = Object.assign(document.createElement('div'), { id: 'mcAvisos', className: 'mc-avisos' });
        area.setAttribute('aria-live', 'polite');
        document.body.appendChild(area);
    }

    const icones = { sucesso: 'fa-circle-check', erro: 'fa-circle-exclamation', info: 'fa-circle-info' };
    const aviso = document.createElement('div');
    aviso.className = `mc-aviso mc-aviso-${tipo}`;
    aviso.innerHTML = `<i class="fa-solid ${icones[tipo] || icones.info}"></i><span>${escaparHTML(mensagem)}</span>`;
    area.appendChild(aviso);

    setTimeout(() => aviso.classList.add('saindo'), tipo === 'erro' ? 6000 : 3500);
    setTimeout(() => aviso.remove(), tipo === 'erro' ? 6400 : 3900);
}

function traduzirErro(erro) {
    const codigo = erro?.code;
    const texto = erro?.message || String(erro || '');

    if (codigo === '23505' && /produtos/.test(texto)) return 'Já existe uma peça com esse nome no catálogo.';
    if (codigo === '23505' && /locais/.test(texto)) return 'Já existe um local com esse nome.';
    if (codigo === '42501' || /row-level security|permission denied/i.test(texto)) {
        return 'Seu perfil não tem permissão para esta operação.';
    }
    if (/relation .* does not exist|Could not find the table/i.test(texto)) {
        return 'A migração v4 ainda não foi executada no Supabase.';
    }
    return texto || 'Erro desconhecido.';
}


/* =========================================================
   FORMULÁRIO EM JANELA (substitui o prompt)
========================================================= */

let formularioAtual = null;

function garantirModalFormulario() {
    let modal = document.getElementById('mcModalForm');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'mcModalForm';
    modal.className = 'mc-modal';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="mc-modal-caixa" role="dialog" aria-modal="true" aria-labelledby="mcModalTitulo">
            <header class="mc-modal-topo">
                <div>
                    <h3 id="mcModalTitulo"></h3>
                    <p id="mcModalSubtitulo"></p>
                </div>
                <button type="button" class="mc-modal-x" aria-label="Fechar" data-fechar>
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </header>
            <form id="mcModalCorpo" class="mc-modal-corpo" novalidate></form>
            <div id="mcModalErro" class="mc-modal-erro" hidden></div>
            <footer class="mc-modal-rodape">
                <button type="button" class="btn-secondary" data-fechar>Cancelar</button>
                <button type="submit" form="mcModalCorpo" class="btn-primary" id="mcModalSalvar">Salvar</button>
            </footer>
        </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', evento => {
        if (evento.target === modal || evento.target.closest('[data-fechar]')) fecharFormulario();
    });
    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape' && !modal.hidden) fecharFormulario();
    });
    modal.querySelector('#mcModalCorpo').addEventListener('submit', enviarFormulario);

    return modal;
}

function campoFormularioHTML(campo) {
    const id = `mcCampo_${campo.id}`;
    const valor = campo.valor ?? '';
    const obrigatorio = campo.obrigatorio ? 'required' : '';
    const classe = `input-group mc-campo ${campo.largo ? 'mc-campo-largo' : ''}`;
    const ajuda = campo.ajuda ? `<small>${escaparHTML(campo.ajuda)}</small>` : '';
    const rotulo = `<label for="${id}">${escaparHTML(campo.rotulo)}${campo.obrigatorio ? ' <b>*</b>' : ''}</label>`;

    if (campo.tipo === 'checkbox') {
        return `<label class="mc-check ${campo.largo ? 'mc-campo-largo' : ''}">
                    <input type="checkbox" id="${id}" ${valor ? 'checked' : ''}>
                    <span>${escaparHTML(campo.rotulo)}</span>
                </label>`;
    }
    if (campo.tipo === 'textarea') {
        return `<div class="${classe}">${rotulo}
                    <textarea id="${id}" rows="3" ${obrigatorio} placeholder="${escaparHTML(campo.placeholder || '')}">${escaparHTML(valor)}</textarea>${ajuda}</div>`;
    }
    if (campo.tipo === 'select') {
        const opcoes = (campo.opcoes || []).map(opcao =>
            `<option value="${escaparHTML(opcao.valor)}" ${String(opcao.valor) === String(valor) ? 'selected' : ''}>${escaparHTML(opcao.texto)}</option>`
        ).join('');
        return `<div class="${classe}">${rotulo}<select id="${id}" ${obrigatorio}>${opcoes}</select>${ajuda}</div>`;
    }
    if (campo.tipo === 'file') {
        const previa = campo.valor
            ? `<img src="${escaparHTML(campo.valor)}" alt="Foto atual" class="mc-previa-foto" id="${id}_previa">`
            : `<div class="mc-previa-foto mc-previa-vazia" id="${id}_previa"><i class="fa-solid fa-image"></i></div>`;
        return `<div class="${classe} mc-campo-foto">${rotulo}
                    <div class="mc-foto-linha">${previa}
                        <div><input type="file" id="${id}" accept="image/*">
                        <small>A imagem é reduzida automaticamente antes do envio.</small></div>
                    </div></div>`;
    }
    return `<div class="${classe}">${rotulo}
                <input id="${id}" type="${campo.tipo || 'text'}" value="${escaparHTML(valor)}" ${obrigatorio}
                    ${campo.lista ? `list="${campo.lista}"` : ''}
                    ${campo.min !== undefined ? `min="${campo.min}"` : ''}
                    ${campo.step ? `step="${campo.step}"` : ''}
                    placeholder="${escaparHTML(campo.placeholder || '')}" autocomplete="off">${ajuda}</div>`;
}

function abrirFormulario({ titulo, subtitulo = '', campos, textoSalvar = 'Salvar', aoSalvar }) {
    const modal = garantirModalFormulario();
    formularioAtual = { campos, aoSalvar };

    modal.querySelector('#mcModalTitulo').textContent = titulo;
    modal.querySelector('#mcModalSubtitulo').textContent = subtitulo;
    modal.querySelector('#mcModalSalvar').textContent = textoSalvar;
    modal.querySelector('#mcModalErro').hidden = true;
    modal.querySelector('#mcModalCorpo').innerHTML = campos.map(campoFormularioHTML).join('');

    campos.filter(campo => campo.tipo === 'file').forEach(campo => {
        const entrada = document.getElementById(`mcCampo_${campo.id}`);
        entrada?.addEventListener('change', () => {
            const arquivo = entrada.files?.[0];
            const previa = document.getElementById(`mcCampo_${campo.id}_previa`);
            if (!arquivo || !previa) return;
            const img = Object.assign(document.createElement('img'), {
                src: URL.createObjectURL(arquivo), className: 'mc-previa-foto', id: previa.id, alt: 'Nova foto'
            });
            previa.replaceWith(img);
        });
    });

    modal.hidden = false;
    document.body.classList.add('modal-aberto');
    setTimeout(() => modal.querySelector('input:not([type=checkbox]):not([type=file]), select, textarea')?.focus(), 30);
}

function fecharFormulario() {
    const modal = document.getElementById('mcModalForm');
    if (modal) modal.hidden = true;
    document.body.classList.remove('modal-aberto');
    formularioAtual = null;
}

function lerFormulario() {
    const valores = {};
    formularioAtual.campos.forEach(campo => {
        const elemento = document.getElementById(`mcCampo_${campo.id}`);
        if (!elemento) return;
        if (campo.tipo === 'checkbox') valores[campo.id] = elemento.checked;
        else if (campo.tipo === 'file') valores[campo.id] = elemento.files?.[0] || null;
        else if (campo.tipo === 'number') valores[campo.id] = elemento.value === '' ? null : Number(elemento.value);
        else valores[campo.id] = elemento.value.trim();
    });
    return valores;
}

async function enviarFormulario(evento) {
    evento.preventDefault();
    if (!formularioAtual) return;

    const modal = document.getElementById('mcModalForm');
    const erro = modal.querySelector('#mcModalErro');
    const botao = modal.querySelector('#mcModalSalvar');
    const valores = lerFormulario();

    const faltando = formularioAtual.campos.find(campo => campo.obrigatorio && !valores[campo.id] && valores[campo.id] !== 0);
    if (faltando) {
        erro.textContent = `Preencha o campo "${faltando.rotulo}".`;
        erro.hidden = false;
        document.getElementById(`mcCampo_${faltando.id}`)?.focus();
        return;
    }

    const textoBotao = botao.textContent;
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    erro.hidden = true;

    try {
        await formularioAtual.aoSalvar(valores);
        fecharFormulario();
    } catch (falha) {
        console.error('ERRO NO FORMULÁRIO:', falha);
        erro.textContent = traduzirErro(falha);
        erro.hidden = false;
    } finally {
        botao.disabled = false;
        botao.textContent = textoBotao;
    }
}


/* =========================================================
   FOTOS — reduzidas no navegador antes do envio
   (fotos de celular têm 4–8 MB; viram ~200–400 KB)
========================================================= */

async function comprimirImagem(arquivo, ladoMaximo = 1600, qualidade = 0.82) {
    if (!arquivo?.type?.startsWith('image/') || /gif|svg/.test(arquivo.type)) return arquivo;

    try {
        const bitmap = await createImageBitmap(arquivo);
        const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
        if (escala === 1 && arquivo.size < 600 * 1024) return arquivo;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * escala);
        canvas.height = Math.round(bitmap.height * escala);
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise(resolver => canvas.toBlob(resolver, 'image/jpeg', qualidade));
        if (!blob || blob.size >= arquivo.size) return arquivo;

        const nome = arquivo.name.replace(/\.[^.]+$/, '') + '.jpg';
        return new File([blob], nome, { type: 'image/jpeg' });
    } catch (erro) {
        console.warn('Não foi possível reduzir a imagem; enviando original.', erro);
        return arquivo;
    }
}

async function enviarFoto(arquivo, pasta = 'inventario') {
    const final = await comprimirImagem(arquivo);
    const extensao = (final.name.split('.').pop() || 'jpg').toLowerCase();
    const caminho = `${pasta}/${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabaseClient.storage
        .from('inventario')
        .upload(caminho, final, { upsert: false, contentType: final.type });

    if (error) throw new Error('Erro ao enviar a foto: ' + error.message);

    return {
        caminho,
        url: supabaseClient.storage.from('inventario').getPublicUrl(caminho).data.publicUrl
    };
}


/* =========================================================
   LOCAIS — agora vêm do banco
========================================================= */

async function carregarLocaisBanco() {
    try {
        const { data, error } = await supabaseClient
            .from('locais')
            .select('id, nome, ativo, ordem')
            .order('ordem', { ascending: true })
            .order('id', { ascending: true });

        if (error) throw error;
        if (!data?.length) return;

        LOCAIS_TODOS = data;
        LOCAIS = data.filter(local => local.ativo !== false).map(local => ({ id: local.id, nome: local.nome }));
    } catch (erro) {
        console.warn('Tabela de locais indisponível; usando a lista do app.js.', erro?.message || erro);
    }
}

function nomeLocal(localId) {
    const local = LOCAIS_TODOS.find(registro => String(registro.id) === String(localId));
    if (!local) return 'SEM LOCAL';
    return local.ativo === false ? `${local.nome} (inativo)` : local.nome;
}

function atualizarLocaisNaTela() {
    carregarLocais();
    carregarFiltroLocaisDashboard();
    carregarLocaisConsultaPublica();
    carregarSubsetores();
    renderizarLocaisAdmin();
    definirTexto('totalLocais', LOCAIS.length);
}

function renderizarLocaisAdmin() {
    const tbody = document.getElementById('listaLocaisAdmin');
    if (!tbody) return;

    const unidadesPorLocal = {};
    itens.forEach(item => {
        unidadesPorLocal[item.local_id] = (unidadesPorLocal[item.local_id] || 0) + quantidadeItem(item);
    });

    tbody.innerHTML = LOCAIS_TODOS.map(local => {
        const ativo = local.ativo !== false;
        return `
            <tr class="${ativo ? '' : 'linha-inativa'}">
                <td><strong>${escaparHTML(local.nome)}</strong></td>
                <td>${numero.format(unidadesPorLocal[local.id] || 0)}</td>
                <td><span class="status-badge ${ativo ? 'ativo' : 'inativo'}">${ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td class="admin-actions">
                    <button type="button" class="btn-icon" title="Renomear" onclick="editarLocal(${Number(local.id)})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="btn-icon" title="${ativo ? 'Inativar' : 'Reativar'}" onclick="alternarLocal(${Number(local.id)})">
                        <i class="fa-solid ${ativo ? 'fa-ban' : 'fa-rotate-left'}"></i>
                    </button>
                </td>
            </tr>`;
    }).join('') || '<tr><td colspan="4" class="empty-state">Nenhum local cadastrado.</td></tr>';
}

function novoLocal() {
    if (!podeAdministrar()) return avisar('Somente Gestor ou Administrador gerencia locais.', 'erro');

    abrirFormulario({
        titulo: 'Novo local',
        subtitulo: 'O local fica disponível imediatamente em todas as telas.',
        textoSalvar: 'Criar local',
        campos: [{ id: 'nome', rotulo: 'Nome do local', obrigatorio: true, placeholder: 'Ex.: CASA 7', largo: true }],
        aoSalvar: async ({ nome }) => {
            const ordem = Math.max(0, ...LOCAIS_TODOS.map(local => Number(local.ordem) || 0)) + 1;
            const { error } = await supabaseClient.from('locais').insert([{ nome: nome.toUpperCase(), ordem }]);
            if (error) throw error;
            await carregarLocaisBanco();
            atualizarLocaisNaTela();
            avisar(`Local "${nome.toUpperCase()}" criado.`);
        }
    });
}

function editarLocal(id) {
    if (!podeAdministrar()) return avisar('Somente Gestor ou Administrador gerencia locais.', 'erro');
    const local = LOCAIS_TODOS.find(registro => Number(registro.id) === Number(id));
    if (!local) return;

    abrirFormulario({
        titulo: 'Renomear local',
        subtitulo: 'O nome muda em todo o sistema, inclusive no histórico.',
        campos: [{ id: 'nome', rotulo: 'Nome do local', valor: local.nome, obrigatorio: true, largo: true }],
        aoSalvar: async ({ nome }) => {
            const { error } = await supabaseClient.from('locais').update({ nome: nome.toUpperCase() }).eq('id', id);
            if (error) throw error;
            await carregarLocaisBanco();
            atualizarLocaisNaTela();
            avisar('Local renomeado.');
        }
    });
}

async function alternarLocal(id) {
    if (!podeAdministrar()) return avisar('Somente Gestor ou Administrador gerencia locais.', 'erro');
    const local = LOCAIS_TODOS.find(registro => Number(registro.id) === Number(id));
    if (!local) return;

    const ativar = local.ativo === false;
    const unidades = itens.filter(item => Number(item.local_id) === Number(id))
        .reduce((total, item) => total + quantidadeItem(item), 0);

    const mensagem = ativar
        ? `Reativar o local "${local.nome}"?`
        : `Inativar o local "${local.nome}"?` +
          (unidades ? `\n\nEle possui ${numero.format(unidades)} unidade(s). Elas continuam registradas lá, ` +
                      `mas não será possível enviar novos itens para este local.` : '');

    if (!confirm(mensagem)) return;

    const { error } = await supabaseClient.from('locais').update({ ativo: ativar }).eq('id', id);
    if (error) return avisar(traduzirErro(error), 'erro');

    await carregarLocaisBanco();
    atualizarLocaisNaTela();
    avisar(ativar ? 'Local reativado.' : 'Local inativado.');
}


/* =========================================================
   PRODUTOS — catálogo
========================================================= */

async function carregarProdutos() {
    try {
        produtos = await buscarTodasLinhas(() =>
            supabaseClient
                .from('vw_produtos_saldo')
                .select('*')
                .order('nome', { ascending: true })
        );
    } catch (erro) {
        console.warn('Catálogo de produtos indisponível:', erro?.message || erro);
        produtos = [];
    }

    popularListasCatalogo();
    popularFiltroCategoriasProduto();
    renderizarProdutos();
    atualizarDicaProduto();
}

function categoriasExistentes() {
    const mapa = new Map();
    produtos.forEach(produto => {
        const categoria = String(produto.categoria || '').trim();
        if (categoria) mapa.set(normalizarTexto(categoria), categoria);
    });
    return [...mapa.values()].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
}

function popularListasCatalogo() {
    const garantirLista = id => {
        let lista = document.getElementById(id);
        if (!lista) {
            lista = Object.assign(document.createElement('datalist'), { id });
            document.body.appendChild(lista);
        }
        return lista;
    };

    garantirLista('dlProdutos').innerHTML = produtos
        .filter(produto => produto.ativo !== false)
        .map(produto => `<option value="${escaparHTML(produto.nome)}">${escaparHTML(produto.categoria || '')}</option>`)
        .join('');

    garantirLista('dlCategorias').innerHTML = categoriasExistentes()
        .map(categoria => `<option value="${escaparHTML(categoria)}"></option>`)
        .join('');
}

function popularFiltroCategoriasProduto() {
    const select = document.getElementById('filtroCategoriaProduto');
    if (!select) return;
    const atual = select.value;
    select.innerHTML = '<option value="">Todas as categorias</option>' +
        categoriasExistentes().map(categoria =>
            `<option value="${escaparHTML(categoria)}">${escaparHTML(categoria)}</option>`).join('');
    if ([...select.options].some(opcao => opcao.value === atual)) select.value = atual;
}

function produtoPorNome(nome) {
    const chave = chaveNome(nome);
    return chave ? produtos.find(produto => chaveNome(produto.nome) === chave) : null;
}

function situacaoProduto(produto) {
    return produto.ativo === false
        ? { classe: 'inativo', texto: 'Inativa' }
        : { classe: 'ativo', texto: 'Ativa' };
}

function renderizarProdutos() {
    const tbody = document.getElementById('listaProdutos');
    if (!tbody) return;

    const busca = normalizarTexto(document.getElementById('buscaProduto')?.value);
    const categoria = document.getElementById('filtroCategoriaProduto')?.value || '';
    const mostrarInativos = document.getElementById('filtroProdutosInativos')?.checked;
    const gestao = podeAdministrar();

    const lista = produtos.filter(produto =>
        (mostrarInativos || produto.ativo !== false) &&
        (!categoria || normalizarTexto(produto.categoria) === normalizarTexto(categoria)) &&
        (!busca || normalizarTexto(`${produto.nome} ${produto.categoria} ${produto.descricao}`).includes(busca))
    );

    definirTexto('produtosTotal', numero.format(lista.length));

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">
            <i class="fa-solid fa-couch"></i>
            ${produtos.length ? 'Nenhuma peça encontrada com esses filtros.' : 'Nenhuma peça no catálogo.'}</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(produto => {
        const situacao = situacaoProduto(produto);
        const total = Number(produto.saldo_total) || 0;
        const manutencao = Number(produto.saldo_manutencao) || 0;
        const valor = Number(produto.custo_unitario) || 0;
        const foto = produto.foto_url
            ? `<img src="${escaparHTML(produto.foto_url)}" alt="" class="foto-tabela" loading="lazy"
                   onclick="abrirModalFoto('${escaparHTML(produto.foto_url)}')">`
            : '<div class="sem-foto"><i class="fa-solid fa-image"></i></div>';

        return `
            <tr class="${produto.ativo === false ? 'linha-inativa' : ''}">
                <td>${foto}</td>
                <td>
                    <strong>${escaparHTML(produto.nome)}</strong>
                    ${produto.descricao ? `<small class="celula-sub">${escaparHTML(produto.descricao)}</small>` : ''}
                </td>
                <td>${escaparHTML(produto.categoria || '—')}</td>
                <td class="num">
                    <strong>${numero.format(total)}</strong>
                    ${manutencao ? `<small class="celula-sub">${numero.format(manutencao)} em manutenção</small>` : ''}
                </td>
                <td class="num">${numero.format(Number(produto.locais) || 0)}</td>
                <td class="num">${valor ? moeda.format(valor) : '—'}</td>
                <td><span class="status-badge ${situacao.classe}">${situacao.texto}</span></td>
                <td>
                    <div class="acoes-tabela">
                        <button type="button" class="btn-icon" title="Onde está" onclick="verProdutoNoEstoque(${Number(produto.id)})">
                            <i class="fa-solid fa-location-dot"></i>
                        </button>
                        ${gestao ? `<button type="button" class="btn-icon" title="Editar peça" onclick="abrirProduto(${Number(produto.id)})">
                            <i class="fa-solid fa-pen"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function camposProduto(produto = {}) {
    const campos = [
        { id: 'nome', rotulo: 'Nome da peça', valor: produto.nome, obrigatorio: true, placeholder: 'Ex.: Mesa de jantar oval' },
        { id: 'categoria', rotulo: 'Categoria', valor: produto.categoria, lista: 'dlCategorias', placeholder: 'Ex.: Mesas, Quadros, Vasos',
          ajuda: 'Escolha uma existente para manter o padrão.' },
        { id: 'descricao', rotulo: 'Descrição', tipo: 'textarea', valor: produto.descricao, largo: true,
          placeholder: 'Cor, material, medidas, detalhes que ajudam a reconhecer a peça...' },
        { id: 'custo_unitario', rotulo: 'Valor de referência por peça (R$) — opcional', tipo: 'number', min: 0, step: '0.01',
          valor: produto.custo_unitario || '', placeholder: '0,00', ajuda: 'Para seguro e controle patrimonial.', largo: true },
        { id: 'foto', rotulo: 'Foto', tipo: 'file', valor: produto.foto_url, largo: true }
    ];
    if (produto.id) campos.push({ id: 'ativo', rotulo: 'Peça ativa (aparece nas sugestões do cadastro)', tipo: 'checkbox', valor: produto.ativo !== false, largo: true });
    return campos;
}

async function salvarProduto(id, valores) {
    let foto = null;

    try {
        if (valores.foto) foto = await enviarFoto(valores.foto, 'produtos');

        const dados = {
            nome: valores.nome,
            categoria: valores.categoria || null,
            custo_unitario: Math.max(0, Number(valores.custo_unitario) || 0),
            descricao: valores.descricao || null
        };
        if (foto) dados.foto_url = foto.url;
        if (id) dados.ativo = valores.ativo !== false;

        const consulta = id
            ? supabaseClient.from('produtos').update(dados).eq('id', id).select('id')
            : supabaseClient.from('produtos').insert([dados]).select('id');

        const { data, error } = await consulta;
        if (error) throw error;
        if (!data?.length) throw new Error('Seu perfil não tem permissão para esta operação.');
    } catch (erro) {
        if (foto) await supabaseClient.storage.from('inventario').remove([foto.caminho]);
        throw erro;
    }

    await Promise.all([carregarProdutos(), carregarItens()]);
}

function novoProduto(nomeSugerido = '') {
    if (!podeAdministrar()) return avisar('Somente Gestor ou Administrador cria peças no catálogo.', 'erro');

    abrirFormulario({
        titulo: 'Nova peça no catálogo',
        subtitulo: 'Depois, use "Cadastrar peças" para informar quantidade, local e setor.',
        textoSalvar: 'Criar peça',
        campos: camposProduto({ nome: nomeSugerido }),
        aoSalvar: async valores => {
            await salvarProduto(null, valores);
            avisar(`Peça "${valores.nome}" criada no catálogo.`);
        }
    });
}

function abrirProduto(id) {
    if (!podeAdministrar()) return avisar('Somente Gestor ou Administrador edita o catálogo.', 'erro');
    const produto = produtos.find(registro => Number(registro.id) === Number(id));
    if (!produto) return avisar('Peça não encontrada. Atualize a página.', 'erro');

    const total = Number(produto.saldo_total) || 0;
    abrirFormulario({
        titulo: 'Editar peça',
        subtitulo: total
            ? `${numero.format(total)} peça(s) em ${produto.locais || 0} local(is). A alteração vale para todas.`
            : 'Nenhuma unidade cadastrada no momento.',
        campos: camposProduto(produto),
        aoSalvar: async valores => {
            await salvarProduto(id, valores);
            avisar('Peça atualizada.');
        }
    });
}

function verProdutoNoEstoque(id) {
    const produto = produtos.find(registro => Number(registro.id) === Number(id));
    if (!produto) return;
    abrirOndeEsta(produto.nome);
}

/* O botão de editar da tabela de Estoque agora edita o produto. */
function editarItem(id) {
    const item = itens.find(registro => Number(registro.id) === Number(id));
    if (!item) return avisar('Item não encontrado.', 'erro');
    if (!podeAdministrar()) {
        return avisar('Nome, categoria, descrição e foto ficam no Catálogo, editado por Gestor ou Administrador.', 'info');
    }
    if (!item.produto_id) return avisar('Execute a migração v4 para editar pelo catálogo.', 'erro');
    abrirProduto(item.produto_id);
}


/* =========================================================
   CADASTRO — usa o catálogo
========================================================= */

function atualizarDicaProduto() {
    const campoNome = document.getElementById('nome');
    const campoCategoria = document.getElementById('tipoItem');
    const dica = document.getElementById('dicaProdutoCadastro');
    if (!campoNome || !dica) return;

    const nome = campoNome.value.trim();
    const produto = produtoPorNome(nome);

    if (!nome) {
        dica.className = 'mc-dica';
        dica.innerHTML = produtos.length
            ? `<i class="fa-solid fa-magnifying-glass"></i> Digite para buscar entre ${numero.format(produtos.length)} peças do catálogo.`
            : '';
        if (campoCategoria) campoCategoria.readOnly = false;
        return;
    }

    if (produto) {
        if (campoCategoria) {
            campoCategoria.value = produto.categoria || '';
            campoCategoria.readOnly = true;
        }
        const total = Number(produto.saldo_total) || 0;
        dica.className = 'mc-dica mc-dica-ok';
        dica.innerHTML = `<i class="fa-solid fa-circle-check"></i> Peça já existe no catálogo ·
            <strong>${numero.format(total)}</strong> cadastrada(s) em ${numero.format(Number(produto.locais) || 0)} local(is).
            A quantidade será somada no local escolhido.`;
    } else {
        if (campoCategoria) campoCategoria.readOnly = false;
        dica.className = 'mc-dica mc-dica-novo';
        dica.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Peça nova — será criada no catálogo ao salvar.
            Confira nas sugestões se ela não existe com outro nome.`;
    }
}

(function () {
    const limparOriginal = limparFormularioCadastro;
    limparFormularioCadastro = function () {
        limparOriginal();
        const categoria = document.getElementById('tipoItem');
        if (categoria) categoria.readOnly = false;
        atualizarDicaProduto();
    };
})();


/* =========================================================
   SUBSETORES — edição em janela (sem prompt)
========================================================= */

function editarSubsetor(id) {
    if (!podeAdministrar()) return avisar('Usuário sem permissão.', 'erro');
    const atual = subsetores.find(subsetor => Number(subsetor.id) === Number(id));
    if (!atual) return;

    abrirFormulario({
        titulo: 'Renomear subsetor',
        subtitulo: nomeLocal(atual.local_id),
        campos: [{ id: 'nome', rotulo: 'Nome do subsetor', valor: atual.nome, obrigatorio: true, largo: true }],
        aoSalvar: async ({ nome }) => {
            const { error } = await supabaseClient.from('subsetores').update({ nome }).eq('id', id);
            if (error) throw error;
            await carregarSubsetores();
            avisar('Subsetor renomeado.');
        }
    });
}


/* =========================================================
   DASHBOARD — valor do patrimônio e alertas
========================================================= */

function renderizarResumoExtra(resumo) {
    const area = document.getElementById('dashExtra');
    if (!area) return;

    const temOrigem = resumo && 'fora_do_lugar' in resumo;
    area.hidden = !temOrigem;
    if (!temOrigem) return;

    const fora = Number(resumo.fora_do_lugar) || 0;
    const atrasados = Number(resumo.retornos_atrasados) || 0;
    const valor = Number(resumo.valor_patrimonio) || 0;

    definirTexto('dashForaLugar', fora ? `${numero.format(fora)} peça(s)` : 'Tudo no lugar');
    definirTexto('dashAtrasados', atrasados ? `${numero.format(atrasados)} peça(s)` : 'Nenhum');
    definirTexto('dashValorPatrimonio', valor > 0 ? moeda.format(valor) : 'Não informado');

    document.getElementById('dashForaItem')?.classList.toggle('tem-alerta', fora > 0);
    document.getElementById('dashAtrasoItem')?.classList.toggle('tem-alerta', atrasados > 0);
}

/* =========================================================
   MENUS, ADMINISTRAÇÃO E EVENTOS
========================================================= */

(function () {
    const menusOriginal = atualizarMenus;
    atualizarMenus = function () {
        menusOriginal();
        const menuProdutos = document.getElementById('menuProdutos');
        if (menuProdutos) menuProdutos.style.display = usuarioLogado ? 'flex' : 'none';
        document.querySelectorAll('.somente-gestao').forEach(elemento => {
            elemento.style.display = podeAdministrar() ? '' : 'none';
        });
    };

    const administracaoOriginal = abrirAdministracao;
    abrirAdministracao = async function () {
        await administracaoOriginal();
        if (podeAdministrar()) renderizarLocaisAdmin();
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    const nome = document.getElementById('nome');
    if (nome) {
        nome.setAttribute('list', 'dlProdutos');
        nome.setAttribute('autocomplete', 'off');
        nome.addEventListener('input', atualizarDicaProduto);
        nome.addEventListener('change', atualizarDicaProduto);
    }
    document.getElementById('tipoItem')?.setAttribute('list', 'dlCategorias');

    ['buscaProduto', 'filtroCategoriaProduto', 'filtroProdutosInativos'].forEach(id => {
        const elemento = document.getElementById(id);
        elemento?.addEventListener(['checkbox', 'select-one'].includes(elemento.type) ? 'change' : 'input', renderizarProdutos);
    });

    popularListasCatalogo();
});

Object.assign(window, {
    novoProduto, abrirProduto, verProdutoNoEstoque, renderizarProdutos,
    novoLocal, editarLocal, alternarLocal, editarSubsetor, editarItem,
    abrirFormulario, fecharFormulario, avisar
});


/* ######################## V5 — ONDE ESTÁ / FORA DO LUGAR (manter no final) ######################## */

/* =========================================================
   V5 — ONDE ESTÁ? · LOCAL DE ORIGEM · FORA DO LUGAR
   Requer migration_inventario_v4.sql (versão com local de origem).
   (Mantenha este bloco no FINAL do app.js.)
========================================================= */


/* =========================================================
   AUXILIARES
========================================================= */

function localCompleto(localId, subsetorId) {
    return subsetorId ? `${nomeLocal(localId)} / ${nomeSubsetor(subsetorId)}` : nomeLocal(localId);
}

function temOrigem(item) {
    return item && item.origem_local_id !== undefined && item.origem_local_id !== null;
}

function estaForaDoLugar(item) {
    if (!temOrigem(item) || quantidadeItem(item) <= 0) return false;
    if (['Baixado', 'Extraviado'].includes(item.status)) return false;
    return String(item.local_id) !== String(item.origem_local_id) ||
           String(item.subsetor_id || '') !== String(item.origem_subsetor_id || '');
}

function dataCurta(valor) {
    if (!valor) return '';
    const data = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(valor + 'T12:00:00') : new Date(valor);
    return data.toLocaleDateString('pt-BR');
}

function hojeISO() {
    const agora = new Date();
    return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function retornoAtrasado(item) {
    return Boolean(item?.retorno_previsto) && item.retorno_previsto < hojeISO() && estaForaDoLugar(item);
}

function diasDesde(valor) {
    if (!valor) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(valor).getTime()) / 86400000));
}

function fotoDoItem(item) {
    if (item.foto_url) return item.foto_url;
    return produtos.find(produto => Number(produto.id) === Number(item.produto_id))?.foto_url || '';
}

function podeMovimentar() {
    return Boolean(usuarioLogado) && perfilUsuario !== 'consulta';
}

function seloFora(item) {
    if (!estaForaDoLugar(item)) return '';
    const atrasado = retornoAtrasado(item);
    const prazo = item.retorno_previsto
        ? (atrasado ? ` · retorno atrasado (${dataCurta(item.retorno_previsto)})` : ` · volta até ${dataCurta(item.retorno_previsto)}`)
        : '';
    return `<span class="selo-fora ${atrasado ? 'atrasado' : ''}">
                <i class="fa-solid fa-arrow-right-arrow-left"></i>
                Fora do lugar · é de ${escaparHTML(localCompleto(item.origem_local_id, item.origem_subsetor_id))}${prazo}
            </span>`;
}


/* =========================================================
   TELA "ONDE ESTÁ?"
========================================================= */

const LIMITE_GRUPOS_ONDE_ESTA = 40;
let temporizadorOndeEsta = null;

function abrirOndeEsta(texto) {
    abrirTela('ondeEstaTela', document.getElementById('menuOndeEsta'));
    const campo = document.getElementById('buscaOndeEsta');
    if (campo && texto !== undefined) campo.value = texto;
    renderizarOndeEsta();
    setTimeout(() => campo?.focus(), 50);
}

function popularFiltroLocalOndeEsta() {
    const select = document.getElementById('filtroLocalOndeEsta');
    if (!select) return;
    const atual = select.value;
    select.innerHTML = '<option value="">Todos os locais</option>' +
        LOCAIS_TODOS.map(local => `<option value="${local.id}">${escaparHTML(nomeLocal(local.id))}</option>`).join('');
    if ([...select.options].some(opcao => opcao.value === atual)) select.value = atual;
}

function agruparPorPeca(lista) {
    const grupos = new Map();
    lista.forEach(item => {
        const chave = item.produto_id ? `p${item.produto_id}` : `n${chaveNome(item.nome)}`;
        if (!grupos.has(chave)) {
            const produto = produtos.find(registro => Number(registro.id) === Number(item.produto_id));
            grupos.set(chave, {
                nome: produto?.nome || item.nome,
                categoria: produto?.categoria || (item.tipo !== item.nome ? item.tipo : ''),
                descricao: produto?.descricao || item.descricao || '',
                foto: produto?.foto_url || item.foto_url || '',
                itens: []
            });
        }
        const grupo = grupos.get(chave);
        grupo.itens.push(item);
        if (!grupo.foto && item.foto_url) grupo.foto = item.foto_url;
    });
    return [...grupos.values()];
}

function renderizarOndeEsta() {
    const area = document.getElementById('resultadosOndeEsta');
    if (!area) return;

    const busca = normalizarTexto(document.getElementById('buscaOndeEsta')?.value);
    const localFiltro = document.getElementById('filtroLocalOndeEsta')?.value || '';
    const somenteFora = document.getElementById('filtroSomenteFora')?.checked;

    const lista = itens.filter(item => {
        if (quantidadeItem(item) <= 0) return false;
        if (localFiltro && String(item.local_id) !== localFiltro && String(item.origem_local_id) !== localFiltro) return false;
        if (somenteFora && !estaForaDoLugar(item)) return false;
        if (!busca) return true;
        const texto = normalizarTexto([
            item.nome, item.tipo, item.descricao,
            localCompleto(item.local_id, item.subsetor_id),
            temOrigem(item) ? localCompleto(item.origem_local_id, item.origem_subsetor_id) : ''
        ].join(' '));
        return busca.split(' ').every(parte => texto.includes(parte));
    });

    const grupos = agruparPorPeca(lista)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));

    const totalPecas = lista.reduce((total, item) => total + quantidadeItem(item), 0);
    definirTexto('contadorOndeEsta', grupos.length
        ? `${numero.format(grupos.length)} tipo(s) de peça · ${numero.format(totalPecas)} peça(s)`
        : '');

    if (!grupos.length) {
        area.innerHTML = `
            <div class="onde-vazio">
                <i class="fa-solid fa-magnifying-glass-location"></i>
                <strong>${itens.length ? 'Nada encontrado' : 'Carregando inventário...'}</strong>
                <span>${itens.length ? 'Tente outro nome, uma categoria (ex.: "vaso", "quadro") ou o nome de um local.' : ''}</span>
            </div>`;
        return;
    }

    const mostrar = grupos.slice(0, LIMITE_GRUPOS_ONDE_ESTA);
    const movimentar = podeMovimentar();

    area.innerHTML = mostrar.map(grupo => {
        const total = grupo.itens.reduce((soma, item) => soma + quantidadeItem(item), 0);
        const fora = grupo.itens.filter(estaForaDoLugar).reduce((soma, item) => soma + quantidadeItem(item), 0);

        const linhas = grupo.itens
            .sort((a, b) => Number(estaForaDoLugar(b)) - Number(estaForaDoLugar(a)) ||
                            nomeLocal(a.local_id).localeCompare(nomeLocal(b.local_id), 'pt-BR'))
            .map(item => `
                <li class="${estaForaDoLugar(item) ? 'fora' : ''}">
                    <div class="onde-local">
                        <i class="fa-solid fa-location-dot"></i>
                        <div>
                            <strong>${escaparHTML(localCompleto(item.local_id, item.subsetor_id))}</strong>
                            ${item.status !== 'Ativo' ? `<span class="status-badge ${classeStatus(item.status)}">${escaparHTML(item.status)}</span>` : ''}
                            ${seloFora(item)}
                        </div>
                    </div>
                    <div class="onde-qtd">${numero.format(quantidadeItem(item))}</div>
                    ${movimentar ? `
                    <div class="onde-acoes">
                        ${estaForaDoLugar(item) ? `<button type="button" class="btn-icon btn-devolver" title="Devolver ao local de origem"
                            onclick="devolverPeca(${Number(item.id)})"><i class="fa-solid fa-rotate-left"></i></button>` : ''}
                        <button type="button" class="btn-icon" title="Movimentar" onclick="movimentarPeca(${Number(item.id)})">
                            <i class="fa-solid fa-right-left"></i></button>
                    </div>` : ''}
                </li>`).join('');

        const foto = grupo.foto
            ? `<img src="${escaparHTML(grupo.foto)}" alt="" loading="lazy" onclick="abrirModalFoto('${escaparHTML(grupo.foto)}')">`
            : '<div class="onde-sem-foto"><i class="fa-solid fa-couch"></i></div>';

        return `
            <article class="onde-card">
                <div class="onde-foto">${foto}</div>
                <div class="onde-corpo">
                    <header>
                        <div>
                            <h3>${escaparHTML(grupo.nome)}</h3>
                            <p>${[grupo.categoria, grupo.descricao].filter(Boolean).map(escaparHTML).join(' · ') || '&nbsp;'}</p>
                        </div>
                        <div class="onde-total">
                            <strong>${numero.format(total)}</strong>
                            <span>peça(s)${fora ? ` · <b>${numero.format(fora)} fora</b>` : ''}</span>
                        </div>
                    </header>
                    <ul class="onde-lista">${linhas}</ul>
                </div>
            </article>`;
    }).join('') + (grupos.length > LIMITE_GRUPOS_ONDE_ESTA
        ? `<p class="onde-mais">Mostrando ${LIMITE_GRUPOS_ONDE_ESTA} de ${numero.format(grupos.length)}. Digite mais detalhes para refinar.</p>`
        : '');
}


/* =========================================================
   TELA "FORA DO LUGAR"
========================================================= */

function abrirForaDoLugar(somenteAtrasados = false) {
    abrirTela('foraLugarTela', document.getElementById('menuForaLugar'));
    const filtro = document.getElementById('filtroAtrasados');
    if (filtro) filtro.checked = Boolean(somenteAtrasados);
    renderizarForaDoLugar();
}

function popularFiltroOrigemFora() {
    const select = document.getElementById('filtroOrigemFora');
    if (!select) return;
    const atual = select.value;
    const origens = [...new Set(itens.filter(estaForaDoLugar).map(item => String(item.origem_local_id)))];
    select.innerHTML = '<option value="">Todas as origens</option>' + origens
        .sort((a, b) => nomeLocal(a).localeCompare(nomeLocal(b), 'pt-BR'))
        .map(id => `<option value="${id}">É de ${escaparHTML(nomeLocal(id))}</option>`).join('');
    if ([...select.options].some(opcao => opcao.value === atual)) select.value = atual;
}

function atualizarContadorFora() {
    const fora = itens.filter(estaForaDoLugar);
    const pecas = fora.reduce((total, item) => total + quantidadeItem(item), 0);
    const atrasadas = fora.filter(retornoAtrasado).length;

    const selo = document.getElementById('badgeForaLugar');
    if (selo) {
        selo.textContent = pecas > 99 ? '99+' : String(pecas);
        selo.hidden = pecas === 0;
        selo.classList.toggle('atrasado', atrasadas > 0);
    }
}

function renderizarForaDoLugar() {
    const tbody = document.getElementById('listaForaLugar');
    atualizarContadorFora();
    popularFiltroOrigemFora();
    if (!tbody) return;

    const busca = normalizarTexto(document.getElementById('buscaForaLugar')?.value);
    const origem = document.getElementById('filtroOrigemFora')?.value || '';
    const somenteAtrasados = document.getElementById('filtroAtrasados')?.checked;
    const movimentar = podeMovimentar();

    const lista = itens.filter(item =>
        estaForaDoLugar(item) &&
        (!origem || String(item.origem_local_id) === origem) &&
        (!somenteAtrasados || retornoAtrasado(item)) &&
        (!busca || normalizarTexto(`${item.nome} ${item.tipo} ${localCompleto(item.local_id, item.subsetor_id)} ${localCompleto(item.origem_local_id, item.origem_subsetor_id)}`).includes(busca))
    ).sort((a, b) =>
        Number(retornoAtrasado(b)) - Number(retornoAtrasado(a)) ||
        String(a.fora_desde || '').localeCompare(String(b.fora_desde || ''))
    );

    const pecas = lista.reduce((total, item) => total + quantidadeItem(item), 0);
    definirTexto('totalForaLugar', numero.format(pecas));

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">
            <i class="fa-solid fa-circle-check"></i>
            ${itens.some(estaForaDoLugar) ? 'Nada encontrado com esses filtros.' : 'Tudo no lugar! Nenhuma peça fora do local de origem.'}
        </td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(item => {
        const atrasado = retornoAtrasado(item);
        const dias = diasDesde(item.fora_desde);
        const foto = fotoDoItem(item);

        return `
            <tr class="${atrasado ? 'linha-atrasada' : ''}">
                <td>${foto
                    ? `<img src="${escaparHTML(foto)}" alt="" class="foto-tabela" loading="lazy" onclick="abrirModalFoto('${escaparHTML(foto)}')">`
                    : '<div class="sem-foto"><i class="fa-solid fa-image"></i></div>'}</td>
                <td><strong>${escaparHTML(item.nome)}</strong>
                    ${item.status !== 'Ativo' ? `<small class="celula-sub">${escaparHTML(item.status)}</small>` : ''}</td>
                <td class="num"><strong>${numero.format(quantidadeItem(item))}</strong></td>
                <td>${escaparHTML(localCompleto(item.local_id, item.subsetor_id))}</td>
                <td><span class="destino-origem"><i class="fa-solid fa-house"></i>
                    ${escaparHTML(localCompleto(item.origem_local_id, item.origem_subsetor_id))}</span></td>
                <td>${item.fora_desde
                    ? `${dataCurta(item.fora_desde)}<small class="celula-sub">${dias === 0 ? 'hoje' : `há ${dias} dia(s)`}</small>`
                    : '—'}</td>
                <td>${item.retorno_previsto
                    ? `<span class="status-badge ${atrasado ? 'baixado' : 'neutro'}">${atrasado ? 'Atrasado · ' : ''}${dataCurta(item.retorno_previsto)}</span>`
                    : '<span class="texto-suave">Sem prazo</span>'}</td>
                <td>${movimentar ? `
                    <div class="acoes-tabela">
                        <button type="button" class="btn-primary btn-small" onclick="devolverPeca(${Number(item.id)})">
                            <i class="fa-solid fa-rotate-left"></i> Devolver
                        </button>
                        <button type="button" class="btn-icon" title="Movimentar para outro lugar" onclick="movimentarPeca(${Number(item.id)})">
                            <i class="fa-solid fa-right-left"></i>
                        </button>
                    </div>` : ''}</td>
            </tr>`;
    }).join('');
}


/* =========================================================
   AÇÕES: DEVOLVER E MOVIMENTAR
========================================================= */

function devolverPeca(id) {
    if (!podeMovimentar()) return avisar('Seu perfil não pode movimentar peças.', 'erro');
    const item = itens.find(registro => Number(registro.id) === Number(id));
    if (!item) return avisar('Peça não encontrada. Atualize a página.', 'erro');

    const quantidade = quantidadeItem(item);

    abrirFormulario({
        titulo: `Devolver ${item.nome}`,
        subtitulo: `De ${localCompleto(item.local_id, item.subsetor_id)} para ${localCompleto(item.origem_local_id, item.origem_subsetor_id)}`,
        textoSalvar: 'Confirmar devolução',
        campos: [
            { id: 'quantidade', rotulo: 'Quantidade que voltou', tipo: 'number', min: 1, step: '1', valor: quantidade,
              obrigatorio: true, ajuda: `Há ${quantidade} peça(s) fora. Informe menos se só uma parte voltou.` },
            { id: 'observacao', rotulo: 'Observação', tipo: 'textarea', largo: true, placeholder: 'Ex.: voltou do evento de sábado' }
        ],
        aoSalvar: async ({ quantidade: qtd, observacao }) => {
            if (!(qtd >= 1) || qtd > quantidade) throw new Error(`Informe uma quantidade entre 1 e ${quantidade}.`);
            const { error } = await supabaseClient.rpc('devolver_item', {
                p_item_id: Number(item.id),
                p_quantidade: Math.round(qtd),
                p_observacao: observacao || null
            });
            if (error) throw error;
            await carregarDashboard();
            await carregarHistorico();
            avisar(`${qtd} peça(s) devolvida(s) a ${nomeLocal(item.origem_local_id)}.`);
        }
    });
}

function movimentarPeca(id) {
    if (!podeMovimentar()) return avisar('Seu perfil não pode movimentar peças.', 'erro');
    abrirTela('movimentacaoTela', document.getElementById('menuMovimentacao'));
    const select = document.getElementById('itemMov');
    if (select) select.value = String(id);
    preencherOrigemAutomaticamente();
    document.getElementById('destino')?.focus();
}


/* =========================================================
   MOVIMENTAÇÃO — temporária × definitiva
========================================================= */

function carregarItensMovimentacao() {
    const select = document.getElementById('itemMov');
    if (!select) return;

    const valorAtual = select.value;

    const opcoes = itens
        .filter(item => item.status !== 'Baixado' && quantidadeItem(item) > 0)
        .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR', { sensitivity: 'base' }) ||
                        nomeLocal(a.local_id).localeCompare(nomeLocal(b.local_id), 'pt-BR'))
        .map(item => {
            const texto = [
                item.nome,
                localCompleto(item.local_id, item.subsetor_id),
                `${quantidadeItem(item)} peça(s)`,
                item.status !== 'Ativo' ? item.status : '',
                estaForaDoLugar(item) ? `fora do lugar (é de ${nomeLocal(item.origem_local_id)})` : ''
            ].filter(Boolean).join(' — ');
            return `<option value="${Number(item.id)}">${escaparHTML(texto)}</option>`;
        });

    select.innerHTML = '<option value="">Selecione a peça</option>' + opcoes.join('');
    if (valorAtual && [...select.options].some(opcao => opcao.value === valorAtual)) select.value = valorAtual;
}

function atualizarAjudaMovimentacao() {
    const item = itens.find(registro => String(registro.id) === document.getElementById('itemMov')?.value);
    const tipo = document.querySelector('input[name="tipoMovimentacao"]:checked')?.value || 'temporaria';
    const destino = document.getElementById('destino')?.value || '';
    const destinoSetor = document.getElementById('destinoSubsetor')?.value || '';
    const info = document.getElementById('infoOrigemFixa');
    const grupoRetorno = document.getElementById('grupoRetornoPrevisto');

    if (grupoRetorno) grupoRetorno.style.display = tipo === 'temporaria' ? '' : 'none';

    if (!info) return;
    if (!item || !temOrigem(item)) { info.innerHTML = ''; return; }

    const casa = localCompleto(item.origem_local_id, item.origem_subsetor_id);
    const voltaParaCasa = destino && String(destino) === String(item.origem_local_id) &&
                          String(destinoSetor) === String(item.origem_subsetor_id || '');

    let texto = `<i class="fa-solid fa-house"></i> Local fixo desta peça: <strong>${escaparHTML(casa)}</strong>.`;
    if (voltaParaCasa) texto += ' <b class="ok">Isto é uma devolução ao local de origem.</b>';
    else if (destino && tipo === 'temporaria') texto += ' Ela continuará sendo de lá e aparecerá em "Fora do lugar".';
    else if (destino && tipo === 'definitiva') texto += ' O destino passará a ser o novo local fixo.';

    info.innerHTML = texto;
}

function preencherOrigemAutomaticamente() {
    const item = itens.find(registro => String(registro.id) === String(document.getElementById('itemMov')?.value));
    const origem = document.getElementById('origemNome');
    const quantidade = document.getElementById('quantidadeMov');

    if (origem) origem.value = item ? localCompleto(item.local_id, item.subsetor_id) : '';

    if (item && quantidade) {
        const disponivel = quantidadeItem(item);
        quantidade.max = disponivel;
        if (Number(quantidade.value) > disponivel || !quantidade.value) quantidade.value = disponivel;
        const ajuda = document.getElementById('ajudaQuantidadeMov');
        if (ajuda) ajuda.textContent = `${disponivel} peça(s) disponível(is) neste local.`;
    }

    atualizarAjudaMovimentacao();
}

(function () {
    const limparOriginal = limparFormularioMovimentacao;
    limparFormularioMovimentacao = function () {
        limparOriginal();
        const temporaria = document.querySelector('input[name="tipoMovimentacao"][value="temporaria"]');
        if (temporaria) temporaria.checked = true;
        const retorno = document.getElementById('retornoPrevisto');
        if (retorno) retorno.value = '';
        const ajuda = document.getElementById('ajudaQuantidadeMov');
        if (ajuda) ajuda.textContent = '';
        atualizarAjudaMovimentacao();
    };
})();


/* =========================================================
   INVENTÁRIO (tabela completa) — mostra o local fixo
========================================================= */

function renderizarItens() {
    const tbody = document.getElementById('listaItens');
    if (!tbody) return;

    if (!itens.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Nenhuma peça cadastrada.</td></tr>';
        return;
    }

    const gestao = podeAdministrar();

    tbody.innerHTML = itens.map(item => {
        const foto = fotoDoItem(item);
        const fora = estaForaDoLugar(item);
        return `
            <tr data-subsetor-id="${item.subsetor_id ? Number(item.subsetor_id) : ''}" data-item-id="${Number(item.id)}">
                <td>${foto
                    ? `<img src="${escaparHTML(foto)}" alt="" class="foto-tabela" loading="lazy" onclick="abrirModalFoto('${escaparHTML(foto)}')">`
                    : '<div class="sem-foto"><i class="fa-solid fa-image"></i></div>'}</td>
                <td><strong>${escaparHTML(item.nome || '—')}</strong>
                    ${item.descricao ? `<small class="celula-sub">${escaparHTML(item.descricao)}</small>` : ''}</td>
                <td>${escaparHTML(item.tipo && item.tipo !== item.nome ? item.tipo : '—')}</td>
                <td class="num"><strong>${numero.format(quantidadeItem(item))}</strong></td>
                <td>${escaparHTML(nomeLocal(item.local_id))}</td>
                <td>${item.subsetor_id ? escaparHTML(nomeSubsetor(item.subsetor_id)) : '<span class="texto-suave">Local inteiro</span>'}</td>
                <td>${fora
                    ? `<span class="selo-fora ${retornoAtrasado(item) ? 'atrasado' : ''}"><i class="fa-solid fa-house"></i>
                       ${escaparHTML(localCompleto(item.origem_local_id, item.origem_subsetor_id))}</span>`
                    : '<span class="texto-suave">No lugar</span>'}</td>
                <td><span class="status-badge ${classeStatus(item.status)}">${escaparHTML(item.status || 'Ativo')}</span></td>
                <td>
                    <div class="acoes-tabela">
                        ${podeMovimentar() ? `<button type="button" class="btn-icon" title="Movimentar" onclick="movimentarPeca(${Number(item.id)})">
                            <i class="fa-solid fa-right-left"></i></button>` : ''}
                        ${gestao ? `<button type="button" class="btn-icon btn-editar" title="Editar peça no catálogo" onclick="editarItem(${Number(item.id)})">
                            <i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="btn-icon btn-excluir" title="Excluir" onclick="excluirItem(${Number(item.id)})">
                            <i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function exportarExcel() {
    const visiveis = new Set(
        [...document.querySelectorAll('#listaItens tr')]
            .filter(linha => linha.style.display !== 'none')
            .map(linha => linha.dataset.itemId)
    );
    const lista = itens.filter(item => visiveis.size === 0 || visiveis.has(String(item.id)));
    if (!lista.length) return avisar('Nenhuma peça para exportar.', 'info');

    const colunas = ['PEÇA', 'CATEGORIA', 'DESCRIÇÃO', 'QUANTIDADE', 'LOCAL', 'SETOR',
                     'LOCAL FIXO', 'SETOR FIXO', 'FORA DO LUGAR', 'RETORNO PREVISTO', 'STATUS'];
    const linhas = lista.map(item => [
        item.nome || '',
        item.tipo && item.tipo !== item.nome ? item.tipo : '',
        item.descricao || '',
        quantidadeItem(item),
        nomeLocal(item.local_id),
        item.subsetor_id ? nomeSubsetor(item.subsetor_id) : '',
        temOrigem(item) ? nomeLocal(item.origem_local_id) : '',
        item.origem_subsetor_id ? nomeSubsetor(item.origem_subsetor_id) : '',
        estaForaDoLugar(item) ? 'SIM' : 'NÃO',
        dataCurta(item.retorno_previsto),
        item.status || ''
    ].map(valor => `"${String(valor).replace(/"/g, '""')}"`).join(';'));

    const csv = '﻿' + [colunas.join(';'), ...linhas].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    Object.assign(document.createElement('a'), {
        href: url, download: `inventario-monte-carlo-${hojeISO()}.csv`
    }).click();
    URL.revokeObjectURL(url);
}


/* =========================================================
   LIGAÇÕES
========================================================= */

(function () {
    const carregarItensOriginal = carregarItens;
    carregarItens = async function () {
        await carregarItensOriginal();
        popularFiltroLocalOndeEsta();
        renderizarOndeEsta();
        renderizarForaDoLugar();
    };

    const atualizarLocaisOriginal = atualizarLocaisNaTela;
    atualizarLocaisNaTela = function () {
        atualizarLocaisOriginal();
        popularFiltroLocalOndeEsta();
    };

    const menusOriginal = atualizarMenus;
    atualizarMenus = function () {
        menusOriginal();
        ['menuOndeEsta', 'menuForaLugar'].forEach(id => {
            const menu = document.getElementById(id);
            if (menu) menu.style.display = usuarioLogado ? 'flex' : 'none';
        });
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    const busca = document.getElementById('buscaOndeEsta');
    busca?.addEventListener('input', () => {
        clearTimeout(temporizadorOndeEsta);
        temporizadorOndeEsta = setTimeout(renderizarOndeEsta, 150);
    });
    document.getElementById('filtroLocalOndeEsta')?.addEventListener('change', renderizarOndeEsta);
    document.getElementById('filtroSomenteFora')?.addEventListener('change', renderizarOndeEsta);

    document.getElementById('buscaForaLugar')?.addEventListener('input', renderizarForaDoLugar);
    document.getElementById('filtroOrigemFora')?.addEventListener('change', renderizarForaDoLugar);
    document.getElementById('filtroAtrasados')?.addEventListener('change', renderizarForaDoLugar);

    document.querySelectorAll('input[name="tipoMovimentacao"]').forEach(radio =>
        radio.addEventListener('change', atualizarAjudaMovimentacao));
    ['destino', 'destinoSubsetor'].forEach(id =>
        document.getElementById(id)?.addEventListener('change', atualizarAjudaMovimentacao));

    const retorno = document.getElementById('retornoPrevisto');
    if (retorno) retorno.min = hojeISO();

    atualizarAjudaMovimentacao();
});

Object.assign(window, {
    abrirOndeEsta, renderizarOndeEsta, abrirForaDoLugar, renderizarForaDoLugar,
    devolverPeca, movimentarPeca, preencherOrigemAutomaticamente, exportarExcel
});


/* ######################## V6 — CADASTRO COM DISTRIBUIÇÃO (manter no final) ######################## */

/* =========================================================
   V6 — CADASTRO DE PEÇA COM DISTRIBUIÇÃO POR LOCAL / SETOR
   Requer migration_inventario_v5.sql.
   (Mantenha este bloco no FINAL do app.js.)

   Ex.: Cadeira Dealer Marrom — 100
        MONTE CARLO / Quarto Andar ...... 25
        MONTE CARLO / Terceiro Andar .... 35
        MONTE CARLO / Segundo Andar ..... 20
        MIRAGE / Vip .................... 10
        CD1 / Estoque ................... 10
========================================================= */

const NOVO_SETOR = '__novo__';
let contadorLinhasDistribuicao = 0;


/* =========================================================
   LINHAS
========================================================= */

function opcoesLocaisDistribuicao(selecionado = '') {
    return '<option value="">Selecione o local</option>' + LOCAIS
        .map(local => `<option value="${local.id}" ${String(local.id) === String(selecionado) ? 'selected' : ''}>${escaparHTML(local.nome)}</option>`)
        .join('');
}

function opcoesSetoresDistribuicao(localId, selecionado = '') {
    if (!localId) return '<option value="">Escolha o local primeiro</option>';

    const setores = subsetores
        .filter(setor => String(setor.local_id) === String(localId) && setor.ativo !== false)
        .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR', { sensitivity: 'base' }));

    return '<option value="">Local inteiro (sem setor definido)</option>' +
        setores.map(setor =>
            `<option value="${setor.id}" ${String(setor.id) === String(selecionado) ? 'selected' : ''}>${escaparHTML(setor.nome)}</option>`
        ).join('') +
        (podeAdministrar() ? `<option value="${NOVO_SETOR}">＋ Criar setor neste local…</option>` : '');
}

function adicionarLinhaDistribuicao(dados = {}) {
    const area = document.getElementById('linhasDistribuicao');
    if (!area) return;

    const id = ++contadorLinhasDistribuicao;
    const linha = document.createElement('div');
    linha.className = 'dist-linha';
    linha.dataset.linha = id;
    linha.innerHTML = `
        <select class="dist-local" aria-label="Local">${opcoesLocaisDistribuicao(dados.local_id)}</select>
        <select class="dist-setor" aria-label="Setor">${opcoesSetoresDistribuicao(dados.local_id, dados.subsetor_id)}</select>
        <input class="dist-qtd" type="number" min="1" step="1" inputmode="numeric" placeholder="Qtde" aria-label="Quantidade"
               value="${dados.quantidade ? Number(dados.quantidade) : ''}">
        <button type="button" class="btn-icon btn-excluir dist-remover" title="Remover linha" aria-label="Remover linha">
            <i class="fa-solid fa-xmark"></i>
        </button>`;
    area.appendChild(linha);

    const local = linha.querySelector('.dist-local');
    const setor = linha.querySelector('.dist-setor');

    local.addEventListener('change', () => {
        setor.innerHTML = opcoesSetoresDistribuicao(local.value);
        recalcularDistribuicao();
    });
    setor.addEventListener('change', () => {
        if (setor.value === NOVO_SETOR) criarSetorNaLinha(linha);
        else recalcularDistribuicao();
    });
    linha.querySelector('.dist-qtd').addEventListener('input', recalcularDistribuicao);
    linha.querySelector('.dist-remover').addEventListener('click', () => {
        linha.remove();
        if (!area.children.length) adicionarLinhaDistribuicao();
        recalcularDistribuicao();
    });

    recalcularDistribuicao();
    if (!dados.local_id) local.focus({ preventScroll: true });
}

function lerDistribuicao() {
    return [...document.querySelectorAll('#linhasDistribuicao .dist-linha')].map(linha => ({
        elemento: linha,
        local_id: linha.querySelector('.dist-local').value,
        subsetor_id: linha.querySelector('.dist-setor').value === NOVO_SETOR ? '' : linha.querySelector('.dist-setor').value,
        quantidade: parseInt(linha.querySelector('.dist-qtd').value || '0', 10)
    }));
}

function recalcularDistribuicao() {
    const linhas = lerDistribuicao();
    const total = linhas.reduce((soma, linha) => soma + (linha.quantidade > 0 ? linha.quantidade : 0), 0);
    const esperado = parseInt(document.getElementById('totalEsperado')?.value || '0', 10);
    const status = document.getElementById('statusDistribuicao');

    definirTexto('totalDistribuido', numero.format(total));

    // Marca linhas repetidas (mesmo local + setor).
    const vistos = new Map();
    linhas.forEach(linha => {
        linha.elemento.classList.remove('repetida');
        if (!linha.local_id) return;
        const chave = `${linha.local_id}|${linha.subsetor_id}`;
        if (vistos.has(chave)) {
            linha.elemento.classList.add('repetida');
            vistos.get(chave).classList.add('repetida');
        } else {
            vistos.set(chave, linha.elemento);
        }
    });

    if (!status) return;
    status.className = 'dist-status';

    if (!esperado) {
        status.textContent = linhas.filter(l => l.local_id && l.quantidade > 0).length > 1
            ? `em ${linhas.filter(l => l.local_id && l.quantidade > 0).length} locais/setores` : '';
        return;
    }
    if (total === esperado) {
        status.classList.add('ok');
        status.innerHTML = '<i class="fa-solid fa-circle-check"></i> Fecha com o total';
    } else if (total < esperado) {
        status.classList.add('falta');
        status.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Faltam ${numero.format(esperado - total)} para distribuir`;
    } else {
        status.classList.add('sobra');
        status.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Passou ${numero.format(total - esperado)} do total`;
    }
}

function limparDistribuicao() {
    const area = document.getElementById('linhasDistribuicao');
    if (area) area.innerHTML = '';
    const esperado = document.getElementById('totalEsperado');
    if (esperado) esperado.value = '';
    adicionarLinhaDistribuicao();
    mostrarDistribuicaoAtual();
}

function criarSetorNaLinha(linha) {
    const local = linha.querySelector('.dist-local');
    const setor = linha.querySelector('.dist-setor');
    setor.value = '';

    if (!local.value) return avisar('Escolha o local antes de criar o setor.', 'info');

    abrirFormulario({
        titulo: 'Novo setor',
        subtitulo: `No local ${nomeLocal(local.value)}`,
        textoSalvar: 'Criar setor',
        campos: [{ id: 'nome', rotulo: 'Nome do setor', obrigatorio: true, placeholder: 'Ex.: Quarto Andar, Vip, Estoque', largo: true }],
        aoSalvar: async ({ nome }) => {
            const existente = subsetores.find(s =>
                String(s.local_id) === String(local.value) && normalizarTexto(s.nome) === normalizarTexto(nome));
            if (existente) {
                setor.innerHTML = opcoesSetoresDistribuicao(local.value, existente.id);
                recalcularDistribuicao();
                avisar(`O setor "${existente.nome}" já existia e foi selecionado.`, 'info');
                return;
            }

            const { data, error } = await supabaseClient
                .from('subsetores')
                .insert([{ local_id: Number(local.value), nome, ativo: true, created_by: usuarioLogado?.id }])
                .select('id');
            if (error) throw error;

            await carregarSubsetores();
            const novoId = data?.[0]?.id || subsetores.find(s =>
                String(s.local_id) === String(local.value) && normalizarTexto(s.nome) === normalizarTexto(nome))?.id;

            document.querySelectorAll('#linhasDistribuicao .dist-linha').forEach(outra => {
                const outroLocal = outra.querySelector('.dist-local').value;
                const outroSetor = outra.querySelector('.dist-setor');
                if (outroLocal === local.value) {
                    outroSetor.innerHTML = opcoesSetoresDistribuicao(outroLocal, outra === linha ? novoId : outroSetor.value);
                }
            });
            recalcularDistribuicao();
            avisar(`Setor "${nome}" criado em ${nomeLocal(local.value)}.`);
        }
    });
}


/* =========================================================
   PEÇA JÁ EXISTENTE: mostra onde ela está hoje
========================================================= */

function mostrarDistribuicaoAtual() {
    const caixa = document.getElementById('distribuicaoAtual');
    if (!caixa) return;

    const produto = produtoPorNome(document.getElementById('nome')?.value);
    const grupos = produto
        ? itens.filter(item => Number(item.produto_id) === Number(produto.id) && quantidadeItem(item) > 0)
        : [];

    if (!grupos.length) {
        caixa.hidden = true;
        caixa.innerHTML = '';
        return;
    }

    const total = grupos.reduce((soma, item) => soma + quantidadeItem(item), 0);
    caixa.hidden = false;
    caixa.innerHTML = `
        <div class="dist-atual-topo">
            <i class="fa-solid fa-circle-info"></i>
            <div>
                <strong>"${escaparHTML(produto.nome)}" já tem ${numero.format(total)} peça(s) cadastrada(s).</strong>
                <span>As quantidades abaixo serão <b>somadas</b> a estas. Para corrigir uma contagem, use Movimentações.</span>
            </div>
        </div>
        <ul>${grupos
            .sort((a, b) => quantidadeItem(b) - quantidadeItem(a))
            .map(item => `<li><span>${escaparHTML(localCompleto(item.local_id, item.subsetor_id))}
                ${estaForaDoLugar(item) ? '<em>fora do lugar</em>' : ''}</span>
                <strong>${numero.format(quantidadeItem(item))}</strong></li>`).join('')}</ul>`;
}


/* =========================================================
   SALVAR
========================================================= */

async function salvarItem(event) {
    event?.preventDefault();
    event?.stopPropagation();

    if (!usuarioLogado) return avisar('Faça login primeiro.', 'erro'), false;
    if (perfilUsuario === 'consulta') return avisar('Seu perfil não pode cadastrar peças.', 'erro'), false;

    const valor = id => document.getElementById(id)?.value?.trim() || '';
    const nome = valor('nome');

    if (!nome) {
        document.getElementById('nome')?.focus();
        return avisar('Informe o nome da peça.', 'erro'), false;
    }

    const linhas = lerDistribuicao().filter(linha => linha.local_id || linha.quantidade);

    if (!linhas.length) return avisar('Informe pelo menos um local com quantidade.', 'erro'), false;

    const semLocal = linhas.find(linha => !linha.local_id);
    if (semLocal) {
        semLocal.elemento.querySelector('.dist-local').focus();
        return avisar('Há uma linha com quantidade mas sem local.', 'erro'), false;
    }

    const semQuantidade = linhas.find(linha => !(linha.quantidade >= 1));
    if (semQuantidade) {
        semQuantidade.elemento.querySelector('.dist-qtd').focus();
        return avisar(`Informe a quantidade em ${nomeLocal(semQuantidade.local_id)}.`, 'erro'), false;
    }

    if (document.querySelector('#linhasDistribuicao .dist-linha.repetida')) {
        return avisar('Há local/setor repetido. Junte as quantidades numa linha só.', 'erro'), false;
    }

    const total = linhas.reduce((soma, linha) => soma + linha.quantidade, 0);
    const esperado = parseInt(valor('totalEsperado') || '0', 10);
    if (esperado && esperado !== total &&
        !confirm(`O total informado é ${esperado}, mas a distribuição soma ${total}.\n\nSalvar mesmo assim com ${total} peça(s)?`)) {
        return false;
    }

    const botao = document.getElementById('btnSalvarItem');
    const textoBotao = botao?.innerHTML;
    if (botao) {
        botao.disabled = true;
        botao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    }

    let foto = null;

    try {
        const arquivo = document.getElementById('foto')?.files?.[0];
        if (arquivo) foto = await enviarFoto(arquivo, 'inventario');

        const { data, error } = await supabaseClient.rpc('registrar_pecas', {
            p_nome: nome,
            p_distribuicao: linhas.map(linha => ({
                local_id: Number(linha.local_id),
                subsetor_id: linha.subsetor_id ? Number(linha.subsetor_id) : null,
                quantidade: linha.quantidade
            })),
            p_categoria: valor('tipoItem') || null,
            p_descricao: valor('descricao') || null,
            p_foto_url: foto?.url || null,
            p_status: valor('status') || 'Ativo'
        });

        if (error) throw error;

        avisar(`${numero.format(data?.total ?? total)} peça(s) de "${nome}" cadastrada(s) em ${data?.linhas ?? linhas.length} local(is)/setor(es).`);

        limparFormularioCadastro();
        await carregarDashboard();
    } catch (erro) {
        console.error('ERRO AO CADASTRAR PEÇAS:', erro);
        if (foto) await supabaseClient.storage.from('inventario').remove([foto.caminho]);

        const mensagem = /registrar_pecas/.test(erro?.message || '') && /not find|does not exist/i.test(erro?.message || '')
            ? 'A migração v5 ainda não foi executada no Supabase.'
            : traduzirErro(erro);
        avisar('Não foi possível cadastrar: ' + mensagem, 'erro');
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.innerHTML = textoBotao;
        }
    }

    return false;
}

function limparFormularioCadastro() {
    ['nome', 'tipoItem', 'descricao'].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = '';
    });
    const status = document.getElementById('status');
    if (status) status.value = 'Ativo';
    const foto = document.getElementById('foto');
    if (foto) foto.value = '';
    limparDistribuicao();
}


/* =========================================================
   LIGAÇÕES
========================================================= */

(function () {
    // Setores/locais mudaram: atualiza as linhas sem perder o que foi digitado.
    const subsetoresOriginal = carregarSubsetores;
    carregarSubsetores = async function () {
        await subsetoresOriginal();
        document.querySelectorAll('#linhasDistribuicao .dist-linha').forEach(linha => {
            const local = linha.querySelector('.dist-local');
            const setor = linha.querySelector('.dist-setor');
            const atualLocal = local.value;
            const atualSetor = setor.value;
            local.innerHTML = opcoesLocaisDistribuicao(atualLocal);
            setor.innerHTML = opcoesSetoresDistribuicao(atualLocal, atualSetor);
        });
    };

    const carregarItensOriginal = carregarItens;
    carregarItens = async function () {
        await carregarItensOriginal();
        mostrarDistribuicaoAtual();
    };

    const dicaOriginal = atualizarDicaProduto;
    atualizarDicaProduto = function () {
        dicaOriginal();
        mostrarDistribuicaoAtual();
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('totalEsperado')?.addEventListener('input', recalcularDistribuicao);
    if (!document.querySelector('#linhasDistribuicao .dist-linha')) adicionarLinhaDistribuicao();
});

Object.assign(window, {
    adicionarLinhaDistribuicao, salvarItem, limparFormularioCadastro, limparFormulario: limparFormularioCadastro
});
