import { requisicao } from './api';
import { Material } from './tipos';

/** Já vem ordenado do que mais para o que menos rende (ranking, RF013). */
export const listarMateriais = () => requisicao<Material[]>('/materiais');
