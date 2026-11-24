const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);

/** Mesmo formato do seu server antigo: "<sal em hex>:<hash em hex>". Usuários já cadastrados continuam entrando. */
async function hashSenha(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  const chave = (await scrypt(senha, sal, 64)).toString('hex');
  return `${sal}:${chave}`;
}

async function confereSenha(senha, guardado) {
  const partes = String(guardado || '').split(':');
  if (partes.length !== 2) return false;
  const [sal, originalHex] = partes;
  const original = Buffer.from(originalHex, 'hex');
  const calculado = await scrypt(String(senha), sal, 64);
  if (calculado.length !== original.length) return false;
  return crypto.timingSafeEqual(calculado, original);
}

/** Token de login: 256 bits aleatórios. Vai para o celular; no banco fica só o hash. */
const novoToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (valor) => crypto.createHash('sha256').update(String(valor)).digest('hex');

/** Chave de API do sistema do ponto de coleta (mostrada UMA vez; no banco fica só o hash). */
const novaChaveApi = () => `ctp_${crypto.randomBytes(24).toString('hex')}`;

// Alfabeto sem I, L, O, U (evita confusão ao ler/digitar). 12 símbolos = 60 bits: impraticável de adivinhar.
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function novoCodigoEntrega() {
  let s = '';
  for (let i = 0; i < 12; i++) s += ALFABETO[crypto.randomInt(ALFABETO.length)];
  return `CT-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

module.exports = { hashSenha, confereSenha, novoToken, hashToken, novaChaveApi, novoCodigoEntrega };
