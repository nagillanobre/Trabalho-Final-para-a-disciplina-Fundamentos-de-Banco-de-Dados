// Conexao com SQLite e criação das tabelas

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

const dbPath = path.join(__dirname, 'banco.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Erro ao conectar ao banco:', err.message);
  else     console.log('Conectado ao banco SQLite em', dbPath);
});

db.run('PRAGMA foreign_keys = ON');

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS paciente (
      id_paciente INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT NOT NULL,
      telefone    TEXT,
      cpf         TEXT UNIQUE
    )
  `, err => { if (err) console.error('Erro ao criar tabela paciente:', err.message); });

  // id_medico com AUTOINCREMENT iniciando em 100 via seed do primeiro registro
  db.run(`
    CREATE TABLE IF NOT EXISTS medico (
      id_medico     INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT NOT NULL,
      especialidade TEXT NOT NULL
    )
  `, err => { if (err) console.error('Erro ao criar tabela medico:', err.message); });

  db.run(`
    CREATE TABLE IF NOT EXISTS atendimento (
      id_atendimento INTEGER PRIMARY KEY AUTOINCREMENT,
      id_paciente    INTEGER NOT NULL,
      data_consulta  TEXT NOT NULL,
      hora           TEXT NOT NULL,
      FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
    )
  `, err => { if (err) console.error('Erro ao criar tabela atendimento:', err.message); });

  db.run(`
    CREATE TABLE IF NOT EXISTS consulta (
      id_consulta          INTEGER PRIMARY KEY AUTOINCREMENT,
      id_atendimento       INTEGER NOT NULL,
      id_medico            INTEGER NOT NULL,
      especialidade_medico TEXT NOT NULL,
      FOREIGN KEY (id_atendimento) REFERENCES atendimento(id_atendimento),
      FOREIGN KEY (id_medico)      REFERENCES medico(id_medico)
    )
  `, err => { if (err) console.error('Erro ao criar tabela consulta:', err.message); });

  db.run(`
    CREATE TABLE IF NOT EXISTS exame (
      id_exame             INTEGER PRIMARY KEY AUTOINCREMENT,
      id_atendimento       INTEGER NOT NULL,
      id_medico            INTEGER NOT NULL,
      especificacao        TEXT,
      especialidade_medico TEXT NOT NULL,
      FOREIGN KEY (id_atendimento) REFERENCES atendimento(id_atendimento),
      FOREIGN KEY (id_medico)      REFERENCES medico(id_medico)
    )
  `, err => { if (err) console.error('Erro ao criar tabela exame:', err.message); });

  // Seed: garante que o AUTOINCREMENT do médico comece em 100
  // Insere um registro fantasma com id=99 para o próximo gerado ser 100, depois remove
  db.get(`SELECT COUNT(*) as total FROM medico`, (err, row) => {
    if (err || (row && row.total > 0)) return;
    db.run(`INSERT INTO medico (id_medico, nome, especialidade) VALUES (99, '__seed__', '__seed__')`, () => {
      db.run(`DELETE FROM medico WHERE id_medico = 99`);
      console.log('Sequência de id_medico iniciada em 100.');
    });
  });

  console.log('Tabelas verificadas/criadas com sucesso.');
});

module.exports = db;
