import { requisicao } from './api';
import { Loja } from './tipos';

export const listarLojas = () => requisicao<Loja[]>('/lojas');

/** O custo em pontos é decidido pelo servidor; o app só diz QUAL benefício. */
export const resgatarLoja = (lojaId: string) =>
  requisicao<{ message: string; loja: string; pontosDescontados: number; saldoAtual: number }>('/rewards/redeem', {
    metodo: 'POST',
    corpo: { lojaId },
  });
