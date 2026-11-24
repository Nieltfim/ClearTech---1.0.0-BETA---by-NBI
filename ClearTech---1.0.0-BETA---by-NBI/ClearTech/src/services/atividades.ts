import { requisicao } from './api';
import { Atividade } from './tipos';

export async function listarAtividades(tipo?: 'material' | 'resgate'): Promise<Atividade[]> {
  const r = await requisicao<{ itens: Atividade[] }>(`/history${tipo ? `?tipo=${tipo}` : ''}`);
  return r.itens;
}
