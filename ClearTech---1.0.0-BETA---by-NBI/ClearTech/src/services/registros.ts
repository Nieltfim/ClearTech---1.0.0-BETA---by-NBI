import { requisicao } from './api';
import { ResultadoRegistro } from './tipos';

/**
 * Resgata o código lido no QR Code. O app envia APENAS o código:
 * peso, material, qualidade e pontos já foram definidos no ponto de coleta.
 */
export const registrarMaterial = (codigo: string) =>
  requisicao<ResultadoRegistro>('/materials/register', { metodo: 'POST', corpo: { codigo } });
