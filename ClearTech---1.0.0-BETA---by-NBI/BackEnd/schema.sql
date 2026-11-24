-- Executado automaticamente ao iniciar o servidor (src/db.js).
-- Tudo é "IF NOT EXISTS": seguro sobre o seu database.sqlite atual (nada é apagado).
-- Colunas novas em tabelas JÁ existentes são acrescentadas por src/db.js (ALTER TABLE).
--
-- FLUXO (Documento de Requisitos RF009, RF010, RF012):
--   1. No ponto de coleta, o sistema à parte pesa o material, avalia a qualidade e chama
--      POST /coleta/entregas  ->  cria uma linha em "entregas" com os pontos JÁ CALCULADOS e um código.
--   2. O código vira um QR Code (feito pelo sistema à parte).
--   3. No app, o usuário lê o QR  ->  POST /materials/register  ->  a entrega vira "resgatada",
--      os pontos entram no saldo e nasce uma linha em "material_records" (o histórico do usuário).

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL
);

-- RN001: toda conta pertence a UMA categoria. RN002/RN003: comum = liberado; comprador = pendente até aprovação.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  senha_hash TEXT NOT NULL,
  pontos INTEGER NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'comum' CHECK (categoria IN ('comum', 'comprador')),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'aprovado', 'reprovado', 'suspenso')),
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

-- RF005/RF006/RF012/RF013: materiais e quanto valem (tabela do documento, seção RF012).
CREATE TABLE IF NOT EXISTS materiais (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  cor TEXT NOT NULL,
  pontos_por_kg INTEGER NOT NULL CHECK (pontos_por_kg >= 0),
  reciclavel INTEGER NOT NULL DEFAULT 1,
  tipo_lixo TEXT,
  como_descartar TEXT,
  ativo INTEGER NOT NULL DEFAULT 1
);

-- RF007/RF008: pontos de coleta. api_key_hash = credencial do SISTEMA À PARTE daquele ponto (só o hash é guardado).
CREATE TABLE IF NOT EXISTS pontos_coleta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  horario_funcionamento TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'indisponivel')),
  api_key_hash TEXT UNIQUE,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pontos_coleta_materiais (
  ponto_coleta_id INTEGER NOT NULL REFERENCES pontos_coleta(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL REFERENCES materiais(id),
  PRIMARY KEY (ponto_coleta_id, material_id)
);

-- A entrega pesada/avaliada no ponto. É AQUI que os pontos são calculados e o código nasce.
--   Pontos = peso líquido (kg) x valor do material (pontos/kg) x qualidade     (RF012)
-- peso em GRAMAS (inteiro) para não haver erro de arredondamento (NF011).
-- pontos_por_kg guarda o valor usado NA HORA: mudar a tabela de materiais depois não altera o passado (NF003).
CREATE TABLE IF NOT EXISTS entregas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ponto_coleta_id INTEGER NOT NULL REFERENCES pontos_coleta(id),
  material_id TEXT NOT NULL REFERENCES materiais(id),
  peso_g INTEGER NOT NULL CHECK (peso_g > 0),
  qualidade REAL NOT NULL CHECK (qualidade IN (0, 0.5, 1)),
  pontos_por_kg INTEGER NOT NULL,
  pontos INTEGER NOT NULL CHECK (pontos >= 0),
  codigo TEXT UNIQUE,                       -- conteúdo do QR Code; NULL quando recusada (0 ponto)
  status TEXT NOT NULL DEFAULT 'emitida'
    CHECK (status IN ('emitida', 'resgatada', 'expirada', 'cancelada', 'recusada')),
  emitido_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em TEXT,
  user_id INTEGER REFERENCES users(id),     -- quem resgatou (NULL até o resgate)
  resgatada_em TEXT,
  CHECK ((status = 'resgatada') = (user_id IS NOT NULL)),
  CHECK ((status = 'recusada') = (codigo IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_entregas_ponto ON entregas(ponto_coleta_id);
CREATE INDEX IF NOT EXISTS idx_entregas_user ON entregas(user_id);

-- Histórico de reciclagem do usuário (RF015). As colunas antigas (material, quantidade, local) continuam
-- como "foto" textual do momento; as novas ligam o registro à entrega.
CREATE TABLE IF NOT EXISTS material_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  codigo TEXT NOT NULL,
  material TEXT NOT NULL,
  quantidade TEXT NOT NULL,
  pontos INTEGER NOT NULL DEFAULT 0,
  local TEXT NOT NULL,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
  entrega_id INTEGER REFERENCES entregas(id),
  material_id TEXT REFERENCES materiais(id),
  peso_g INTEGER,
  qualidade REAL,
  ponto_coleta_id INTEGER REFERENCES pontos_coleta(id)
);

-- RF016/RF017/RF018: benefícios (antes fixos no código) agora gerenciáveis no banco.
CREATE TABLE IF NOT EXISTS beneficios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL,
  cor TEXT NOT NULL,
  categoria TEXT NOT NULL,
  cashback TEXT NOT NULL,
  pontos INTEGER NOT NULL CHECK (pontos > 0),
  ativo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  loja_nome TEXT NOT NULL,
  pontos INTEGER NOT NULL,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
  beneficio_id TEXT REFERENCES beneficios(id)
);

-- "Manter login": cada linha é uma sessão. Guarda só o HASH do token.
CREATE TABLE IF NOT EXISTS sessoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessoes_user ON sessoes(user_id);
CREATE INDEX IF NOT EXISTS idx_material_user ON material_records(user_id);
CREATE INDEX IF NOT EXISTS idx_material_codigo ON material_records(codigo);
CREATE INDEX IF NOT EXISTS idx_resgates_user ON reward_redemptions(user_id);

-- Dados iniciais (tabela do documento, RF012). Edite à vontade.
INSERT OR IGNORE INTO materiais (id, nome, cor, pontos_por_kg, reciclavel, tipo_lixo, como_descartar) VALUES
  ('papel',    'Papel e papelão', 'Azul',     10, 1, 'Seco reciclável', 'Mantenha seco e limpo; desmonte as caixas.'),
  ('plastico', 'Plástico',        'Vermelho', 15, 1, 'Seco reciclável', 'Enxágue as embalagens e escorra antes de entregar.'),
  ('vidro',    'Vidro',           'Verde',    15, 1, 'Seco reciclável', 'Lave e entregue inteiro; não misture com cerâmica.'),
  ('metal',    'Metal',           'Amarelo',  20, 1, 'Seco reciclável', 'Lave latas e amasse para ocupar menos espaço.'),
  ('organico', 'Orgânico',        'Marrom',    5, 1, 'Orgânico',        'Separe restos de alimentos de qualquer embalagem.'),
  ('madeira',  'Madeira',         'Preto',    10, 1, 'Madeira',         'Retire pregos e parafusos antes de entregar.');

INSERT OR IGNORE INTO beneficios (id, nome, sigla, cor, categoria, cashback, pontos) VALUES
  ('ifood',     'iFood',     'iF', '#EA1D2C', 'Alimentação', '10%', 300),
  ('amazon',    'Amazon',    'am', '#232F3E', 'Eletrônicos', '10%', 250),
  ('renner',    'Renner',    'R',  '#D71920', 'Vestuário',   '10%', 200),
  ('uber',      'Uber',      'U',  '#111111', 'Lazer',       '10%', 200),
  ('netshoes',  'Netshoes',  'N',  '#5B2A86', 'Vestuário',   '10%', 200),
  ('carrefour', 'Carrefour', 'C',  '#1D4F9C', 'Alimentação', '10%', 250);
