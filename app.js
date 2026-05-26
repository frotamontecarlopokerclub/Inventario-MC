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
    document.getElementById('email')
    .value
    .trim();

    const password =
    document.getElementById('password')
    .value;

    if(!email || !password){

        alert('Informe email e senha');

        return;
    }

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
            document.getElementById(
                'menuDashboard'
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
            document.getElementById(
                'menuLogin'
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

async function verificarPerfil(){

    if(!usuarioLogado) return;

    try{

        const { data, error } =
        await supabaseClient
        .from('usuarios')
        .select('perfil')
        .eq('email', usuarioLogado.email)
        .maybeSingle();

        if(error){

            console.log(error);

            perfilUsuario = 'consulta';

            return;
        }

        perfilUsuario =
        String(data?.perfil || 'consulta')
        .trim()
        .toLowerCase();

    }catch(err){

        console.log(err);

        perfilUsuario = 'consulta';
    }
}

/* =========================
   CONTROLE MENUS
========================= */

function atualizarMenus(){

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

    if(!usuarioLogado){

        loginMenu.style.display = 'flex';

        dashboardMenu.style.display = 'none';
        cadastroMenu.style.display = 'none';
        movimentacaoMenu.style.display = 'none';
        estoqueMenu.style.display = 'none';
        historicoMenu.style.display = 'none';
        logoutMenu.style.display = 'none';

        return;
    }

    loginMenu.style.display = 'none';

    dashboardMenu.style.display = 'flex';
    estoqueMenu.style.display = 'flex';
    historicoMenu.style.display = 'flex';
    logoutMenu.style.display = 'flex';

    if(perfilUsuario === 'consulta'){

        cadastroMenu.style.display = 'none';
        movimentacaoMenu.style.display = 'none';

    }else{

        cadastroMenu.style.display = 'flex';
        movimentacaoMenu.style.display = 'flex';
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

    if(local){

        local.innerHTML =
        '<option value="">Selecione o Local</option>';

        LOCAIS.forEach(item => {

            local.innerHTML += `
            <option value="${item.id}">
                ${item.nome}
            </option>
            `;
        });
    }

    if(destino){

        destino.innerHTML =
        '<option value="">Selecione o Destino</option>';

        LOCAIS.forEach(item => {

            destino.innerHTML += `
            <option value="${item.id}">
                ${item.nome}
            </option>
            `;
        });
    }

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

        return 0;
    }

    const numeros =
    itens.map(item => {

        return parseInt(
            item.patrimonio
        ) || 0;
    });

    return Math.max(...numeros);
}

/* =========================
   SALVAR ITEM
========================= */

async function salvarItem(){

    if(perfilUsuario === 'consulta'){

        alert('Usuário sem permissão!');

        return;
    }

    try{

        const nome =
        document
        .getElementById('nome')
        .value
        .trim();

        const descricao =
        document
        .getElementById('descricao')
        .value
        .trim();

        const tipo =
        document
        .getElementById('tipoItem')
        ?.value
        .trim() || nome;

        const quantidade =
        parseInt(
            document
            .getElementById('quantidadeLote')
            ?.value || 1
        );

        const local_id =
        document
        .getElementById('local')
        .value;

        const status =
        document
        .getElementById('status')
        .value;

        const fotoInput =
        document
        .getElementById('foto');

        const arquivo =
        fotoInput?.files?.[0];

        if(!nome){

            alert('Informe o nome');

            return;
        }

        if(!local_id){

            alert('Selecione o local');

            return;
        }

        let foto_url = '';

        /* =========================
           UPLOAD FOTO
        ========================= */

        if(arquivo){

            const extensao =
            arquivo.name
            .split('.')
            .pop();

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
                arquivo,
                {
                    upsert:true
                }
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
           GERAR LOTE
        ========================= */

        let maiorNumero =
        gerarNumeroPatrimonio();

        const lote = [];

        for(let i = 1; i <= quantidade; i++){

            maiorNumero++;

            lote.push({

                patrimonio:
                String(maiorNumero)
                .padStart(4,'0'),

                nome,
                tipo,
                descricao,

                local_id:
                Number(local_id),

                status,

                foto_url
            });
        }

        /* =========================
           INSERT
        ========================= */

        const { error } =
        await supabaseClient
        .from('itens')
        .insert(lote);

        if(error){

            console.log(error);

            alert(
                'Erro ao salvar patrimônio'
            );

            return;
        }

        alert(
            `${quantidade} patrimônios cadastrados!`
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

    const nome =
    document.getElementById(
        'nome'
    );

    if(nome){

        nome.value = '';
    }

    const descricao =
    document.getElementById(
        'descricao'
    );

    if(descricao){

        descricao.value = '';
    }

    const foto =
    document.getElementById(
        'foto'
    );

    if(foto){

        foto.value = '';
    }

    const local =
    document.getElementById(
        'local'
    );

    if(local){

        local.value = '';
    }

    const status =
    document.getElementById(
        'status'
    );

    if(status){

        status.value = 'Ativo';
    }

    const quantidade =
    document.getElementById(
        'quantidadeLote'
    );

    if(quantidade){

        quantidade.value = 1;
    }

    const tipo =
    document.getElementById(
        'tipoItem'
    );

    if(tipo){

        tipo.value = '';
    }
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

            alert(
                'Erro ao carregar itens'
            );

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

        if(tabela){

            tabela.innerHTML = '';
        }

        if(itemMov){

            itemMov.innerHTML = `
            <option value="">
            Selecione o Patrimônio
            </option>
            `;
        }

        itens.forEach(item => {

            const local =
            LOCAIS.find(
                l => l.id == item.local_id
            );

            let classeStatus = '';

            if(item.status === 'Ativo'){

                classeStatus = 'ativo';
            }

            if(item.status === 'Em manutenção'){

                classeStatus = 'manutencao';
            }

            if(item.status === 'Baixado'){

                classeStatus = 'baixado';
            }

            if(item.status === 'Extraviado'){

                classeStatus = 'extraviado';
            }

            if(tabela){

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
'${item.foto_url || ''}'
)
"

style="
width:60px;
height:60px;
object-fit:cover;
border-radius:8px;
cursor:pointer;
border:2px solid #ddd;
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
            }

            if(itemMov){

                itemMov.innerHTML += `

<option value="${item.id}">
${item.patrimonio} - ${item.nome}
</option>

`;
            }
        });

        const totalItens =
        document.getElementById(
            'totalItens'
        );

        if(totalItens){

            totalItens.innerText =
            itens.length;
        }

        const totalBaixados =
        document.getElementById(
            'totalBaixados'
        );

        if(totalBaixados){

            totalBaixados.innerText =
            itens.filter(
                item =>
                item.status === 'Baixado'
            ).length;
        }

    }catch(err){

        console.log(err);
    }
}

/* =========================
   EDITAR ITEM
========================= */

async function editarItem(id){

    if(perfilUsuario === 'consulta'){

        alert('Usuário sem permissão!');

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

        alert('Usuário sem permissão!');

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

        const totalMov =
        document.getElementById(
            'totalMov'
        );

        if(totalMov){

            totalMov.innerText =
            movimentacoes.length;
        }

    }catch(err){

        console.log(err);
    }
}

/* =========================
   DASHBOARD STATUS
========================= */

function atualizarDashboardAvancado(){

    const dashAtivo =
    document.getElementById(
        'dashAtivo'
    );

    if(dashAtivo){

        dashAtivo.innerText =
        itens.filter(
            item =>
            item.status === 'Ativo'
        ).length;
    }

    const dashManutencao =
    document.getElementById(
        'dashManutencao'
    );

    if(dashManutencao){

        dashManutencao.innerText =
        itens.filter(
            item =>
            item.status ===
            'Em manutenção'
        ).length;
    }

    const dashBaixado =
    document.getElementById(
        'dashBaixado'
    );

    if(dashBaixado){

        dashBaixado.innerText =
        itens.filter(
            item =>
            item.status ===
            'Baixado'
        ).length;
    }

    const dashExtraviado =
    document.getElementById(
        'dashExtraviado'
    );

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
   RELATÓRIO AGRUPADO
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

        const tipo =
        item.tipo || item.nome;

        const chave =
        `${tipo}||${nomeLocal}`;

        if(!agrupado[chave]){

            agrupado[chave] = {

                item:tipo,
                local:nomeLocal,
                quantidade:0
            };
        }

        agrupado[chave]
        .quantidade++;
    });

    Object.values(agrupado)

    .sort((a,b) => {

        return a.local
        .localeCompare(b.local);

    })

    .forEach(registro => {

        tabela.innerHTML += `

<tr>

<td>
${registro.item}
</td>

<td data-local="${registro.local.toLowerCase()}">
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
   FILTRAR DASHBOARD
========================= */

function filtrarDashboard(){

    const busca =
    document
    .getElementById(
        'filtroDashboard'
    )
    ?.value
    .toLowerCase()
    .trim() || '';

    const localFiltro =
    document
    .getElementById(
        'filtroLocalDashboard'
    )
    ?.value
    .toLowerCase()
    .trim() || '';

    const linhas =
    document.querySelectorAll(
        '#dashboardLocais tr'
    );

    linhas.forEach(linha => {

        const item =
        linha.children[0]
        ?.innerText
        .toLowerCase() || '';

        const local =
        linha.children[1]
        ?.dataset
        ?.local || '';

        const textoCompleto =
        `${item} ${local}`;

        const matchBusca =
        textoCompleto.includes(busca);

        const matchLocal =
        !localFiltro ||
        local === localFiltro;

        linha.style.display =
        (matchBusca && matchLocal)
        ? ''
        : 'none';

    });
}

/* =========================
   FILTRO LOCAIS DASHBOARD
========================= */

function carregarFiltroLocaisDashboard(){

    const select =
    document.getElementById(
        'filtroLocalDashboard'
    );

    if(!select) return;

    select.innerHTML = `
    <option value="">
    Todos os Locais
    </option>
    `;

    LOCAIS
    .sort((a,b) => {

        return a.nome.localeCompare(
            b.nome
        );

    })
    .forEach(local => {

        select.innerHTML += `

<option value="${local.nome.toLowerCase()}">
${local.nome}
</option>

`;
    });
}

/* =========================
   FILTRAR ITENS
========================= */

function filtrarItens(){

    const termo =
    document.getElementById(
        'busca'
    )
    ?.value
    .toLowerCase() || '';

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

async function carregarDashboard(){

    carregarLocais();

    await carregarItens();

    await carregarHistorico();

    atualizarDashboardAvancado();

    gerarRelatorioLocais();

    carregarFiltroLocaisDashboard();
}

/* =========================
   MODAL FOTO
========================= */

function abrirModalFoto(url){

    if(!url) return;

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

    document
    .getElementById(
        'modalFoto'
    )
    .classList
    .remove('active');
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

    document
    .getElementById(idTela)
    .classList
    .add('activeTela');

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

    if(window.innerWidth <= 900){

        document
        .getElementById('sidebar')
        .classList
        .remove('open');
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
    'PATRIMÔNIO;TIPO;NOME;DESCRIÇÃO;LOCAL;STATUS\n';

    itens.forEach(item => {

        const local =
        LOCAIS.find(
            l => l.id == item.local_id
        );

        csv +=
        `${item.patrimonio};`;

        csv +=
        `${item.tipo || item.nome};`;

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
   MENU MOBILE
========================= */

function toggleSidebar(){

    const sidebar =
    document.getElementById(
        'sidebar'
    );

    if(!sidebar) return;

    sidebar.classList.toggle(
        'open'
    );
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
                document.getElementById(
                    'menuDashboard'
                )
            );

            await carregarDashboard();

        }else{

            abrirTela(
                'loginTela',
                document.getElementById(
                    'menuLogin'
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