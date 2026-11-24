import { API_URL } from './config';
import { lerToken } from './tokenStorage';

export class ApiError extends Error {
  status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

// O AuthContext registra aqui o que fazer quando o servidor disser "sessão inválida" (401).
let aoSessaoInvalida: (() => void) | null = null;
export function registrarAoSessaoInvalida(fn: (() => void) | null) {
  aoSessaoInvalida = fn;
}

type Opcoes = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corpo?: unknown;
  /** Envia o token "Authorization: Bearer ...". Use false em login/cadastro. */
  autenticado?: boolean;
};

/** Ponto ÚNICO de comunicação com o Backend. Todas as funções de src/services passam por aqui. */
export async function requisicao<T>(caminho: string, { metodo = 'GET', corpo, autenticado = true }: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (autenticado) {
    const token = await lerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), 15000); // não deixa a tela esperando para sempre

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
  } finally {
    clearTimeout(timer);
  }

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    if (resposta.status === 401 && autenticado) aoSessaoInvalida?.();
    throw new ApiError(resposta.status, dados?.error ?? dados?.erro ?? 'Erro inesperado.');
  }
  return dados as T;
}
