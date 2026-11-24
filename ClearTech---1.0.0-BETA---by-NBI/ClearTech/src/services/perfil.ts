import { requisicao } from './api';
import { Usuario } from './tipos';

export const buscarPerfil = () => requisicao<Usuario>('/dashboard');

export async function atualizarPerfil(dados: { nome: string; telefone: string; email: string }): Promise<Usuario> {
  const { message, ...usuario } = await requisicao<Usuario & { message: string }>('/profile', { metodo: 'PUT', corpo: dados });
  return usuario;
}
