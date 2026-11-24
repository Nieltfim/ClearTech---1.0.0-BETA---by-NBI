/**
 * Regras de negócio + SQL.
 *
 * Princípios (Documento de Requisitos: NF001, NF003, NF011, NF012):
 *   - o usuário vem do TOKEN; o ponto de coleta vem da CHAVE DE API; nunca de dados enviados no corpo;
 *   - os PONTOS são calculados no servidor, pela fórmula do RF012, no momento da entrega no ponto;
 *   - cada código de QR vale UMA vez e expira;
 *   - saldo nunca fica negativo e nada é gravado pela metade (transações).
 */
const { db, transacao } = require('./db');
const { hashSenha, confereSenha, novoToken, hashToken, novaChaveApi, novoCodigoEntrega } = require('./seguranca');

const DIAS_SESSAO = 30;
const DIAS_VALIDADE_CODIGO = 7; // depois disso o QR expira e o ponto precisa emitir outro (RS010)
const PESO_MAXIMO_KG = 1000;

class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

const soDigitos = (v) => String(v ?? '').replace(/\D/g, '');
const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const nomeComSobrenome = (n) => n.split(/\s+/).filter(Boolean).length >= 2;
const normalizar = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function cpfValido(cpf) {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (base) => {
    let soma = 0;
    for (let i = 0; i < base; i++) soma += Number(d[i]) * (base + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

const usuarioPublico = (u) => ({
  id: Number(u.id),
  nome: u.nome,
  cpf: u.cpf,
  telefone: u.telefone,
  email: u.email || '',
  pontos: Number(u.pontos ?? 0),
  categoria: u.categoria || 'comum',
});

// RN010: acúmulo de pontos e resgate são exclusivos do Usuário Comum.
function exigirUsuarioComum(user) {
  if ((user.categoria || 'comum') !== 'comum') throw new ErroApi(403, 'Funcionalidade exclusiva do Usuário Comum.');
}

// =====================================================================
// Sessão ("manter login")
// =====================================================================
function criarSessao(userId) {
  const token = novoToken();
  db.prepare(`INSERT INTO sessoes (user_id, token_hash, expira_em) VALUES (?, ?, datetime('now', ?))`)
    .run(userId, hashToken(token), `+${DIAS_SESSAO} days`);
  return token;
}

/** Descobre QUEM está logado a partir do token. Devolve a linha de users ou null. */
function usuarioPorToken(token) {
  if (!token) return null;
  return (
    db.prepare(
      `SELECT u.* FROM sessoes s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expira_em > datetime('now')`,
    ).get(hashToken(token)) ?? null
  );
}

const encerrarSessao = (token) => db.prepare('DELETE FROM sessoes WHERE token_hash = ?').run(hashToken(token));

function manutencao() {
  db.prepare(`DELETE FROM sessoes WHERE expira_em <= datetime('now')`).run();
  db.prepare(`UPDATE entregas SET status = 'expirada' WHERE status = 'emitida' AND expira_em <= datetime('now')`).run();
}

// =====================================================================
// Conta: /auth/register, /auth/login, /auth/forgot-password, /profile
// =====================================================================
async function cadastrar({ nome, cpf, telefone, senha }) {
  const cleanNome = typeof nome === 'string' ? nome.trim() : '';
  const cleanCpf = soDigitos(cpf);
  const cleanTelefone = soDigitos(telefone);
  if (!nomeComSobrenome(cleanNome)) throw new ErroApi(400, 'Informe nome e sobrenome.');
  if (!cpfValido(cleanCpf)) throw new ErroApi(400, 'CPF inválido.');
  if (cleanTelefone.length < 10) throw new ErroApi(400, 'Informe um telefone com DDD.');
  if (typeof senha !== 'string' || senha.length < 8) throw new ErroApi(400, 'A senha precisa ter ao menos 8 caracteres.');
  if (db.prepare('SELECT 1 FROM users WHERE cpf = ?').get(cleanCpf)) throw new ErroApi(409, 'Este CPF já está cadastrado.');

  // RN001/RN002: o cadastro pelo app cria Usuário Comum, liberado na hora.
  const r = db.prepare('INSERT INTO users (nome, cpf, telefone, senha_hash) VALUES (?, ?, ?, ?)')
    .run(cleanNome, cleanCpf, cleanTelefone, await hashSenha(senha));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(r.lastInsertRowid));
  return { token: criarSessao(user.id), ...usuarioPublico(user) };
}

async function login({ usuario, senha }) {
  const entrada = typeof usuario === 'string' ? usuario.trim() : '';
  if (!entrada || typeof senha !== 'string' || !senha) throw new ErroApi(400, 'Informe usuário/CPF e senha.');

  const digitos = soDigitos(entrada);
  // CPF (11 dígitos) é o identificador. Login por nome (RF003) só vale se NINGUÉM mais tiver o mesmo nome.
  const candidatos =
    digitos.length === 11
      ? db.prepare('SELECT * FROM users WHERE cpf = ?').all(digitos)
      : db.prepare('SELECT * FROM users WHERE LOWER(nome) = LOWER(?)').all(entrada);
  const user = candidatos.length === 1 ? candidatos[0] : null;

  if (!user || !(await confereSenha(senha, user.senha_hash))) throw new ErroApi(401, 'CPF/usuário ou senha inválidos.');
  return { token: criarSessao(user.id), ...usuarioPublico(user) };
}

function esqueciSenha({ cpf }) {
  if (soDigitos(cpf).length !== 11) throw new ErroApi(400, 'CPF inválido.');
  // TODO (RF020/RS020): gerar código de uso único, enviar por SMS ao telefone cadastrado, validar e trocar a senha.
  return { message: 'Se o CPF estiver cadastrado, as instruções serão enviadas.' };
}

function atualizarPerfil(userId, { nome, telefone, email }) {
  const cleanNome = typeof nome === 'string' ? nome.trim() : '';
  const cleanTelefone = soDigitos(telefone);
  const cleanEmail = typeof email === 'string' ? email.trim() : '';
  if (!nomeComSobrenome(cleanNome)) throw new ErroApi(400, 'Informe nome e sobrenome.');
  if (cleanTelefone.length < 10) throw new ErroApi(400, 'Informe um telefone com DDD.');
  if (cleanEmail && !emailValido(cleanEmail)) throw new ErroApi(400, 'E-mail inválido.');
  db.prepare('UPDATE users SET nome = ?, telefone = ?, email = ? WHERE id = ?').run(cleanNome, cleanTelefone, cleanEmail, userId);
  return { message: 'Perfil atualizado com sucesso!', ...usuarioPublico(db.prepare('SELECT * FROM users WHERE id = ?').get(userId)) };
}

// =====================================================================
// Consultas públicas do app: materiais (RF005/RF013) e pontos de coleta (RF007/RF008)
// =====================================================================
const listarMateriais = () =>
  db.prepare(
    `SELECT id, nome, cor, pontos_por_kg, reciclavel, tipo_lixo, como_descartar
     FROM materiais WHERE ativo = 1 ORDER BY pontos_por_kg DESC, nome`,
  ).all().map((m) => ({ ...m, reciclavel: Boolean(m.reciclavel) })); // já ordenado = ranking (RF013)

function distanciaKm(lat1, lon1, lat2, lon2) {
  const rad = (g) => (g * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function listarPontosColeta({ lat, lng } = {}) {
  const la = Number(lat), lo = Number(lng);
  const temPosicao = lat !== undefined && lng !== undefined && Number.isFinite(la) && Number.isFinite(lo);
  const lista = db.prepare(
    `SELECT id, nome, endereco, latitude, longitude, horario_funcionamento, status FROM pontos_coleta ORDER BY nome`,
  ).all().map((p) => {
    const materiais = db.prepare(
      `SELECT m.nome FROM pontos_coleta_materiais pm JOIN materiais m ON m.id = pm.material_id
       WHERE pm.ponto_coleta_id = ? AND m.ativo = 1 ORDER BY m.nome`,
    ).all(p.id).map((m) => m.nome);
    const distancia_km =
      temPosicao && p.latitude != null && p.longitude != null
        ? Math.round(distanciaKm(la, lo, p.latitude, p.longitude) * 10) / 10
        : null;
    return { ...p, id: Number(p.id), materiais_aceitos: materiais, distancia_km };
  });
  if (temPosicao) lista.sort((a, b) => (a.distancia_km ?? Infinity) - (b.distancia_km ?? Infinity));
  return lista;
}

// =====================================================================
// SISTEMA À PARTE (ponto de coleta): emitir / consultar / cancelar entrega
// =====================================================================

/** Pontos = peso líquido (kg) x valor do material (pontos/kg) x qualidade. Arredonda para o inteiro mais próximo. */
function calcularPontos(pesoG, pontosPorKg, qualidade) {
  return Math.round((pesoG * pontosPorKg * qualidade) / 1000);
}

function lerQualidade(valor) {
  const t = normalizar(String(valor ?? '')).replace(',', '.');
  if (['1', '1.0', 'limpo', 'correto'].includes(t)) return 1;
  if (['0.5', 'parcial', 'contaminado', 'parcialmente contaminado'].includes(t)) return 0.5;
  if (['0', '0.0', 'inadequado'].includes(t)) return 0;
  throw new ErroApi(400, 'Qualidade inválida. Use 1 (limpo), 0.5 (parcialmente contaminado) ou 0 (inadequado).');
}

function lerPesoG(pesoKg) {
  const kg = Number(String(pesoKg ?? '').replace(',', '.'));
  if (!Number.isFinite(kg) || kg <= 0) throw new ErroApi(400, 'Peso inválido: informe o peso líquido em kg, maior que zero.');
  if (kg > PESO_MAXIMO_KG) throw new ErroApi(400, `Peso acima do limite de ${PESO_MAXIMO_KG} kg por entrega.`);
  const g = Math.round(kg * 1000);
  if (g < 1) throw new ErroApi(400, 'Peso muito pequeno.');
  return g;
}

function acharMaterial(valor) {
  const alvo = normalizar(valor);
  if (!alvo) return null;
  return db.prepare('SELECT * FROM materiais WHERE ativo = 1').all().find((m) => normalizar(m.id) === alvo || normalizar(m.nome) === alvo) ?? null;
}

const kgTexto = (pesoG) => `${String(pesoG / 1000).replace('.', ',')} kg`;

function formatarEntrega(e, extra = {}) {
  return {
    id: Number(e.id),
    codigo: e.codigo,
    qr: e.codigo, // é este texto que o sistema à parte transforma em QR Code
    status: e.status,
    material: e.material_nome ?? e.material,
    peso_kg: e.peso_g / 1000,
    qualidade: e.qualidade,
    pontos_por_kg: Number(e.pontos_por_kg),
    pontos: Number(e.pontos),
    emitido_em: e.emitido_em,
    expira_em: e.expira_em,
    ...extra,
  };
}

const entregaDoPonto = (pontoId, id) =>
  db.prepare(
    `SELECT e.*, m.nome AS material_nome FROM entregas e JOIN materiais m ON m.id = e.material_id
     WHERE e.id = ? AND e.ponto_coleta_id = ?`,
  ).get(Number(id), pontoId);

function emitirEntrega(ponto, { material, peso_kg, qualidade } = {}) {
  const mat = acharMaterial(material);
  if (!mat) throw new ErroApi(404, 'Material não cadastrado.');
  if (!db.prepare('SELECT 1 FROM pontos_coleta_materiais WHERE ponto_coleta_id = ? AND material_id = ?').get(ponto.id, mat.id)) {
    throw new ErroApi(400, 'Este ponto de coleta não recebe este material.');
  }
  const pesoG = lerPesoG(peso_kg);
  const fator = lerQualidade(qualidade);
  const pontos = calcularPontos(pesoG, mat.pontos_por_kg, fator);

  // RS012 (alt. 1): sem pontuação -> não há o que resgatar. Fica registrado como "recusada", sem código.
  if (pontos === 0) {
    const r = db.prepare(
      `INSERT INTO entregas (ponto_coleta_id, material_id, peso_g, qualidade, pontos_por_kg, pontos, status)
       VALUES (?, ?, ?, ?, ?, 0, 'recusada')`,
    ).run(ponto.id, mat.id, pesoG, fator, mat.pontos_por_kg);
    return formatarEntrega(entregaDoPonto(ponto.id, Number(r.lastInsertRowid)), {
      mensagem: 'Material inadequado para reciclagem: nenhum ponto atribuído e nenhum código gerado.',
    });
  }

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    try {
      const r = db.prepare(
        `INSERT INTO entregas (ponto_coleta_id, material_id, peso_g, qualidade, pontos_por_kg, pontos, codigo, expira_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`,
      ).run(ponto.id, mat.id, pesoG, fator, mat.pontos_por_kg, pontos, novoCodigoEntrega(), `+${DIAS_VALIDADE_CODIGO} days`);
      return formatarEntrega(entregaDoPonto(ponto.id, Number(r.lastInsertRowid)), { ponto_coleta: ponto.nome });
    } catch (erro) {
      if (!String(erro.message).includes('UNIQUE constraint failed: entregas.codigo')) throw erro; // colisão: sorteia outro código
    }
  }
  throw new ErroApi(500, 'Não foi possível gerar um código único. Tente novamente.');
}

function consultarEntrega(ponto, id) {
  const e = entregaDoPonto(ponto.id, id);
  if (!e) throw new ErroApi(404, 'Entrega não encontrada.');
  if (e.status === 'emitida' && e.expira_em <= db.prepare(`SELECT datetime('now') AS agora`).get().agora) e.status = 'expirada';
  return formatarEntrega(e, { resgatada_em: e.resgatada_em ?? null });
}

function cancelarEntrega(ponto, id) {
  const e = entregaDoPonto(ponto.id, id);
  if (!e) throw new ErroApi(404, 'Entrega não encontrada.');
  const r = db.prepare(`UPDATE entregas SET status = 'cancelada' WHERE id = ? AND status = 'emitida'`).run(e.id);
  if (Number(r.changes) === 0) throw new ErroApi(409, 'Só é possível cancelar códigos ainda não resgatados.');
  return { ok: true, id: Number(e.id), status: 'cancelada' };
}

function pontoPorChave(chave) {
  if (!chave) return null;
  return db.prepare(`SELECT * FROM pontos_coleta WHERE api_key_hash = ? AND status = 'ativo'`).get(hashToken(chave)) ?? null;
}

/** Cria um ponto de coleta e sua chave de API (devolvida UMA vez). Por padrão aceita todos os materiais ativos. */
function criarPontoColeta({ nome, endereco, latitude = null, longitude = null, horario = null }) {
  if (!nome || !endereco) throw new ErroApi(400, 'Informe nome e endereço do ponto de coleta.');
  const chave = novaChaveApi();
  return transacao(() => {
    const r = db.prepare(
      `INSERT INTO pontos_coleta (nome, endereco, latitude, longitude, horario_funcionamento, api_key_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(nome, endereco, latitude, longitude, horario, hashToken(chave));
    const id = Number(r.lastInsertRowid);
    for (const m of db.prepare('SELECT id FROM materiais WHERE ativo = 1').all()) {
      db.prepare('INSERT INTO pontos_coleta_materiais (ponto_coleta_id, material_id) VALUES (?, ?)').run(id, m.id);
    }
    return { id, nome, api_key: chave };
  });
}

// =====================================================================
// APP: resgatar o código do QR  (POST /materials/register)
// =====================================================================

/** "ct 7k2m-9qx4 hd3f", "CT7K2M9QX4HD3F" ... -> "CT-7K2M-9QX4-HD3F". */
function normalizarCodigo(bruto) {
  const s = String(bruto ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^CT[0-9A-Z]{12}$/.test(s) ? `CT-${s.slice(2, 6)}-${s.slice(6, 10)}-${s.slice(10, 14)}` : s;
}

function registrarMaterial(user, codigoBruto) {
  exigirUsuarioComum(user);
  if (typeof codigoBruto !== 'string' || codigoBruto.trim().length < 4) throw new ErroApi(400, 'Código inválido.');
  const codigo = normalizarCodigo(codigoBruto);

  const e = db.prepare(
    `SELECT e.*, m.nome AS material_nome, e.local AS ponto_nome,
            e.usado_em <= datetime('now') AS vencida, e.pontos AS pontuacao
     FROM codigos_coleta e
     WHERE e.codigo = ?`,
  ).get(codigo);

  if (!e) throw new ErroApi(404, 'Código inválido ou não encontrado.');
  if (e.status === 'resgatada') throw new ErroApi(409, 'Este código já foi utilizado.');
  if (e.status === 'cancelada') throw new ErroApi(410, 'Este código foi cancelado. Solicite um novo no ponto de coleta.');
  if (e.status === 'expirada' || Number(e.vencida) === 1) {
    if (e.status === 'emitida') db.prepare(`UPDATE entregas SET status = 'expirada' WHERE id = ? AND status = 'emitida'`).run(e.id);
    throw new ErroApi(410, 'Este código expirou. Solicite um novo no ponto de coleta.');
  }

  return transacao(() => {
    // O "AND status = 'emitida'" faz só UM resgate vencer, mesmo com dois celulares lendo o mesmo QR ao mesmo tempo.
    const r = db.prepare(
      `UPDATE entregas SET status = 'resgatada', user_id = ?, resgatada_em = datetime('now')
       WHERE id = ? AND status = 'emitida' AND expira_em > datetime('now')`,
    ).run(user.id, e.id);
    if (Number(r.changes) === 0) throw new ErroApi(409, 'Este código já foi utilizado.');

    db.prepare('UPDATE users SET pontos = pontos + ? WHERE id = ?').run(e.pontos, user.id);
    const reg = db.prepare(
      `INSERT INTO material_records
         (user_id, codigo, material, quantidade, pontos, local, entrega_id, material_id, peso_g, qualidade, ponto_coleta_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(user.id, codigo, e.material_nome, kgTexto(e.peso_g), e.pontos, e.ponto_nome, e.id, e.material_id, e.peso_g, e.qualidade, e.ponto_coleta_id);
    const total = Number(db.prepare('SELECT pontos FROM users WHERE id = ?').get(user.id).pontos);

    return {
      id: Number(reg.lastInsertRowid),
      codigo,
      material: e.material_nome,
      quantidade: kgTexto(e.peso_g),
      pontos: String(e.pontos),
      pontosGanhos: Number(e.pontos),
      totalPontos: total,
      local: e.ponto_nome,
      qualidade: e.qualidade,
    };
  });
}

// =====================================================================
// Benefícios e resgate de cashback  (/lojas, /rewards/redeem)
// =====================================================================
const listarBeneficios = () =>
  db.prepare('SELECT id, nome, sigla, cor, categoria, cashback, pontos FROM beneficios WHERE ativo = 1 ORDER BY nome').all();

function resgatar(user, { lojaId, lojaNome } = {}) {
  exigirUsuarioComum(user);
  const b = db.prepare('SELECT * FROM beneficios').all().find(
    (x) => (lojaId && x.id === String(lojaId)) || (lojaNome && normalizar(x.nome) === normalizar(lojaNome)),
  );
  if (!b) throw new ErroApi(404, 'Benefício não encontrado.');
  if (!b.ativo) throw new ErroApi(409, 'Este benefício está indisponível no momento.');

  return transacao(() => {
    // "AND pontos >= ?": o saldo nunca fica negativo, nem com dois pedidos simultâneos. O custo vem do BANCO, não do app.
    const r = db.prepare('UPDATE users SET pontos = pontos - ? WHERE id = ? AND pontos >= ?').run(b.pontos, user.id, b.pontos);
    const atual = Number(db.prepare('SELECT pontos FROM users WHERE id = ?').get(user.id).pontos);
    if (Number(r.changes) === 0) throw new ErroApi(400, `Pontos insuficientes. Você tem ${atual} pontos e precisa de ${b.pontos}.`);
    db.prepare('INSERT INTO reward_redemptions (user_id, loja_nome, pontos, beneficio_id) VALUES (?, ?, ?, ?)').run(user.id, b.nome, b.pontos, b.id);
    return { message: 'Resgate efetuado com sucesso!', loja: b.nome, pontosDescontados: Number(b.pontos), saldoAtual: atual };
  });
}

// =====================================================================
// Histórico (RF015)  (/history)
// =====================================================================
function historico(userId, tipo) {
  if (tipo && !['material', 'resgate'].includes(tipo)) throw new ErroApi(400, 'Filtro inválido.');
  const materiais = tipo === 'resgate' ? [] : db.prepare(
    'SELECT id, material, quantidade, pontos, local, criado_em FROM material_records WHERE user_id = ? ORDER BY id DESC',
  ).all(userId);
  const resgates = tipo === 'material' ? [] : db.prepare(
    'SELECT id, loja_nome, pontos, criado_em FROM reward_redemptions WHERE user_id = ? ORDER BY id DESC',
  ).all(userId);

  const itens = [
    ...materiais.map((m) => ({
      id: `mat-${m.id}`, tipo: 'material',
      descricao: `${m.material} (${m.quantidade}) - ${m.local}`,
      data: m.criado_em || '', pontos: Math.abs(Number(m.pontos ?? 0)), ordem: Number(m.id),
    })),
    ...resgates.map((r) => ({
      id: `res-${r.id}`, tipo: 'resgate',
      descricao: `Resgate em ${r.loja_nome}`,
      data: r.criado_em || '', pontos: -Math.abs(Number(r.pontos ?? 0)), ordem: Number(r.id),
    })),
  ].sort((a, b) => (a.data !== b.data ? String(b.data).localeCompare(String(a.data)) : b.ordem - a.ordem));
  return { itens };
}

module.exports = {
  ErroApi, cpfValido, usuarioPublico, calcularPontos, normalizarCodigo,
  usuarioPorToken, encerrarSessao, manutencao,
  cadastrar, login, esqueciSenha, atualizarPerfil,
  listarMateriais, listarPontosColeta,
  emitirEntrega, consultarEntrega, cancelarEntrega, pontoPorChave, criarPontoColeta,
  registrarMaterial, listarBeneficios, resgatar, historico,
};
