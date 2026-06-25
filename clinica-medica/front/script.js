// Logica para navegacao nos menus
// MENUS
document.addEventListener('DOMContentLoaded', () => {
  const btnCadastro     = document.getElementById('btn-cadastro');
  const btnBusca        = document.getElementById('btn-busca');
  const submenuCadastro = document.getElementById('submenu-cadastro');
  const submenuBusca    = document.getElementById('submenu-busca');

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
    ocultarTodasSecoes();
    limparBotoesAtivos('#submenu-cadastro button');
    submenuCadastro.classList.remove('oculto');
  });

  btnBusca.addEventListener('click', () => {
    limparBotoesAtivos('.menu-secao:first-of-type button');
    btnBusca.classList.add('ativo');
    submenuCadastro.classList.add('oculto');
    ocultarTodasSecoes();
    limparBotoesAtivos('#submenu-busca button');
    submenuBusca.classList.remove('oculto');
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


// HELPERS GERAIS


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


// PACIENTE — CRUD

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


// MÉDICO — CRUD


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
  const dados = {
    nome:          campoNomeMedico.value.trim(),
    especialidade: campoEspecialidade.value.trim()
  };
  const editando = campoMedicoId.value;
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


// ATENDIMENTO — selects dinâmicos + CREATE + READ + DELETE


const ocultarGrupo = (cls) => document.querySelectorAll(cls).forEach(el => el.classList.add('oculto'));
const mostrarGrupo = (cls) => document.querySelectorAll(cls).forEach(el => el.classList.remove('oculto'));

const selectTipoAtend    = document.getElementById('tipo-atendimento');
const selectEspecialid   = document.getElementById('tipo-profissional');
const selectProfissional = document.getElementById('profissional');
const selectTipoExame    = document.getElementById('tipo-exame');
const selectExameEspecif = document.getElementById('exame-especif');

// Consulta ou Exame
selectTipoAtend.addEventListener('change', function () {
  ocultarGrupo('.consulta-elemento');
  ocultarGrupo('.exame-elemento');
  selectEspecialid.value = '';
  selectProfissional.innerHTML = '<option value="">-- Selecione a especialidade primeiro --</option>';
  selectExameEspecif.innerHTML = '<option value="">-- Selecione o tipo primeiro --</option>';

  if (this.value === 'consulta') {
    mostrarGrupo('.consulta-elemento');
  } else if (this.value === 'exame') {
    mostrarGrupo('.exame-elemento');
    mostrarGrupo('.consulta-elemento'); // exame também precisa de profissional responsável
  }
});

// busca médicos pela especialidade selecionada no select
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
      mostrarGrupo('[for="profissional"], #profissional');
    }
  } catch (_) {
    selectProfissional.innerHTML = '<option value="">Erro ao buscar médicos</option>';
  }
});

// Nível 2B: busca exames por categoria selecionada
selectTipoExame.addEventListener('change', async function () {
  const categoria = this.value;
  if (!categoria) return;
  selectExameEspecif.innerHTML = '<option value="">Buscando exames...</option>';
  try {
    const exames = await chamarAPI(`/api/exames/por-categoria/${encodeURIComponent(categoria)}`);
    if (exames.length === 0) {
      selectExameEspecif.innerHTML = '<option value="">Nenhum exame nessa categoria</option>';
    } else {
      selectExameEspecif.innerHTML = '<option value="">-- Selecione o Exame --</option>';
      exames.forEach(ex => {
        selectExameEspecif.innerHTML += `<option value="${ex.id_exame}">${ex.nome_exame}</option>`;
      });
    }
  } catch (_) {
    selectExameEspecif.innerHTML = '<option value="">Erro ao buscar exames</option>';
  }
});

// Submit do atendimento
document.getElementById('form-atendimento').addEventListener('submit', async (e) => {
  e.preventDefault();

  const idPaciente = document.getElementById('idPacienteAtend').value.trim();
  const dataHora   = document.getElementById('dataHoraAtendimento').value;
  const tipo       = selectTipoAtend.value;

  if (!idPaciente || !dataHora || !tipo) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  const [data, hora] = dataHora.split('T');

  if (tipo === 'consulta') {
    const idMedico = selectProfissional.value;
    if (!idMedico) { alert('Selecione o profissional.'); return; }

    try {
      await chamarAPI('/api/consultas', {
        method: 'POST',
        body: JSON.stringify({ id_paciente: idPaciente, id_medico: idMedico, data_consulta: data, hora })
      });
      alert('Consulta cadastrada com sucesso!');
      document.getElementById('form-atendimento').reset();
      ocultarGrupo('.consulta-elemento');
      ocultarGrupo('.exame-elemento');
    } catch (e) {
      alert(e.message);
    }

  } else if (tipo === 'exame') {
    const idExame  = selectExameEspecif.value;
    const idMedico = selectProfissional.value;
    if (!idExame) { alert('Selecione o exame.'); return; }
    if (!idMedico) { alert('Selecione o profissional responsável pelo exame.'); return; }

    try {
      await chamarAPI('/api/consultas', {
        method: 'POST',
        body: JSON.stringify({ id_paciente: idPaciente, id_medico: idMedico, data_consulta: data, hora, id_exame: idExame })
      });
      alert('Atendimento com exame cadastrado com sucesso!');
      document.getElementById('form-atendimento').reset();
      ocultarGrupo('.consulta-elemento');
      ocultarGrupo('.exame-elemento');
    } catch (e) {
      alert(e.message);
    }
  }
});

// Lista atendimentos
async function carregarAtendimentos(q) {
  try {
    const url = q ? `/api/consultas?q=${encodeURIComponent(q)}` : '/api/consultas';
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
      const tipo = a.nome_exame
        ? `Exame: ${a.nome_exame} (${a.categoria_exame})`
        : `Consulta — ${a.especialidade}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.id_consulta}</td>
        <td>${a.id_paciente}</td>
        <td>${a.nome_paciente}</td>
        <td>${a.telefone}</td>
        <td>${formatarData(a.data_consulta)}</td>
        <td>${a.hora}</td>
        <td>${a.nome_medico}</td>
        <td>${tipo}</td>
        <td>
          <button class="btn-remover" onclick="removerAtendimento(${a.id_consulta})">Remover</button>
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
    await chamarAPI(`/api/consultas/${id}`, { method: 'DELETE' });
    carregarAtendimentos();
  } catch (e) {
    alert(e.message);
  }
}
