// server.js - Servidor Express com rotas CRUD da clínica médica v3.

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'front')));

// HELPERS

function limparCPF(cpf) {
  return String(cpf).replace(/\D/g, '');
}

function cpfValido(cpf) {
  return /^\d{11}$/.test(limparCPF(cpf));
}

// PACIENTE

app.post('/api/pacientes', (req, res) => {
  const { nome, cpf, telefone } = req.body;
  const cpfLimpo = limparCPF(cpf || '');

  if (!nome || !cpf || !telefone)
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  if (!cpfValido(cpfLimpo))
    return res.status(400).json({ erro: 'O CPF deve conter exatamente 11 dígitos numéricos.' });

  db.run(
    `INSERT INTO paciente (nome, cpf, telefone) VALUES (?, ?, ?)`,
    [nome, cpfLimpo, telefone],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE'))
          return res.status(409).json({ erro: 'Já existe um paciente cadastrado com esse CPF.' });
        return res.status(500).json({ erro: 'Erro ao cadastrar paciente.' });
      }
      res.status(201).json({ id_paciente: this.lastID, nome, cpf: cpfLimpo, telefone });
    }
  );
});

// Busca por nome OU cpf
app.get('/api/pacientes', (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  db.all(
    `SELECT * FROM paciente WHERE nome LIKE ? OR cpf LIKE ? ORDER BY id_paciente DESC`,
    [q, q],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: 'Erro ao buscar pacientes.' });
      res.json(rows);
    }
  );
});

app.get('/api/pacientes/cpf/:cpf', (req, res) => {
  const cpfLimpo = limparCPF(req.params.cpf);
  db.get(`SELECT * FROM paciente WHERE cpf = ?`, [cpfLimpo], (err, row) => {
    if (err)  return res.status(500).json({ erro: 'Erro ao buscar paciente.' });
    if (!row) return res.status(404).json({ erro: 'Nenhum paciente encontrado com esse CPF.' });
    res.json(row);
  });
});

app.get('/api/pacientes/:id', (req, res) => {
  db.get(`SELECT * FROM paciente WHERE id_paciente = ?`, [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ erro: 'Erro ao buscar paciente.' });
    if (!row) return res.status(404).json({ erro: 'Paciente não encontrado.' });
    res.json(row);
  });
});

app.put('/api/pacientes/:id', (req, res) => {
  const { nome, cpf, telefone } = req.body;
  const cpfLimpo = limparCPF(cpf || '');

  if (!nome || !cpf || !telefone)
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  if (!cpfValido(cpfLimpo))
    return res.status(400).json({ erro: 'O CPF deve conter exatamente 11 dígitos numéricos.' });

  db.run(
    `UPDATE paciente SET nome = ?, cpf = ?, telefone = ? WHERE id_paciente = ?`,
    [nome, cpfLimpo, telefone, req.params.id],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE'))
          return res.status(409).json({ erro: 'Já existe outro paciente com esse CPF.' });
        return res.status(500).json({ erro: 'Erro ao atualizar paciente.' });
      }
      if (this.changes === 0) return res.status(404).json({ erro: 'Paciente não encontrado.' });
      res.json({ id_paciente: Number(req.params.id), nome, cpf: cpfLimpo, telefone });
    }
  );
});

app.delete('/api/pacientes/:id', (req, res) => {
  db.run(`DELETE FROM paciente WHERE id_paciente = ?`, [req.params.id], function (err) {
    if (err) {
      if (err.message.includes('FOREIGN KEY'))
        return res.status(409).json({ erro: 'Não é possível remover: paciente possui atendimentos cadastrados.' });
      return res.status(500).json({ erro: 'Erro ao remover paciente.' });
    }
    if (this.changes === 0) return res.status(404).json({ erro: 'Paciente não encontrado.' });
    res.json({ mensagem: 'Paciente removido com sucesso.' });
  });
});

// ================================================================
// MÉDICO (AUTOINCREMENT a partir de 100, sem ID manual)
// ================================================================

app.post('/api/medicos', (req, res) => {
  const { nome, especialidade } = req.body;
  if (!nome || !especialidade)
    return res.status(400).json({ erro: 'Nome e especialidade são obrigatórios.' });

  db.run(
    `INSERT INTO medico (nome, especialidade) VALUES (?, ?)`,
    [nome, especialidade],
    function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao cadastrar médico.' });
      res.status(201).json({ id_medico: this.lastID, nome, especialidade });
    }
  );
});

// Busca por nome OU id_medico
app.get('/api/medicos', (req, res) => {
  const q  = req.query.q || '';
  const qLike = `%${q}%`;
  const qId   = Number(q) || -1; // tenta interpretar como ID numérico
  db.all(
    `SELECT * FROM medico WHERE nome LIKE ? OR id_medico = ? ORDER BY id_medico DESC`,
    [qLike, qId],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: 'Erro ao buscar médicos.' });
      res.json(rows);
    }
  );
});

app.get('/api/medicos/por-especialidade/:especialidade', (req, res) => {
  db.all(
    `SELECT id_medico, nome FROM medico WHERE especialidade LIKE ?`,
    [`%${req.params.especialidade}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ erro: 'Erro ao buscar médicos por especialidade.' });
      res.json(rows);
    }
  );
});

app.get('/api/medicos/:id', (req, res) => {
  db.get(`SELECT * FROM medico WHERE id_medico = ?`, [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ erro: 'Erro ao buscar médico.' });
    if (!row) return res.status(404).json({ erro: 'Médico não encontrado.' });
    res.json(row);
  });
});

app.put('/api/medicos/:id', (req, res) => {
  const { nome, especialidade } = req.body;
  if (!nome || !especialidade)
    return res.status(400).json({ erro: 'Nome e especialidade são obrigatórios.' });

  db.run(
    `UPDATE medico SET nome = ?, especialidade = ? WHERE id_medico = ?`,
    [nome, especialidade, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ erro: 'Erro ao atualizar médico.' });
      if (this.changes === 0) return res.status(404).json({ erro: 'Médico não encontrado.' });
      res.json({ id_medico: Number(req.params.id), nome, especialidade });
    }
  );
});

app.delete('/api/medicos/:id', (req, res) => {
  db.run(`DELETE FROM medico WHERE id_medico = ?`, [req.params.id], function (err) {
    if (err) {
      if (err.message.includes('FOREIGN KEY'))
        return res.status(409).json({ erro: 'Não é possível remover: médico possui atendimentos cadastrados.' });
      return res.status(500).json({ erro: 'Erro ao remover médico.' });
    }
    if (this.changes === 0) return res.status(404).json({ erro: 'Médico não encontrado.' });
    res.json({ mensagem: 'Médico removido com sucesso.' });
  });
});

// ATENDIMENTO

app.post('/api/atendimentos', (req, res) => {
  const { cpf, data_consulta, hora, tipo, id_medico, especialidade_medico, especificacao } = req.body;

  if (!cpf || !data_consulta || !hora || !tipo || !id_medico || !especialidade_medico)
    return res.status(400).json({ erro: 'CPF, data, hora, tipo, médico e especialidade são obrigatórios.' });

  const cpfLimpo = limparCPF(cpf);

  db.get(`SELECT id_paciente FROM paciente WHERE cpf = ?`, [cpfLimpo], (err, paciente) => {
    if (err)       return res.status(500).json({ erro: 'Erro ao buscar paciente.' });
    if (!paciente) return res.status(404).json({ erro: 'Nenhum paciente encontrado com esse CPF.' });

    db.run(
      `INSERT INTO atendimento (id_paciente, data_consulta, hora) VALUES (?, ?, ?)`,
      [paciente.id_paciente, data_consulta, hora],
      function (err2) {
        if (err2) return res.status(500).json({ erro: 'Erro ao cadastrar atendimento.' });

        const idAtendimento = this.lastID;

        if (tipo === 'consulta') {
          db.run(
            `INSERT INTO consulta (id_atendimento, id_medico, especialidade_medico) VALUES (?, ?, ?)`,
            [idAtendimento, id_medico, especialidade_medico],
            function (err3) {
              if (err3) return res.status(500).json({ erro: 'Erro ao cadastrar consulta.' });
              res.status(201).json({ id_atendimento: idAtendimento, tipo: 'consulta' });
            }
          );
        } else if (tipo === 'exame') {
          if (!especificacao)
            return res.status(400).json({ erro: 'Especificação é obrigatória para exames.' });
          db.run(
            `INSERT INTO exame (id_atendimento, id_medico, especificacao, especialidade_medico) VALUES (?, ?, ?, ?)`,
            [idAtendimento, id_medico, especificacao, especialidade_medico],
            function (err3) {
              if (err3) return res.status(500).json({ erro: 'Erro ao cadastrar exame.' });
              res.status(201).json({ id_atendimento: idAtendimento, tipo: 'exame' });
            }
          );
        } else {
          return res.status(400).json({ erro: 'Tipo deve ser "consulta" ou "exame".' });
        }
      }
    );
  });
});

app.get('/api/atendimentos', (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  const sql = `
    SELECT
      a.id_atendimento,
      p.nome          AS nome_paciente,
      p.cpf,
      p.telefone,
      a.data_consulta,
      a.hora,
      COALESCE(mc.nome, me.nome)               AS nome_medico,
      COALESCE(mc.especialidade, me.especialidade) AS especialidade,
      CASE
        WHEN c.id_consulta IS NOT NULL THEN 'Consulta'
        WHEN e.id_exame    IS NOT NULL THEN 'Exame'
      END AS tipo,
      e.especificacao
    FROM atendimento a
    JOIN paciente p   ON p.id_paciente    = a.id_paciente
    LEFT JOIN consulta c  ON c.id_atendimento = a.id_atendimento
    LEFT JOIN medico   mc ON mc.id_medico     = c.id_medico
    LEFT JOIN exame    e  ON e.id_atendimento = a.id_atendimento
    LEFT JOIN medico   me ON me.id_medico     = e.id_medico
    WHERE p.nome LIKE ?
    ORDER BY a.id_atendimento DESC
  `;
  db.all(sql, [q], (err, rows) => {
    if (err) { console.error(err.message); return res.status(500).json({ erro: 'Erro ao buscar atendimentos.' }); }
    res.json(rows);
  });
});

app.delete('/api/atendimentos/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM consulta WHERE id_atendimento = ?`, [id], () => {
    db.run(`DELETE FROM exame WHERE id_atendimento = ?`, [id], () => {
      db.run(`DELETE FROM atendimento WHERE id_atendimento = ?`, [id], function (err) {
        if (err) return res.status(500).json({ erro: 'Erro ao remover atendimento.' });
        if (this.changes === 0) return res.status(404).json({ erro: 'Atendimento não encontrado.' });
        res.json({ mensagem: 'Atendimento removido com sucesso.' });
      });
    });
  });
});


// RELATÓRIOS GERENCIAIS

app.get('/api/relatorios', (req, res) => {
  // 1. Relatório de Consultas por médico (Seleção, Junção e Agregação)
  const query1 = `
    SELECT m.nome AS medico, m.especialidade, COUNT(c.id_consulta) AS total_consultas
    FROM consulta c 
    JOIN medico m ON c.id_medico = m.id_medico
    GROUP BY m.nome, m.especialidade 
    ORDER BY total_consultas DESC
  `;

  // 2. Relatório de Exames por paciente (Múltiplos Joins)
  const query2 = `
    SELECT p.nome AS paciente, e.especificacao, e.especialidade_medico
    FROM exame e 
    JOIN atendimento a ON e.id_atendimento = a.id_atendimento
    JOIN paciente p ON a.id_paciente = p.id_paciente
  `;

  // 3. Relatório de Categorias de Exames mais realizadas (Seleção e Agregação)
  const query3 = `
    SELECT e.especificacao, COUNT(*) AS total_exames 
    FROM exame e
    GROUP BY e.especificacao 
    ORDER BY total_exames DESC
  `;

  // Encapsulando as consultas do SQLite em Promises
  const buscarConsultasPorMedico = () => {
    return new Promise((resolve, reject) => {
      db.all(query1, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  const buscarExamesPorPaciente = () => {
    return new Promise((resolve, reject) => {
      db.all(query2, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  const buscarExamesMaisRealizados = () => {
    return new Promise((resolve, reject) => {
      db.all(query3, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  // Executa as 3 consultas de forma simultânea
  Promise.all([
    buscarConsultasPorMedico(),
    buscarExamesPorPaciente(),
    buscarExamesMaisRealizados()
  ])
    .then(([dadosQ1, dadosQ2, dadosQ3]) => {
      // Monta a estrutura JSON perfeitamente alinhada com o que o JavaScript do front-end espera
      const respostaRelatorios = [
        {
          titulo: "Consultas por Médico (Seleção, Junção e Agregação)",
          colunas: ["Médico", "Especialidade", "Total de Consultas"],
          chaves: ["medico", "especialidade", "total_consultas"],
          dados: dadosQ1
        },
        {
          titulo: "Exames por Paciente (Junção de Tabelas)",
          colunas: ["Paciente", "Especificação do Exame", "Especialidade Médica"],
          chaves: ["paciente", "especificacao", "especialidade_medico"],
          dados: dadosQ2
        },
        {
          titulo: "Categoria de Exame Mais Realizada (Projeção e Contagem)",
          colunas: ["Especificação do Exame", "Quantidade Total"],
          chaves: ["especificacao", "total_exames"],
          dados: dadosQ3
        }
      ];

      res.json(respostaRelatorios);
    })
    .catch(erro => {
      console.error("Erro ao processar relatórios:", erro.message);
      res.status(500).json({ erro: "Erro interno ao processar as consultas do banco de dados." });
    });
});

// START

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));

