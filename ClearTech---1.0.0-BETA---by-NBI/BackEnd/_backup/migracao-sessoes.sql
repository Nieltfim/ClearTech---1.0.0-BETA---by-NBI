-- Para quem JÁ TEM banco: cria apenas a tabela que o "manter login" precisa.
-- Não altera nem apaga nada que já exista (IF NOT EXISTS).
-- Pré-requisito: a tabela "usuarios" com coluna "id" (ajuste o REFERENCES se o nome for outro).
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessoes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT    NOT NULL UNIQUE,
  criado_em  TEXT    NOT NULL DEFAULT (datetime('now')),
  expira_em  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
