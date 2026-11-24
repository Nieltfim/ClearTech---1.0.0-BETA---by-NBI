import { ApiError, requisicao } from './api';
import { apagarToken, lerToken, salvarToken } from './tokenStorage';
import { DadosCadastro, Usuario } from './tipos';

// O servidor devolve os dados do usuário "soltos", junto com o token.
type RespostaAuth = Usuario & { token: string };

export async function login(identificador: string, senha: string): Promise<Usuario> {
  const { token, ...usuario } = await requisicao<RespostaAuth>('/auth/login', {
    metodo: 'POST',
    corpo: { usuario: identificador, senha },
    autenticado: false,
  });
  await salvarToken(token); // <- é isto que "mantém o login"
  return usuario;
}

export async function cadastrar(dados: DadosCadastro): Promise<Usuario> {
  const { token, ...usuario } = await requisicao<RespostaAuth>('/auth/register', {
    metodo: 'POST',
    corpo: dados,
    autenticado: false,
  });
  await salvarToken(token);
  return usuario;
}

export async function esqueciSenha(cpf: string): Promise<void> {
  await requisicao('/auth/forgot-password', { metodo: 'POST', corpo: { cpf }, autenticado: false });
}

export async function sair(): Promise<void> {
  try {
    await requisicao('/auth/logout', { metodo: 'POST' }); // invalida o token no servidor
  } catch {
    // sem rede? ainda assim apagamos o token local
  }
  await apagarToken();
}

/** Chamada na abertura do app: se há token salvo e ele ainda vale, devolve o usuário logado. */
export async function carregarUsuarioSalvo(): Promise<Usuario | null> {
  const token = await lerToken();
  if (!token) return null;
  try {
    return await requisicao<Usuario>('/dashboard');
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      await apagarToken(); // token expirado/revogado
      return null;
    }
    throw e; // sem rede etc.: mantém o token e tenta de novo na próxima abertura
  }
}
