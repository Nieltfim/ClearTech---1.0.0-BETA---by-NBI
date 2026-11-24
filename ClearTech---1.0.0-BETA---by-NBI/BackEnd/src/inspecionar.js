// Mostra as tabelas/colunas do SEU banco e compara com o que o código espera. Não altera nada.
//   npm run inspecionar
process.env.SEM_MIGRACAO = '1';
const { db } = require('./db');

const ESPERADO = {
  users: ['id', 'nome', 'cpf', 'telefone', 'email', 'senha_hash', 'pontos', 'categoria', 'status', 'criado_em'],
  materiais: ['id', 'nome', 'cor', 'pontos_por_kg', 'reciclavel', 'tipo_lixo', 'como_descartar', 'ativo'],
  pontos_coleta: ['id', 'nome', 'endereco', 'latitude', 'longitude', 'horario_funcionamento', 'status', 'api_key_hash'],
  pontos_coleta_materiais: ['ponto_coleta_id', 'material_id'],
  entregas: ['id', 'ponto_coleta_id', 'material_id', 'peso_g', 'qualidade', 'pontos_por_kg', 'pontos', 'codigo', 'status', 'emitido_em', 'expira_em', 'user_id', 'resgatada_em'],
  material_records: ['id', 'user_id', 'codigo', 'material', 'quantidade', 'pontos', 'local', 'criado_em', 'entrega_id', 'material_id', 'peso_g', 'qualidade', 'ponto_coleta_id'],
  beneficios: ['id', 'nome', 'sigla', 'cor', 'categoria', 'cashback', 'pontos', 'ativo'],
  reward_redemptions: ['id', 'user_id', 'loja_nome', 'pontos', 'criado_em', 'beneficio_id'],
  sessoes: ['id', 'user_id', 'token_hash', 'criado_em', 'expira_em'],
};

const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((t) => t.name);
const existente = {};
console.log('\n=== O QUE EXISTE NO SEU BANCO ===');
if (!tabelas.length) console.log('(banco vazio)');
for (const nome of tabelas) {
  const colunas = db.prepare(`PRAGMA table_info("${nome}")`).all();
  existente[nome] = colunas.map((c) => c.name);
  const total = db.prepare(`SELECT COUNT(*) AS n FROM "${nome}"`).get().n;
  console.log(`\n• ${nome}  (${total} linhas)`);
  for (const c of colunas) console.log(`    - ${c.name} ${c.type}${c.pk ? '  [PK]' : ''}`);
}

console.log('\n=== COMPARAÇÃO COM O QUE O CÓDIGO ESPERA ===');
let pend = 0;
for (const [tabela, cols] of Object.entries(ESPERADO)) {
  if (!existente[tabela]) { pend++; console.log(`• "${tabela}" ainda NÃO existe (será criada ao iniciar o servidor).`); continue; }
  const faltam = cols.filter((c) => !existente[tabela].includes(c));
  if (faltam.length) { pend++; console.log(`! "${tabela}": faltam as colunas ${faltam.join(', ')} (serão acrescentadas ao iniciar o servidor).`); }
  else console.log(`✔ "${tabela}" compatível.`);
}
const OBSOLETAS = ['usuarios', 'atividades', 'codigos_coleta', 'lojas'];
const sobras = OBSOLETAS.filter((n) => existente[n]);
if (sobras.length) {
  console.log('\n=== SOBRAS DE VERSÕES ANTERIORES (o código atual não usa) ===');
  for (const n of sobras) console.log(`• ${n}  (${db.prepare(`SELECT COUNT(*) AS n FROM "${n}"`).get().n} linhas)`);
  console.log('Pode removê-las com:  npm run cli -- limpar-obsoletas   (primeiro só mostra; para apagar, acrescente --confirmar)');
}
console.log(pend ? '\nTudo isso é criado/atualizado automaticamente ao iniciar o servidor. Nada é apagado.' : '\nTudo compatível.');
