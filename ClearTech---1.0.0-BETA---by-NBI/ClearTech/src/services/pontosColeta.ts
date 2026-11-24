import { requisicao } from './api';
import { PontoColeta } from './tipos';

/** Com lat/lng, vem ordenado do mais próximo para o mais distante (RF007). */
export const listarPontosColeta = (posicao?: { lat: number; lng: number }) =>
  requisicao<PontoColeta[]>(`/pontos-coleta${posicao ? `?lat=${posicao.lat}&lng=${posicao.lng}` : ''}`);
