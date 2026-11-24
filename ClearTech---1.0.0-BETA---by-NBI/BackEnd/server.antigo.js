const express = require('express');
const cors = require('cors');
const s = require('./servicos');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Express 4 não captura erros de funções async sozinho; este wrapper repassa para o tratador de erros.
const rota = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

/** Lê "Authorization: Bearer <token>", descobre o usuário e o coloca em req.usuario. */
function autenticar(req, res, next) {
  const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
  const usuario = tipo === 'Bearer' ? s.usuarioPorToken(token) : null;
  if (!usuario) return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
  req.usuario = usuario;
  req.token = token;
  next();
}

// Limite simples de tentativas de login (em memória): 20 a cada 15 min por IP.
const tentativas = new Map();
function limitarLogin(req, res, next) {
  const agora = Date.now();
  const recentes = (tentativas.get(req.ip) ?? []).filter((t) => agora - t < 15 * 60 * 1000);
  if (recentes.length >= 20) return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos.' });
  recentes.push(agora);
  tentativas.set(req.ip, recentes);
  next();
}

// ---- Públicas ----
app.get('/saude', (req, res) => res.json({ ok: true }));
app.post('/auth/cadastro', limitarLogin, rota(async (req, res) => res.status(201).json(await s.cadastrar(req.body ?? {}))));
app.post('/auth/login', limitarLogin, rota(async (req, res) => res.json(await s.login(req.body ?? {}))));
app.post('/auth/esqueci-senha', limitarLogin, rota(async (req, res) => res.json(s.esqueciSenha(req.body ?? {}))));

// ---- Protegidas (exigem token) ----
app.post('/auth/logout', autenticar, rota(async (req, res) => { s.encerrarSessao(req.token); res.json({ ok: true }); }));
app.get('/me', autenticar, rota(async (req, res) => res.json(s.usuarioPublico(req.usuario))));
app.put('/me', autenticar, rota(async (req, res) => res.json(s.atualizarPerfil(req.usuario.id, req.body ?? {}))));
app.get('/atividades', autenticar, rota(async (req, res) => res.json(s.listarAtividades(req.usuario.id, req.query.tipo))));
app.get('/lojas', autenticar, rota(async (req, res) => res.json(s.listarLojas())));
app.post('/lojas/:id/resgatar', autenticar, rota(async (req, res) => res.json(s.resgatar(req.usuario.id, req.params.id))));
app.post('/registros', autenticar, rota(async (req, res) => res.json(s.registrarMaterial(req.usuario.id, req.body?.codigo))));

// ---- Tratador de erros (4 parâmetros) ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof s.ErroApi) return res.status(err.status).json({ erro: err.message });
  if (String(err?.code).startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ erro: 'Registro duplicado.' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

module.exports = app;

if (require.main === module) {
  s.limparSessoesExpiradas();
  const PORT = Number(process.env.PORT) || 3000;
  // 0.0.0.0 = aceita conexões do celular na mesma rede (não só do próprio PC)
  app.listen(PORT, '0.0.0.0', () => console.log(`API ClearTech em http://0.0.0.0:${PORT}`));
}
