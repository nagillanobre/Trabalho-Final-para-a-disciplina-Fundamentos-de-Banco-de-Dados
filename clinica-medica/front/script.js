// Trabalho de banco de dados - EQUIPE 2 - Clinica medica
// Caua Moreira Guimaraes - 540850
// Nagilla Nobre da Silva - 470934
// Antonio Sidney Vidal da Silva - 568579
// 

// Logica para navegacao nos menus
// MENUS
document.addEventListener('DOMContentLoaded', () => {
  const btnCadastro     = document.getElementById('btn-cadastro');
  const btnBusca        = document.getElementById('btn-busca');
  const btnRelatorio    = document.getElementById('btn-relatorio');
  const submenuCadastro = document.getElementById('submenu-cadastro');
  const submenuBusca    = document.getElementById('submenu-busca');
  const secaoRelatorio  = document.getElementById('tabelas-relatorio');

  const secoesConteudo = [
    'formulario-paciente', 'formulario-medico', 'formulario-atendimento',
    'busca-paciente', 'busca-medico', 'busca-atendimento'
  ];

  function ocultarTodasSecoes() {
    secoesConteudo.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('oculto');
    });
  }

  function limparBotoesAtivos(seletor) {
    document.querySelectorAll(seletor).forEach(btn => btn.classList.remove('ativo'));
  }

  btnCadastro.addEventListener('click', () => {
    limparBotoesAtivos('.menu-secao:first-of-type button');
    btnCadastro.classList.add('ativo');
    submenuBusca.classList.add('oculto');
    secaoRelatorio.classList.add('oculto');
    ocultarTodasSecoes();
    limparBotoesAtivos('#submenu-cadastro button');
    submenuCadastro.classList.remove('oculto');
  });

  btnBusca.addEventListener('click', () => {
    limparBotoesAtivos('.menu-secao:first-of-type button');
    btnBusca.classList.add('ativo');
    submenuCadastro.classList.add('oculto');
    secaoRelatorio.classList.add('oculto');
    ocultarTodasSecoes();
    limparBotoesAtivos('#submenu-busca button');
    submenuBusca.classList.remove('oculto');
  });

  btnRelatorio.addEventListener('click', () => {
    limparBotoesAtivos('.menu-secao:first-of-type button');
    btnRelatorio.classList.add('ativo');
    submenuCadastro.classList.add('oculto');
    submenuBusca.classList.add('oculto');
    ocultarTodasSecoes();
    secaoRelatorio.classList.remove('oculto');
  });


  document.querySelectorAll('.menu-secao button[data-target]').forEach(botao => {
    botao.addEventListener('click', () => {
      const idSubmenu = botao.parentElement.id;
      limparBotoesAtivos(`#${idSubmenu} button`);
      botao.classList.add('ativo');
      ocultarTodasSecoes();

      const alvoId = botao.getAttribute('data-target');
      const secao  = document.getElementById(alvoId);
      if (secao) secao.classList.remove('oculto');

      if (alvoId === 'busca-paciente')    carregarPacientes();
      if (alvoId === 'busca-medico')      carregarMedicos();
      if (alvoId === 'busca-atendimento') carregarAtendimentos();
    });
  });
});


// Helpers

function escapar(texto) {
  return String(texto || '').replace(/'/g, "\\'");
}

function formatarCPF(cpf) {
  const s = String(cpf).replace(/\D/g, '');
  return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function limparCPF(cpf) {
  return String(cpf).replace(/\D/g, '');
}

function formatarData(data) {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

async function chamarAPI(url, opcoes = {}) {
  const resposta = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || 'Erro na requisição.');
  return dados;
}


// Paciente - CRUD

const formPaciente        = document.getElementById('form-paciente');
const campoPacienteId     = document.getElementById('paciente-id');
const campoNomePaciente   = document.getElementById('nomePaciente');
const campoCPF            = document.getElementById('cpf');
const campoTelefone       = document.getElementById('telefonePaciente');
const erroCPF             = document.getElementById('erro-cpf');
const tituloPaciente      = document.getElementById('titulo-form-paciente');
const btnSalvarPaciente   = document.getElementById('btn-salvar-paciente');
const btnCancelarPaciente = document.getElementById('btn-cancelar-paciente');

// Máscara de CPF
campoCPF.addEventListener('input', () => {
  let v = campoCPF.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  campoCPF.value = v;

  const limpo = limparCPF(v);
  if (limpo.length > 0 && limpo.length < 11) {
    campoCPF.classList.add('invalido');
    erroCPF.classList.remove('oculto');
  } else {
    campoCPF.classList.remove('invalido');
    erroCPF.classList.add('oculto');
  }
});

async function carregarPacientes(q) {
  try {
    const url = q ? `/api/pacientes?q=${encodeURIComponent(q)}` : '/api/pacientes';
    const pacientes = await chamarAPI(url);
    const corpo    = document.getElementById('corpo-tabela-paciente');
    const msgVazio = document.getElementById('msg-vazio-paciente');

    corpo.innerHTML = '';
    if (pacientes.length === 0) {
      msgVazio.classList.remove('oculto');
      return;
    }
    msgVazio.classList.add('oculto');

    pacientes.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id_paciente}</td>
        <td>${p.nome}</td>
        <td>${formatarCPF(p.cpf)}</td>
        <td>${p.telefone}</td>
        <td>
          <button class="btn-editar" onclick="prepararEdicaoPaciente(${p.id_paciente}, '${escapar(p.nome)}', '${p.cpf}', '${escapar(p.telefone)}')">Editar</button>
          <button class="btn-remover" onclick="removerPaciente(${p.id_paciente})">Remover</button>
        </td>
      `;
      corpo.appendChild(tr);
    });
  } catch (e) {
    alert(e.message);
  }
}

document.getElementById('busca-paciente-input').addEventListener('input', function () {
  carregarPacientes(this.value.trim());
});

formPaciente.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Limpa erro de CPF duplicado antes de tentar
  const erroCPFDuplicado = document.getElementById('erro-cpf-duplicado');
  erroCPFDuplicado.classList.add('oculto');
  campoCPF.classList.remove('invalido');

  const cpfLimpo = limparCPF(campoCPF.value);
  if (cpfLimpo.length !== 11) {
    campoCPF.classList.add('invalido');
    erroCPF.classList.remove('oculto');
    campoCPF.focus();
    return;
  }

  const dados = {
    nome:     campoNomePaciente.value.trim(),
    cpf:      cpfLimpo,
    telefone: campoTelefone.value.trim()
  };

  const editando = campoPacienteId.value;

  try {
    if (editando) {
      await chamarAPI(`/api/pacientes/${editando}`, { method: 'PUT', body: JSON.stringify(dados) });
      alert('Paciente atualizado com sucesso!');
    } else {
      await chamarAPI('/api/pacientes', { method: 'POST', body: JSON.stringify(dados) });
      alert('Paciente cadastrado com sucesso!');
    }
    resetarFormPaciente();
  } catch (e) {
    // CPF duplicado: mostra erro inline no campo, sem alert
    if (e.message.includes('CPF')) {
      campoCPF.classList.add('invalido');
      erroCPFDuplicado.classList.remove('oculto');
      campoCPF.focus();
    } else {
      alert(e.message);
    }
  }
});

function prepararEdicaoPaciente(id, nome, cpf, telefone) {
  campoPacienteId.value   = id;
  campoNomePaciente.value = nome;
  campoCPF.value          = formatarCPF(cpf);
  campoTelefone.value     = telefone;

  tituloPaciente.textContent = 'Editar Paciente';
  btnSalvarPaciente.textContent = 'Salvar Alterações';
  btnCancelarPaciente.classList.remove('oculto');

  document.querySelectorAll('section').forEach(s => s.classList.add('oculto'));
  document.getElementById('formulario-paciente').classList.remove('oculto');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function removerPaciente(id) {
  if (!confirm('Tem certeza que deseja remover este paciente?')) return;
  try {
    await chamarAPI(`/api/pacientes/${id}`, { method: 'DELETE' });
    carregarPacientes();
  } catch (e) {
    alert(e.message);
  }
}

function resetarFormPaciente() {
  formPaciente.reset();
  campoPacienteId.value = '';
  campoCPF.classList.remove('invalido');
  erroCPF.classList.add('oculto');
  document.getElementById('erro-cpf-duplicado').classList.add('oculto');
  tituloPaciente.textContent = 'Cadastro de Pacientes';
  btnSalvarPaciente.textContent = 'Cadastrar';
  btnCancelarPaciente.classList.add('oculto');
}

btnCancelarPaciente.addEventListener('click', resetarFormPaciente);


// Medico - CRUD

const formMedico         = document.getElementById('form-medico');
const campoMedicoId      = document.getElementById('medico-id');
const campoNomeMedico    = document.getElementById('nomeMedico');
const campoEspecialidade = document.getElementById('especialidadeMedico');
const tituloMedico       = document.getElementById('titulo-form-medico');
const btnSalvarMedico    = document.getElementById('btn-salvar-medico');
const btnCancelarMedico  = document.getElementById('btn-cancelar-medico');

async function carregarMedicos(q) {
  try {
    const url = q ? `/api/medicos?q=${encodeURIComponent(q)}` : '/api/medicos';
    const medicos  = await chamarAPI(url);
    const corpo    = document.getElementById('corpo-tabela-medico');
    const msgVazio = document.getElementById('msg-vazio-medico');

    corpo.innerHTML = '';
    if (medicos.length === 0) {
      msgVazio.classList.remove('oculto');
      return;
    }
    msgVazio.classList.add('oculto');

    medicos.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.id_medico}</td>
        <td>${m.nome}</td>
        <td>${m.especialidade}</td>
        <td>
          <button class="btn-editar" onclick="prepararEdicaoMedico(${m.id_medico}, '${escapar(m.nome)}', '${escapar(m.especialidade)}')">Editar</button>
          <button class="btn-remover" onclick="removerMedico(${m.id_medico})">Remover</button>
        </td>
      `;
      corpo.appendChild(tr);
    });
  } catch (e) {
    alert(e.message);
  }
}

document.getElementById('busca-medico-input').addEventListener('input', function () {
  carregarMedicos(this.value.trim());
});

formMedico.addEventListener('submit', async (e) => {
  e.preventDefault();
  const editando = campoMedicoId.value;
  const dados = {
    nome:          campoNomeMedico.value.trim(),
    especialidade: campoEspecialidade.value
  };
  try {
    if (editando) {
      await chamarAPI(`/api/medicos/${editando}`, { method: 'PUT', body: JSON.stringify(dados) });
      alert('Médico atualizado com sucesso!');
    } else {
      await chamarAPI('/api/medicos', { method: 'POST', body: JSON.stringify(dados) });
      alert('Médico cadastrado com sucesso!');
    }
    resetarFormMedico();
  } catch (e) {
    alert(e.message);
  }
});

function prepararEdicaoMedico(id, nome, especialidade) {
  campoMedicoId.value      = id;
  campoNomeMedico.value    = nome;
  campoEspecialidade.value = especialidade;

  tituloMedico.textContent = 'Editar Médico';
  btnSalvarMedico.textContent = 'Salvar Alterações';
  btnCancelarMedico.classList.remove('oculto');

  document.querySelectorAll('section').forEach(s => s.classList.add('oculto'));
  document.getElementById('formulario-medico').classList.remove('oculto');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function removerMedico(id) {
  if (!confirm('Tem certeza que deseja remover este médico?')) return;
  try {
    await chamarAPI(`/api/medicos/${id}`, { method: 'DELETE' });
    carregarMedicos();
  } catch (e) {
    alert(e.message);
  }
}

function resetarFormMedico() {
  formMedico.reset();
  campoMedicoId.value = '';
  tituloMedico.textContent = 'Cadastro de Médicos';
  btnSalvarMedico.textContent = 'Cadastrar';
  btnCancelarMedico.classList.add('oculto');
}

btnCancelarMedico.addEventListener('click', resetarFormMedico);


// Atendimento - CRUD

const ocultarGrupo = (cls) => document.querySelectorAll(cls).forEach(el => el.classList.add('oculto'));
const mostrarGrupo = (cls) => document.querySelectorAll(cls).forEach(el => el.classList.remove('oculto'));

const selectTipoAtend    = document.getElementById('tipo-atendimento');
const selectEspecialid   = document.getElementById('tipo-profissional');
const selectProfissional = document.getElementById('profissional');
const inputExameEspecif  = document.getElementById('exame-especif');

const campoCPFAtend   = document.getElementById('cpfPacienteAtend');
const erroCPFAtend    = document.getElementById('erro-cpf-atend');
const infoPacienteAtend = document.getElementById('info-paciente-atend');

// Máscara de CPF no campo de atendimento
campoCPFAtend.addEventListener('input', () => {
  let v = campoCPFAtend.value.replace(/\D/g, '').slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  campoCPFAtend.value = v;

  // Limpa feedbacks ao editar
  erroCPFAtend.classList.add('oculto');
  infoPacienteAtend.classList.add('oculto');
  campoCPFAtend.classList.remove('invalido');
});

// Verificação do CPF ao sair do campo (blur) — mostra nome do paciente se encontrado
campoCPFAtend.addEventListener('blur', async () => {
  const cpf = limparCPF(campoCPFAtend.value);
  if (cpf.length !== 11) return;
  try {
    const paciente = await chamarAPI(`/api/pacientes/cpf/${cpf}`);
    infoPacienteAtend.textContent = `✓ Paciente encontrado: ${paciente.nome}`;
    infoPacienteAtend.classList.remove('oculto');
    erroCPFAtend.classList.add('oculto');
    campoCPFAtend.classList.remove('invalido');
  } catch (_) {
    erroCPFAtend.classList.remove('oculto');
    infoPacienteAtend.classList.add('oculto');
    campoCPFAtend.classList.add('invalido');
  }
});

// Etapa 1 de verificacao: Consulta ou Exame
selectTipoAtend.addEventListener('change', function () {
  ocultarGrupo('.consulta-elemento');
  ocultarGrupo('.exame-elemento');
  selectEspecialid.value = '';
  selectProfissional.innerHTML = '<option value="">-- Selecione a especialidade primeiro --</option>';

  if (this.value === 'consulta') {
    mostrarGrupo('.consulta-elemento');
  } else if (this.value === 'exame') {
    mostrarGrupo('.exame-elemento');
    mostrarGrupo('.consulta-elemento');
  }
});

// Etapa 2 de verificacao: busca médicos pela especialidade selecionada
selectEspecialid.addEventListener('change', async function () {
  const esp = this.value;
  if (!esp) {
    selectProfissional.innerHTML = '<option value="">-- Selecione a especialidade primeiro --</option>';
    return;
  }
  selectProfissional.innerHTML = '<option value="">Buscando...</option>';
  try {
    const medicos = await chamarAPI(`/api/medicos/por-especialidade/${encodeURIComponent(esp)}`);
    if (medicos.length === 0) {
      selectProfissional.innerHTML = '<option value="">Nenhum médico com essa especialidade cadastrado</option>';
    } else {
      selectProfissional.innerHTML = '<option value="">-- Selecione o Profissional --</option>';
      medicos.forEach(m => {
        selectProfissional.innerHTML += `<option value="${m.id_medico}">${m.nome}</option>`;
      });
    }
  } catch (_) {
    selectProfissional.innerHTML = '<option value="">Erro ao buscar médicos</option>';
  }
});

// Submit do atendimento
document.getElementById('form-atendimento').addEventListener('submit', async (e) => {
  e.preventDefault();

  const cpf      = limparCPF(campoCPFAtend.value);
  const dataHora = document.getElementById('dataHoraAtendimento').value;
  const tipo     = selectTipoAtend.value;
  const idMedico = selectProfissional.value;
  const especialidade_medico = selectEspecialid.value;

  if (!cpf || !dataHora || !tipo) {
    alert('Preencha CPF, data/hora e tipo de atendimento.');
    return;
  }
  if (cpf.length !== 11) {
    campoCPFAtend.classList.add('invalido');
    erroCPFAtend.classList.remove('oculto');
    return;
  }
  if (!idMedico) { alert('Selecione o profissional responsável.'); return; }

  const [data, hora] = dataHora.split('T');
  const payload = { cpf, data_consulta: data, hora, tipo, id_medico: idMedico, especialidade_medico };

  if (tipo === 'exame') {
    const especificacao = inputExameEspecif.value.trim();
    if (!especificacao) { alert('Informe a especificação do exame.'); return; }
    payload.especificacao = especificacao;
  }

  try {
    await chamarAPI('/api/atendimentos', { method: 'POST', body: JSON.stringify(payload) });
    alert(tipo === 'consulta' ? 'Consulta cadastrada com sucesso!' : 'Exame cadastrado com sucesso!');
    document.getElementById('form-atendimento').reset();
    ocultarGrupo('.consulta-elemento');
    ocultarGrupo('.exame-elemento');
    erroCPFAtend.classList.add('oculto');
    infoPacienteAtend.classList.add('oculto');
  } catch (e) {
    alert(e.message);
  }
});

// Lista atendimentos
async function carregarAtendimentos(q) {
  try {
    const url = q ? `/api/atendimentos?q=${encodeURIComponent(q)}` : '/api/atendimentos';
    const atendimentos = await chamarAPI(url);
    const corpo        = document.getElementById('corpo-tabela-atend');
    const msgVazio     = document.getElementById('msg-vazio-atend');

    corpo.innerHTML = '';
    if (atendimentos.length === 0) {
      msgVazio.classList.remove('oculto');
      return;
    }
    msgVazio.classList.add('oculto');

    atendimentos.forEach(a => {
      const especif = a.tipo === 'Exame' && a.especificacao ? ` — ${a.especificacao}` : '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.id_atendimento}</td>
        <td>${a.nome_paciente}</td>
        <td>${formatarCPF(a.cpf)}</td>
        <td>${a.telefone}</td>
        <td>${formatarData(a.data_consulta)}</td>
        <td>${a.hora}</td>
        <td>${a.nome_medico}</td>
        <td>${(a.tipo || '-') + especif}</td>
        <td>
          <button class="btn-remover" onclick="removerAtendimento(${a.id_atendimento})">Remover</button>
        </td>
      `;
      corpo.appendChild(tr);
    });
  } catch (e) {
    alert(e.message);
  }
}

document.getElementById('busca-atend-input').addEventListener('input', function () {
  carregarAtendimentos(this.value.trim());
});

async function removerAtendimento(id) {
  if (!confirm('Tem certeza que deseja remover este atendimento?')) return;
  try {
    await chamarAPI(`/api/atendimentos/${id}`, { method: 'DELETE' });
    carregarAtendimentos();
  } catch (e) {
    alert(e.message);
  }
}


// ===== RELATÓRIOS DINÂMICOS =====
// Evento para carregar os relatórios quando o botão principal de relatórios for clicado
document.getElementById('btn-relatorio').addEventListener('click', carregarRelatorios);

async function carregarRelatorios() {
  const conteiner = document.getElementById('conteiner-relatorios');
  conteiner.innerHTML = '<p>Carregando relatórios...</p>';

  try {
    // Rota fictícia que trará todos os relatórios estruturados do back-end
    const relatorios = await chamarAPI('/api/relatorios');
    
    conteiner.innerHTML = ''; // Limpa o "Carregando..."

    // Se o back-end não retornar nenhum relatório configurado
    if (!relatorios || relatorios.length === 0) {
      conteiner.innerHTML = '<p>Nenhum tipo de relatório configurado no sistema.</p>';
      return;
    }

    // Percorre cada relatório vindo do back-end
    relatorios.forEach(relatorio => {
      // Cria a estrutura de container para cada relatório individual
      const divRelatorio = document.createElement('div');
      divRelatorio.style.marginBottom = '2.5rem';

      // Título do relatório (Ex: "Consultas por Especialidade (Join)")
      const titulo = document.createElement('h3');
      titulo.textContent = relatorio.titulo;
      divRelatorio.appendChild(titulo);

      // Cria a tabela
      const tabela = document.createElement('table');
      
      // 1. CRIAÇÃO DINÂMICA DAS COLUNAS (THEAD)
      const thead = document.createElement('thead');
      const trHeader = document.createElement('tr');
      
      relatorio.colunas.forEach(nomeColuna => {
        const th = document.createElement('th');
        th.textContent = nomeColuna;
        trHeader.appendChild(th);
      });
      thead.appendChild(trHeader);
      tabela.appendChild(thead);

      // 2. CRIAÇÃO DINÂMICA DAS LINHAS (TBODY)
      const tbody = document.createElement('tbody');
      
      if (!relatorio.dados || relatorio.dados.length === 0) {
        // Se não houver linhas, exibe a mensagem de feedback dentro da tabela ocupando todas as colunas
        const trVazio = document.createElement('tr');
        const tdVazio = document.createElement('td');
        tdVazio.setAttribute('colspan', relatorio.colunas.length);
        tdVazio.style.textAlign = 'center';
        tdVazio.style.color = '#777';
        tdVazio.style.padding = '1.5rem';
        tdVazio.textContent = 'Nenhuma informação ainda.';
        
        trVazio.appendChild(tdVazio);
        tbody.appendChild(trVazio);
      } else {
        // Se houver dados, preenche as linhas respeitando a ordem das colunas chaves do objeto
        relatorio.dados.forEach(linha => {
          const trLinha = document.createElement('tr');
          
          // O back-end deve mandar as chaves dos dados alinhadas com as colunas, ou em formato de array
          // Supondo que o back-end mande a linha como um array de valores:
          if (Array.isArray(linha)) {
            linha.forEach(valor => {
              const td = document.createElement('td');
              td.textContent = valor === null || valor === undefined ? '-' : valor;
              trLinha.appendChild(td);
            });
          } else {
            // Se o back-end mandar como objeto, mapeamos pelas chaves declaradas em relatorio.chaves
            relatorio.chaves.forEach(chave => {
              const td = document.createElement('td');
              let valor = linha[chave];
              
              // Aproveita suas funções de formatação existentes se necessário
              if (chave === 'cpf') valor = formatarCPF(valor);
              if (chave === 'data_consulta') valor = formatarData(valor);

              td.textContent = valor === null || valor === undefined ? '-' : valor;
              trLinha.appendChild(td);
            });
          }
          tbody.appendChild(trLinha);
        });
      }

      tabela.appendChild(tbody);
      divRelatorio.appendChild(tabela);
      conteiner.appendChild(divRelatorio);
    });

  } catch (e) {
    conteiner.innerHTML = `<p class="erro">Erro ao carregar relatórios: ${e.message}</p>`;
  }
}
