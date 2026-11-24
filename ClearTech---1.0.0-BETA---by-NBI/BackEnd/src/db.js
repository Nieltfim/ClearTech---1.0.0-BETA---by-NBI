const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite'); // SQLite embutido no Node

const alvo = process.env.DB_PATH || './database.sqlite';
const caminho = alvo === ':memory:' ? alvo : path.resolve(__dirname, '..', alvo);
const db = new DatabaseSync(caminho);

// Colunas novas em tabelas que podem JÁ existir no seu banco (CREATE IF NOT EXISTS não as altera).
const COLUNAS_NOVAS = [
  'ALTER TABLE users ADD COLUMN pontos INTEGER NOT NULL DEFAULT 0',
  "ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN categoria TEXT NOT NULL DEFAULT 'comum' CHECK (categoria IN ('comum', 'comprador'))",
  "ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'aprovado', 'reprovado', 'suspenso'))",
  'ALTER TABLE material_records ADD COLUMN entrega_id INTEGER REFERENCES entregas(id)',
  'ALTER TABLE material_records ADD COLUMN material_id TEXT REFERENCES materiais(id)',
  'ALTER TABLE material_records ADD COLUMN peso_g INTEGER',
  'ALTER TABLE material_records ADD COLUMN qualidade REAL',
  'ALTER TABLE material_records ADD COLUMN ponto_coleta_id INTEGER REFERENCES pontos_coleta(id)',
  'ALTER TABLE reward_redemptions ADD COLUMN beneficio_id TEXT REFERENCES beneficios(id)',
];

// Índices que dependem das colunas acima (precisam rodar DEPOIS dos ALTER).
const INDICES_POS = [
  // Garante que UMA entrega só vira UM registro de histórico (nunca pontos em duplicidade).
  'CREATE UNIQUE INDEX IF NOT EXISTS ux_material_entrega ON material_records(entrega_id) WHERE entrega_id IS NOT NULL',
  'CREATE INDEX IF NOT EXISTS idx_material_ponto ON material_records(ponto_coleta_id)',
];

/**
 * Versões anteriores deste projeto criaram "sessoes" com a coluna usuario_id (hoje é user_id).
 * Sessões são descartáveis (quem estiver logado só precisa entrar de novo), então é seguro recriar a tabela.
 */
function corrigirSessoesAntigas() {
  const colunas = db.prepare('PRAGMA table_info(sessoes)').all().map((c) => c.name);
  if (colunas.length && !colunas.includes('user_id')) {
    db.exec('DROP TABLE sessoes');
    console.log('Tabela "sessoes" de uma versão anterior foi recriada (quem estava logado precisa entrar de novo).');
  }
}

// O inspetor define SEM_MIGRACAO=1 para olhar o banco SEM alterar nada.
if (process.env.SEM_MIGRACAO !== '1') {
  corrigirSessoesAntigas();
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));
  for (const sql of COLUNAS_NOVAS) {
    try {
      db.exec(sql);
    } catch (erro) {
      if (!String(erro.message).includes('duplicate column')) throw erro; // só ignora "coluna já existe"
    }
  }
  for (const sql of INDICES_POS) db.exec(sql);
}

/** Executa fn dentro de uma transação: ou tudo é gravado, ou nada. */
function transacao(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
}

module.exports = { db, transacao };
