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
let perfilUsuario = null;

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

        await verificarPerfil();

        atualizarMenus();

        abrirTela(
            'dashboardTela',
            document.querySelector(
                '[onclick*="dashboardTela"]'
            )
        );

        await carregarDashboard();

        alert('Login realizado com sucesso!');

    }catch(err){

        console.log(err);

        alert('Erro ao realizar login');
    }
}

/* =========================
   LOGOUT
========================= */

async function logout(){

    try{

        await supabaseClient.auth.signOut();

        usuarioLogado = null;
        perfilUsuario = null;

        atualizarMenus();

        abrirTela(
            'loginTela',
            document.querySelector(
                '[onclick*="loginTela"]'
            )
        );

        alert('Logout realizado!');

    }catch(err){

        console.log(err);

        alert('Erro ao sair');
    }
}


/* =========================
   PERFIL
========================= */

/* =========================
   PERFIL
========================= */

async function verificarPerfil(){

    if(!usuarioLogado) return;

    try{

        const email =
        usuarioLogado.email;

        console.log(
            'Verificando perfil do email:',
            email
        );

        const { data, error } =
        await supabaseClient
        .from('usuarios')
        .select('perfil')
        .eq('email', email)
        .single();

        if(error){

            console.log(
                'Erro ao buscar perfil:',
                error
            );

            perfilUsuario = 'consulta';

            return;
        }

        perfilUsuario =
        String(data?.perfil || '')
        .trim()
        .toLowerCase();

        console.log(
            'Perfil carregado:',
            perfilUsuario
        );

        atualizarMenus();

    }catch(err){

        console.log(err);

        perfilUsuario = 'consulta';
    }
}

/* =========================
   CONTROLE MENUS
========================= */

/* =========================
   CONTROLE MENUS
========================= */

function atualizarMenus(){

    const loginMenu =
    document.querySelector(
        '[onclick*="loginTela"]'
    );

    const dashboardMenu =
    document.querySelector(
        '[onclick*="dashboardTela"]'
    );

    const cadastroMenu =
    document.querySelector(
        '[onclick*="cadastroTela"]'
    );

    const movimentacaoMenu =
    document.querySelector(
        '[onclick*="movimentacaoTela"]'
    );

    const estoqueMenu =
    document.querySelector(
        '[onclick*="estoqueTela"]'
    );

    const historicoMenu =
    document.querySelector(
        '[onclick*="historicoTela"]'
    );

    const logoutMenu =
    document.querySelector(
        '[onclick="logout()"]'
    );

    /* =========================
       SEM LOGIN
    ========================= */

    if(!usuarioLogado){

        if(loginMenu)
        loginMenu.style.display = 'flex';

        if(logoutMenu)
        logoutMenu.style.display = 'none';

        if(dashboardMenu)
        dashboardMenu.style.display = 'none';

        if(cadastroMenu)
        cadastroMenu.style.display = 'none';

        if(movimentacaoMenu)
        movimentacaoMenu.style.display = 'none';

        if(estoqueMenu)
        estoqueMenu.style.display = 'none';

        if(historicoMenu)
        historicoMenu.style.display = 'none';

        return;
    }

    /* =========================
       LOGADO
    ========================= */

    if(loginMenu)
    loginMenu.style.display = 'none';

    if(logoutMenu)
    logoutMenu.style.display = 'flex';

    if(dashboardMenu)
    dashboardMenu.style.display = 'flex';

    if(estoqueMenu)
    estoqueMenu.style.display = 'flex';

    if(historicoMenu)
    historicoMenu.style.display = 'flex';

    /* =========================
       PERFIL CONSULTA
    ========================= */

    if(perfilUsuario === 'consulta'){

        if(cadastroMenu)
        cadastroMenu.style.display = 'none';

        if(movimentacaoMenu)
        movimentacaoMenu.style.display = 'none';

        console.log(
            'Modo CONSULTA ativado'
        );

    }else{

        /* =========================
           PERFIL GESTOR
        ========================= */

        if(cadastroMenu)
        cadastroMenu.style.display = 'flex';

        if(movimentacaoMenu)
        movimentacaoMenu.style.display = 'flex';

        console.log(
            'Modo GESTOR ativado'
        );
    }
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

/* =========================
   SALVAR ITEM
========================= */

async function salvarItem(){

    if(perfilUsuario === 'consulta'){

        alert(
            'Usuário sem permissão!'
        );

        return;
    }

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

        const fotoInput =
        document.getElementById(
            'foto'
        );

        const arquivo =
        fotoInput.files[0];

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

        let foto_url = '';

        /* =========================
           UPLOAD FOTO
        ========================= */

        if(arquivo){

            const extensao =
            arquivo.name.split('.').pop();

            const nomeArquivo =
            `${Date.now()}.${extensao}`;

            const {
                error:uploadError
            } =
            await supabaseClient
            .storage
            .from('inventario')
            .upload(
                nomeArquivo,
                arquivo
            );

            if(uploadError){

                console.log(uploadError);

                alert(
                    'Erro ao enviar imagem'
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
            urlData.publicUrl;
        }

        /* =========================
           SALVAR ITEM
        ========================= */

        const item = {

            patrimonio,
            nome,
            descricao,
            local_id:Number(local_id),
            status,
            foto_url

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
'https://placehold.co/60x60/png?text=IMG'
}"

onclick="
abrirModalFoto(
'${item.foto_url}'
)
"

style="
width:60px;
height:60px;
object-fit:cover;
border-radius:8px;
cursor:pointer;
border:2px solid #ddd;
transition:0.2s;
"
onmouseover="
this.style.transform='scale(1.08)'
"
onmouseout="
this.style.transform='scale(1)'
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

${
perfilUsuario !== 'consulta'
? `
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
`
: '-'
}

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

    if(perfilUsuario === 'consulta'){

        alert(
            'Usuário sem permissão!'
        );

        return;
    }

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

    if(perfilUsuario === 'consulta'){

        alert(
            'Usuário sem permissão!'
        );

        return;
    }

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

    if(perfilUsuario === 'consulta'){

        alert(
            'Usuário sem permissão!'
        );

        return;
    }

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

function filtrarDashboard(){

    const busca =
    document
    .getElementById("filtroDashboard")
    .value
    .toLowerCase();

    const localFiltro =
    document
    .getElementById("filtroLocalDashboard")
    .value
    .toLowerCase();

    const linhas =
    document
    .querySelectorAll("#dashboardLocais tr");

    linhas.forEach(linha => {

        const texto =
        linha.innerText.toLowerCase();

        const local =
        linha.children[1]
        ?.innerText
        .toLowerCase();

        const matchBusca =
        texto.includes(busca);

        const matchLocal =
        !localFiltro ||
        local === localFiltro;

        linha.style.display =
        matchBusca && matchLocal
        ? ""
        : "none";

    });

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

    carregarFiltroLocaisDashboard();
}

function carregarFiltroLocaisDashboard(){

    const select =
    document.getElementById(
    "filtroLocalDashboard"
    );

    if(!select) return;

    const linhas =
    document.querySelectorAll(
    "#dashboardLocais tr"
    );

    const locais = [];

    linhas.forEach(linha => {

        const local =
        linha.children[1]
        ?.innerText
        .trim();

        if(
            local &&
            !locais.includes(local)
        ){
            locais.push(local);
        }

    });

    locais.sort();

    select.innerHTML = `
        <option value="">
            Todos os Locais
        </option>
    `;

    locais.forEach(local => {

        select.innerHTML += `
            <option value="${local.toLowerCase()}">
                ${local}
            </option>
        `;

    });

}

/* =========================
   MENU
========================= */

/* =========================
   MODAL FOTO
========================= */

function abrirModalFoto(url){

    const modal =
    document.getElementById(
        'modalFoto'
    );

    const imagem =
    document.getElementById(
        'imagemModal'
    );

    imagem.src = url;

    modal.classList.add(
        'active'
    );
}

function fecharModalFoto(){

    const modal =
    document.getElementById(
        'modalFoto'
    );

    modal.classList.remove(
        'active'
    );
}

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

    /* =========================
       TROCAR TELAS
    ========================= */

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

    /* =========================
       MENU ATIVO
    ========================= */

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

    /* =========================
       FECHAR MENU MOBILE
    ========================= */

    if(window.innerWidth <= 900){

        const sidebar =
        document.getElementById(
            'sidebar'
        );

        if(sidebar){

            sidebar.classList.remove(
                'open'
            );
        }
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

        atualizarMenus();

        const { data } =
        await supabaseClient.auth
        .getSession();

        if(data?.session){

            usuarioLogado =
            data.session.user;

            await verificarPerfil();

            atualizarMenus();

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
function toggleSidebar(){

    const sidebar =
    document.getElementById('sidebar');

    if(!sidebar) return;

    sidebar.classList.toggle('open');
}