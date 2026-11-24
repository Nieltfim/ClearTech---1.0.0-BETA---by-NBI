const express = require('express');
const cors = require('cors');
const { db } = require('./db');
const s = require('./servicos');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Express 4 não captura erros de funções async sozinho; este wrapper os repassa ao tratador de erros.
const rota = (fn) => (req, res, next) => Promise.resolve().then(() => fn(req, res)).catch(next);

/** APP: lê "Authorization: Bearer <token>", descobre o usuário e o coloca em req.usuario. */
function autenticar(req, res, next) {
  const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
  const usuario = tipo === 'Bearer' ? s.usuarioPorToken(token) : null;
  if (!usuario) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  req.usuario = usuario;
  req.token = token;
  next();
}

/** SISTEMA À PARTE: lê "X-Api-Key", descobre o ponto de coleta e o coloca em req.ponto. */
function autenticarPonto(req, res, next) {
  const ponto = s.pontoPorChave(String(req.headers['x-api-key'] ?? ''));
  if (!ponto) return res.status(401).json({ error: 'Chave de API inválida.' });
  req.ponto = ponto;
  next();
}

// Limitador simples em memória (por IP). Cada rota tem o seu próprio contador.
function criarLimitador(max, janelaMs) {
  const mapa = new Map();
  return (req, res, next) => {
    const agora = Date.now();
    const recentes = (mapa.get(req.ip) ?? []).filter((t) => agora - t < janelaMs);
    if (recentes.length >= max) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
    recentes.push(agora);
    mapa.set(req.ip, recentes);
    next();
  };
}
const limitarConta = criarLimitador(20, 15 * 60 * 1000);   // login / cadastro / esqueci senha
const limitarCodigo = criarLimitador(30, 15 * 60 * 1000);  // dificulta adivinhar códigos de QR
const limitarPonto = criarLimitador(600, 15 * 60 * 1000);

// ======== PÚBLICAS ========
app.get('/saude', (req, res) => res.json({ ok: true }));

// (rotas de exemplo do seu servidor antigo; sem login. Pode remover quando não usar mais.)
app.get('/tasks', (req, res) => res.json(db.prepare('SELECT id, title FROM tasks ORDER BY id DESC').all()));
app.post('/tasks', (req, res) => {
  const { title } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'O título é obrigatório.' });
  const r = db.prepare('INSERT INTO tasks (title) VALUES (?)').run(title.trim());
  res.status(201).json({ id: Number(r.lastInsertRowid), title: title.trim() });
});

app.post('/auth/register', limitarConta, rota(async (req, res) => res.status(201).json(await s.cadastrar(req.body ?? {}))));
app.post('/auth/login', limitarConta, rota(async (req, res) => res.json(await s.login(req.body ?? {}))));
app.post('/auth/forgot-password', limitarConta, rota(async (req, res) => res.json(s.esqueciSenha(req.body ?? {}))));

// ======== APP (exigem token do usuário) ========
app.post('/auth/logout', autenticar, rota(async (req, res) => { s.encerrarSessao(req.token); res.json({ ok: true }); }));
app.get('/dashboard', autenticar, rota(async (req, res) => res.json(s.usuarioPublico(req.usuario))));
app.put('/profile', autenticar, rota(async (req, res) => res.json(s.atualizarPerfil(req.usuario.id, req.body ?? {}))));
app.get('/materiais', autenticar, rota(async (req, res) => res.json(s.listarMateriais())));
app.get('/pontos-coleta', autenticar, rota(async (req, res) => res.json(s.listarPontosColeta(req.query))));
app.post('/materials/register', limitarCodigo, autenticar, rota(async (req, res) => res.status(201).json(s.registrarMaterial(req.usuario, req.body?.codigo))));
app.get('/lojas', autenticar, rota(async (req, res) => res.json(s.listarBeneficios())));
app.post('/rewards/redeem', autenticar, rota(async (req, res) => res.json(s.resgatar(req.usuario, req.body ?? {}))));
app.get('/history', autenticar, rota(async (req, res) => res.json(s.historico(req.usuario.id, req.query.tipo))));

// ======== SISTEMA À PARTE DO PONTO DE COLETA (exigem X-Api-Key) ========
app.post('/coleta/entregas', limitarPonto, autenticarPonto, rota(async (req, res) => res.status(201).json(s.emitirEntrega(req.ponto, req.body ?? {}))));
app.get('/coleta/entregas/:id', autenticarPonto, rota(async (req, res) => res.json(s.consultarEntrega(req.ponto, req.params.id))));
app.post('/coleta/entregas/:id/cancelar', autenticarPonto, rota(async (req, res) => res.json(s.cancelarEntrega(req.ponto, req.params.id))));

// ======== Tratador de erros (4 parâmetros) ========
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof s.ErroApi) return res.status(err.status).json({ error: err.message });
  if (String(err?.message).includes('UNIQUE constraint failed')) return res.status(409).json({ error: 'Registro duplicado.' });
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;

if (require.main === module) {
  s.manutencao();
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));
}
