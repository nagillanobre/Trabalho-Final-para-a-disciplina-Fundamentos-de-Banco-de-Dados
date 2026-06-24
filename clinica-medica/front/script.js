//  LOGICA DE NAVEGAÇÃO DOS MENUS (COM DESTAQUE) 

document.addEventListener('DOMContentLoaded', () => {
    // Seletores dos elementos principais
    const btnCadastro = document.getElementById('btn-cadastro');
    const btnBusca = document.getElementById('btn-busca');
    const submenuCadastro = document.getElementById('submenu-cadastro');
    const submenuBusca = document.getElementById('submenu-busca');

    // Lista com todas as seções de conteúdo
    const secoesConteudo = [
        'formulario-paciente', 'formulario-medico', 'formulario-atendimento',
        'busca-paciente', 'busca-medico', 'busca-atendimento'
    ];

    // Função para esconder todas as seções de conteúdo
    function ocultarTodasSecoes() {
        secoesConteudo.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('oculto');
        });
    }

    // Função para limpar o destaque (.ativo) de um grupo de botões
    function limparBotoesAtivos(seletorGrupo) {
        document.querySelectorAll(seletorGrupo).forEach(btn => btn.classList.remove('ativo'));
    }

    // Clique no botão "Cadastro"
    btnCadastro.addEventListener('click', () => {
        limparBotoesAtivos('.menu-secao:first-of-type button'); // Limpa Cadastro/Busca
        btnCadastro.classList.add('ativo'); // Destaca o Cadastro
        
        submenuBusca.classList.add('oculto');
        ocultarTodasSecoes();
        limparBotoesAtivos('#submenu-cadastro button'); // Limpa subbotões de cadastro anterior
        submenuCadastro.classList.remove('oculto');
    });

    // Clique no botão "Busca"
    btnBusca.addEventListener('click', () => {
        limparBotoesAtivos('.menu-secao:first-of-type button'); // Limpa Cadastro/Busca
        btnBusca.classList.add('ativo'); // Destaca a Busca
        
        submenuCadastro.classList.add('oculto');
        ocultarTodasSecoes();
        limparBotoesAtivos('#submenu-busca button'); // Limpa subbotões de busca anterior
        submenuBusca.classList.remove('oculto');
    });

    // Controla os cliques nos botões dos submenus (Paciente, Médico, Atendimento)
    const botoesSubmenu = document.querySelectorAll('.menu-secao button[data-target]');
    botoesSubmenu.forEach(botao => {
        botao.addEventListener('click', () => {
            // Descobre se o botão clicado pertence ao submenu cadastro ou busca e limpa apenas aquele grupo
            const idSubmenu = botao.parentElement.id;
            limparBotoesAtivos(`#${idSubmenu} button`);
            
            botao.classList.add('ativo'); // Destaca o botão clicado
            ocultarTodasSecoes();
            
            const alvoId = botao.getAttribute('data-target');
            const secaoAlvo = document.getElementById(alvoId);
            if (secaoAlvo) {
                secaoAlvo.classList.remove('oculto');
            }
        });
    });
});





const dados = {
    fisioterapeuta: ["Dr. André", "Dra. Beatriz"],
    neurologista: ["Dr. Carlos", "Dra. Daniela"],
    examesangue: ["Hemograma", "Glicemia"],
    exameimagem: ["Raio-X", "Ressonância"]
};

// Seletores rápidos de grupo
const ocultarGrupo = (classe) => document.querySelectorAll(classe).forEach(el => el.classList.add('oculto'));
const mostrarElementos = (classe) => document.querySelectorAll(classe).forEach(el => el.classList.remove('oculto'));

// Evento Nível 1 (Consulta vs Exame)
document.getElementById('tipo-atendimento').addEventListener('change', function() {
    ocultarGrupo('.consulta-elemento');
    ocultarGrupo('.exame-elemento');
    this.value === 'consulta' ? mostrarElementos('[for="tipo-profissional"], #tipo-profissional') : 
    this.value === 'exame' ? mostrarElementos('[for="tipo-exame"], #tipo-exame') : null;
});

// Evento Nível 2 (Consulta -> Profissional)
document.getElementById('tipo-profissional').addEventListener('change', function() {
    gerarOpcoes(this.value, '#profissional', '[for="profissional"], #profissional', '-- Selecione o Profissional --');
});

// Evento Nível 2 (Exame -> Especificação)
document.getElementById('tipo-exame').addEventListener('change', function() {
    gerarOpcoes(this.value, '#exame-especif', '[for="exame-especif"], #exame-especif', '-- Selecione a Especificação --');
});

function gerarOpcoes(chave, idSelect, classeExibir, textoPadrao) {
    const select = document.querySelector(idSelect);
    select.innerHTML = `<option value="">${textoPadrao}</option>`;
    
    if (chave && dados[chave]) {
        dados[chave].forEach(item => {
            select.innerHTML += `<option value="${item.toLowerCase()}">${item}</option>`;
        });
        mostrarElementos(classeExibir);
    } else {
        ocultarGrupo(idSelect + `, [for="${idSelect.replace('#','')}"]`);
    }
}






