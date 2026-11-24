const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('../BackEnd/database.sqlite', (err) => {
  if (err) {
    console.error('Erro ao conectar ao SQLite:', err.message);
    return;
  }
  console.log('Conectado ao banco SQLite com sucesso.');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    )
  `);
});

module.exports = db;
