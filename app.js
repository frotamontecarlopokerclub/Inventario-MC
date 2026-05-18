/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
'https://sxmimxomehdhyifqsgqa.supabase.co';

const SUPABASE_KEY =
'sb_publishable_NbyYYTsRnSqu_TMpQvzS6A_rJuyzq9_';

/* =========================
   CLIENTE SUPABASE
========================= */

const supabaseClient =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

/* =========================
   VARIÁVEIS GLOBAIS
========================= */

let itens = [];
let movimentacoes = [];
let usuarioLogado = null;

/* =========================
   LOCAIS FIXOS
========================= */

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

/* =========================
   LOGIN
========================= */

async function login(){

    const email =
    document.getElementById('email').value;

    const password =
    document.getElementById('password').value;

    try{

        const { data, error } =
        await supabaseClient.auth
        .signInWithPassword({

            email,
            password

        });

        if(error){

            console.log(error);

            alert('Login inválido');

            return;
        }

        usuarioLogado = data.user;

        alert(
            'Login realizado com sucesso!'
        );

        liberarMenus();

        await verificarPerfil();

        abrirTela(
            'dashboardTela',
            document.querySelector(
                '[onclick*="dashboardTela"]'
            )
        );

        await carregarDashboard();

    }catch(err){

        console.log(err);

        alert(
            'Erro ao realizar login'
        );
    }
}

/* =========================
   LOGOUT
========================= */

async function logout(){

    await supabaseClient.auth.signOut();

    usuarioLogado = null;

    ocultarMenus();

    abrirTela(
        'loginTela',
        document.querySelector(
            '[onclick*="loginTela"]'
        )
    );

    alert('Logout realizado!');
}

/* =========================
   PERFIL
========================= */

async function verificarPerfil(){

    if(!usuarioLogado) return;

    try{

        const { data, error } =
        await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('id', usuarioLogado.id)
        .single();

        if(error){

            console.log(error);

            return;
        }

        console.log(
            'PERFIL USUÁRIO:',
            data?.perfil
        );

        /* RESETA MENUS */

        liberarMenus();

        /* SE FOR CONSULTA */

        if(
            data?.perfil &&
            data.perfil.toLowerCase() === 'consulta'
        ){

            bloquearModoConsulta();
        }

    }catch(err){

        console.log(err);
    }
}
/* =========================
   LIBERAR MENUS
========================= */

function liberarMenus(){

    const menus =
    document.querySelectorAll(
        '.menu-item'
    );

    menus.forEach(menu => {

        menu.style.display = 'flex';
    });

    const loginMenu =
    document.querySelector(
        '[onclick*="loginTela"]'
    );

    if(loginMenu){

        loginMenu.style.display = 'none';
    }
}

/* =========================
   OCULTAR MENUS
========================= */

function ocultarMenus(){

    const menusBloquear = [

        'cadastroTela',
        'movimentacaoTela',
        'estoqueTela',
        'historicoTela',
        'dashboardTela'

    ];

    menusBloquear.forEach(id => {

        const menu =
        document.querySelector(
            `[onclick*="${id}"]`
        );

        if(menu){

            menu.style.display = 'none';
        }
    });

    const loginMenu =
    document.querySelector(
        '[onclick*="loginTela"]'
    );

    if(loginMenu){

        loginMenu.style.display = 'flex';
    }
}

/* =========================
   BLOQUEAR CONSULTA
========================= */

function bloquearModoConsulta(){

    const cadastroMenu =
    document.querySelector(
        '[onclick*="cadastroTela"]'
    );

    const movimentacaoMenu =
    document.querySelector(
        '[onclick*="movimentacaoTela"]'
    );

    if(cadastroMenu){

        cadastroMenu.style.display =
        'none';
    }

    if(movimentacaoMenu){

        movimentacaoMenu.style.display =
        'none';
    }

    const botoes =
    document.querySelectorAll(
        '.btn-delete, .btn-edit'
    );

    botoes.forEach(btn => {

        btn.style.display =
        'none';
    });
}

/* =========================
   LIBERAR MENUS
========================= */

function liberarMenus(){

    const cadastroMenu =
    document.querySelector(
        '[onclick*="cadastroTela"]'
    );

    const movimentacaoMenu =
    document.querySelector(
        '[onclick*="movimentacaoTela"]'
    );

    if(cadastroMenu){

        cadastroMenu.style.display =
        'flex';
    }

    if(movimentacaoMenu){

        movimentacaoMenu.style.display =
        'flex';
    }

    const botoes =
    document.querySelectorAll(
        '.btn-delete, .btn-edit'
    );

    botoes.forEach(btn => {

        btn.style.display =
        'inline-block';
    });
}

/* =========================
   CARREGAR LOCAIS
========================= */

function carregarLocais(){

    const local =
    document.getElementById('local');

    const destino =
    document.getElementById('destino');

    if(!local || !destino) return;

    local.innerHTML =
    '<option value="">Selecione o Local</option>';

    destino.innerHTML =
    '<option value="">Selecione o Destino</option>';

    LOCAIS.forEach(item => {

        local.innerHTML += `

<option value="${item.id}">
${item.nome}
</option>

`;

        destino.innerHTML += `

<option value="${item.id}">
${item.nome}
</option>

`;
    });

    const totalLocais =
    document.getElementById(
        'totalLocais'
    );

    if(totalLocais){

        totalLocais.innerText =
        LOCAIS.length;
    }
}

/* =========================
   GERAR PATRIMÔNIO
========================= */

function gerarNumeroPatrimonio(){

    if(itens.length === 0){

        return '0001';
    }

    const numeros =
    itens.map(item => {

        return parseInt(
            item.patrimonio
        ) || 0;
    });

    const maiorNumero =
    Math.max(...numeros);

    const proximo =
    maiorNumero + 1;

    return String(proximo)
    .padStart(4,'0');
}

/* =========================
   SALVAR ITEM
========================= */

async function salvarItem(){

    try{

        const patrimonio =
        gerarNumeroPatrimonio();

        const nome =
        document.getElementById(
            'nome'
        ).value.trim();

        const descricao =
        document.getElementById(
            'descricao'
        ).value.trim();

        const local_id =
        document.getElementById(
            'local'
        ).value;

        const status =
        document.getElementById(
            'status'
        ).value;

        if(!nome){

            alert('Informe o nome');

            return;
        }

        if(!local_id){

            alert(
                'Selecione o local'
            );

            return;
        }

        const item = {

            patrimonio,
            nome,
            descricao,
            local_id:Number(local_id),
            status,
            foto_url:''

        };

        const { error } =
        await supabaseClient
        .from('itens')
        .insert([item]);

        if(error){

            console.log(error);

            alert(
                'Erro ao salvar patrimônio'
            );

            return;
        }

        alert(
            `Patrimônio ${patrimonio} cadastrado!`
        );

        limparFormulario();

        await carregarDashboard();

    }catch(err){

        console.log(err);

        alert('Erro inesperado');
    }
}

/* =========================
   LIMPAR FORMULÁRIO
========================= */

function limparFormulario(){

    document.getElementById(
        'nome'
    ).value = '';

    document.getElementById(
        'descricao'
    ).value = '';

    document.getElementById(
        'foto'
    ).value = '';

    document.getElementById(
        'local'
    ).value = '';

    document.getElementById(
        'status'
    ).value = 'Ativo';
}

/* =========================
   CARREGAR ITENS
========================= */

async function carregarItens(){

    try{

        const { data, error } =
        await supabaseClient
        .from('itens')
        .select('*')
        .order('id', {

            ascending:false

        });

        if(error){

            console.log(error);

            return;
        }

        itens = data || [];

        const tabela =
        document.getElementById(
            'listaItens'
        );

        const itemMov =
        document.getElementById(
            'itemMov'
        );

        if(!tabela || !itemMov) return;

        tabela.innerHTML = '';

        itemMov.innerHTML = `

<option value="">
Selecione o Patrimônio
</option>

`;

        itens.forEach(item => {

            const local =
            LOCAIS.find(
                l =>
                l.id == item.local_id
            );

            let classeStatus = '';

            if(item.status === 'Ativo'){

                classeStatus = 'ativo';
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

            tabela.innerHTML += `

<tr>

<td>

<img
src="${
item.foto_url ||
'https://via.placeholder.com/60'
}"

style="
width:60px;
height:60px;
object-fit:cover;
border-radius:8px;
"
>

</td>

<td>
${item.patrimonio}
</td>

<td>
${item.nome}
</td>

<td>
${item.descricao || '-'}
</td>

<td>
${local?.nome || '-'}
</td>

<td>

<span class="status ${classeStatus}">
${item.status}
</span>

</td>

<td>

<div class="actions">

<button
class="btn-edit"
onclick="editarItem(${item.id})"
>

Editar

</button>

<button
class="btn-delete"
onclick="excluirItem(${item.id})"
>

Excluir

</button>

</div>

</td>

</tr>

`;

            itemMov.innerHTML += `

<option value="${item.id}">
${item.patrimonio} - ${item.nome}
</option>

`;
        });

        document.getElementById(
            'totalItens'
        ).innerText =
        itens.length;

        const baixados =
        itens.filter(
            item =>
            item.status === 'Baixado'
        );

        document.getElementById(
            'totalBaixados'
        ).innerText =
        baixados.length;

    }catch(err){

        console.log(err);
    }
}

/* =========================
   EDITAR ITEM
========================= */

async function editarItem(id){

    const item =
    itens.find(
        i => i.id == id
    );

    if(!item) return;

    const novoNome =
    prompt(
        'Novo nome:',
        item.nome
    );

    if(!novoNome) return;

    const { error } =
    await supabaseClient
    .from('itens')
    .update({

        nome:novoNome

    })
    .eq('id', id);

    if(error){

        console.log(error);

        alert('Erro ao editar');

        return;
    }

    await carregarDashboard();
}

/* =========================
   EXCLUIR ITEM
========================= */

async function excluirItem(id){

    const confirmar =
    confirm(
        'Deseja excluir este patrimônio?'
    );

    if(!confirmar) return;

    const { error } =
    await supabaseClient
    .from('itens')
    .delete()
    .eq('id', id);

    if(error){

        console.log(error);

        alert('Erro ao excluir');

        return;
    }

    await carregarDashboard();
}

/* =========================
   PREENCHER ORIGEM
========================= */

function preencherOrigemAutomaticamente(){

    const item_id =
    document.getElementById(
        'itemMov'
    ).value;

    const item =
    itens.find(
        i => i.id == item_id
    );

    if(!item){

        document.getElementById(
            'origemNome'
        ).value = '';

        return;
    }

    const local =
    LOCAIS.find(
        l => l.id == item.local_id
    );

    document.getElementById(
        'origemNome'
    ).value =
    local?.nome || '';
}

/* =========================
   MOVIMENTAR ITEM
========================= */

async function movimentarItem(){

    try{

        const item_id =
        document.getElementById(
            'itemMov'
        ).value;

        const destino_id =
        document.getElementById(
            'destino'
        ).value;

        const statusMov =
        document.getElementById(
            'statusMov'
        ).value;

        const observacao =
        document.getElementById(
            'observacaoMov'
        ).value;

        if(!item_id){

            alert(
                'Selecione o patrimônio'
            );

            return;
        }

        if(!destino_id){

            alert(
                'Selecione o destino'
            );

            return;
        }

        const item =
        itens.find(
            i => i.id == item_id
        );

        if(!item){

            alert(
                'Item não encontrado'
            );

            return;
        }

        const origem_id =
        item.local_id;

        const updateData = {

            local_id:Number(destino_id)

        };

        if(statusMov){

            updateData.status =
            statusMov;
        }

        const {
            error:updateError
        } =
        await supabaseClient
        .from('itens')
        .update(updateData)
        .eq('id', item_id);

        if(updateError){

            console.log(updateError);

            alert(
                'Erro ao movimentar'
            );

            return;
        }

        const {
            error:movError
        } =
        await supabaseClient
        .from('movimentacoes')
        .insert([{

            item_id,
            origem_id,
            destino_id,
            observacao,

            usuario:
            usuarioLogado?.email
            || 'Sistema'

        }]);

        if(movError){

            console.log(movError);
        }

        alert(
            'Patrimônio movimentado!'
        );

        document.getElementById(
            'observacaoMov'
        ).value = '';

        document.getElementById(
            'origemNome'
        ).value = '';

        document.getElementById(
            'itemMov'
        ).value = '';

        document.getElementById(
            'destino'
        ).value = '';

        document.getElementById(
            'statusMov'
        ).value = '';

        await carregarDashboard();

    }catch(err){

        console.log(err);

        alert('Erro inesperado');
    }
}

/* =========================
   HISTÓRICO
========================= */

async function carregarHistorico(){

    try{

        const { data, error } =
        await supabaseClient
        .from('movimentacoes')
        .select('*')
        .order('data', {

            ascending:false

        });

        if(error){

            console.log(error);

            return;
        }

        movimentacoes = data || [];

        const tabela =
        document.getElementById(
            'historico'
        );

        if(!tabela) return;

        tabela.innerHTML = '';

        movimentacoes.forEach(mov => {

            const item =
            itens.find(
                i => i.id == mov.item_id
            );

            const origem =
            LOCAIS.find(
                l => l.id == mov.origem_id
            );

            const destino =
            LOCAIS.find(
                l => l.id == mov.destino_id
            );

            tabela.innerHTML += `

<tr>

<td>
${item?.patrimonio || '-'}
</td>

<td>
${origem?.nome || '-'}
</td>

<td>
${destino?.nome || '-'}
</td>

<td>
${mov.observacao || '-'}
</td>

<td>
${new Date(mov.data)
.toLocaleString()}
</td>

</tr>

`;
        });

        document.getElementById(
            'totalMov'
        ).innerText =
        movimentacoes.length;

    }catch(err){

        console.log(err);
    }
}

/* =========================
   FILTRAR
========================= */

function filtrarItens(){

    const termo =
    document.getElementById(
        'busca'
    )
    .value
    .toLowerCase();

    const linhas =
    document.querySelectorAll(
        '#listaItens tr'
    );

    linhas.forEach(linha => {

        const texto =
        linha.innerText
        .toLowerCase();

        linha.style.display =
        texto.includes(termo)
        ? ''
        : 'none';
    });
}

/* =========================
   DASHBOARD
========================= */

function atualizarDashboardAvancado(){

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

    if(dashAtivo){

        dashAtivo.innerText =
        itens.filter(
            item =>
            item.status === 'Ativo'
        ).length;
    }

    if(dashManutencao){

        dashManutencao.innerText =
        itens.filter(
            item =>
            item.status ===
            'Em manutenção'
        ).length;
    }

    if(dashBaixado){

        dashBaixado.innerText =
        itens.filter(
            item =>
            item.status ===
            'Baixado'
        ).length;
    }

    if(dashExtraviado){

        dashExtraviado.innerText =
        itens.filter(
            item =>
            item.status ===
            'Extraviado'
        ).length;
    }
}

/* =========================
   RELATÓRIO
========================= */

function gerarRelatorioLocais(){

    const tabela =
    document.getElementById(
        'dashboardLocais'
    );

    if(!tabela) return;

    tabela.innerHTML = '';

    const agrupado = {};

    itens.forEach(item => {

        const local =
        LOCAIS.find(
            l => l.id == item.local_id
        );

        const nomeLocal =
        local?.nome || 'SEM LOCAL';

        const chave =
        `${item.nome}||${nomeLocal}`;

        if(!agrupado[chave]){

            agrupado[chave] = {

                item:item.nome,
                local:nomeLocal,
                quantidade:0

            };
        }

        agrupado[chave]
        .quantidade++;
    });

    Object.values(agrupado)
    .forEach(registro => {

        tabela.innerHTML += `

<tr>

<td>
${registro.item}
</td>

<td>
${registro.local}
</td>

<td>
${registro.quantidade}
</td>

</tr>

`;
    });
}

/* =========================
   DASHBOARD
========================= */

async function carregarDashboard(){

    await carregarItens();

    await carregarHistorico();

    carregarLocais();

    atualizarDashboardAvancado();

    gerarRelatorioLocais();
}

/* =========================
   MENU
========================= */

function abrirTela(
    idTela,
    elemento
){

    if(
        !usuarioLogado &&
        idTela !== 'loginTela'
    ){

        alert(
            'Faça login primeiro!'
        );

        return;
    }

    const telas =
    document.querySelectorAll(
        '.tela'
    );

    telas.forEach(tela => {

        tela.classList.remove(
            'activeTela'
        );
    });

    const telaSelecionada =
    document.getElementById(idTela);

    if(telaSelecionada){

        telaSelecionada.classList.add(
            'activeTela'
        );
    }

    const menus =
    document.querySelectorAll(
        '.menu-item'
    );

    menus.forEach(menu => {

        menu.classList.remove(
            'active'
        );
    });

    if(elemento){

        elemento.classList.add(
            'active'
        );
    }
}

/* =========================
   EXPORTAR EXCEL
========================= */

function exportarExcel(){

    if(itens.length === 0){

        alert(
            'Nenhum patrimônio cadastrado!'
        );

        return;
    }

    let csv =
    'PATRIMÔNIO;NOME;DESCRIÇÃO;LOCAL;STATUS\n';

    itens.forEach(item => {

        const local =
        LOCAIS.find(
            l => l.id == item.local_id
        );

        csv +=
        `${item.patrimonio};`;

        csv +=
        `${item.nome};`;

        csv +=
        `${item.descricao || '-'};`;

        csv +=
        `${local?.nome || '-'};`;

        csv +=
        `${item.status}\n`;
    });

    const blob =
    new Blob(
        [csv],
        {

            type:
            'text/csv;charset=utf-8;'

        }
    );

    const link =
    document.createElement('a');

    const url =
    URL.createObjectURL(blob);

    link.href = url;

    link.download =
    'inventario.csv';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
}

/* =========================
   INIT
========================= */

window.onload = async () => {

    try{

        carregarLocais();

        ocultarMenus();

        const { data } =
        await supabaseClient.auth
        .getSession();

        if(data?.session){

            usuarioLogado =
            data.session.user;

            liberarMenus();

            await verificarPerfil();

            abrirTela(
                'dashboardTela',
                document.querySelector(
                    '[onclick*="dashboardTela"]'
                )
            );

            await carregarDashboard();

        }else{

            abrirTela(
                'loginTela',
                document.querySelector(
                    '[onclick*="loginTela"]'
                )
            );
        }

        console.log(
            'Sistema conectado ao Supabase!'
        );

    }catch(err){

        console.log(err);

        alert(
            'Erro ao iniciar sistema'
        );
    }
};
/* =========================
   LOGOUT
========================= */

async function logout(){

    try{

        await supabaseClient.auth.signOut();

        usuarioLogado = null;

        alert('Logout realizado!');

        /* REMOVE TELAS */

        document
        .querySelectorAll('.tela')
        .forEach(tela => {

            tela.classList.remove(
                'activeTela'
            );

        });

        /* VOLTA LOGIN */

        document
        .getElementById('loginTela')
        .classList.add('activeTela');

        /* REMOVE MENU ATIVO */

        document
        .querySelectorAll('.menu-item')
        .forEach(menu => {

            menu.classList.remove(
                'active'
            );

        });

        /* ATIVA LOGIN */

        const loginMenu =
        document.querySelector(
            '[onclick*="loginTela"]'
        );

        if(loginMenu){

            loginMenu.classList.add(
                'active'
            );
        }

    }catch(err){

        console.log(err);

        alert('Erro ao sair');
    }
}