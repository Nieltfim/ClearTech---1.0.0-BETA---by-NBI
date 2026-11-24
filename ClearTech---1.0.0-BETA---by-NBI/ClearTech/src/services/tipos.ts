export type Usuario = {
  id: number;
  nome: string;
  cpf: string; // só dígitos
  telefone: string;
  email: string;
  pontos: number;
  categoria: 'comum' | 'comprador';
};

export type Atividade = {
  id: string; // "mat-12" ou "res-3"
  tipo: 'material' | 'resgate';
  descricao: string;
  data: string; // "2026-11-20 14:32:00" (UTC)
  pontos: number; // positivo = ganhou, negativo = gastou
};

export type Loja = {
  id: string;
  nome: string;
  sigla: string;
  cor: string;
  categoria: string;
  cashback: string;
  pontos: number;
};

/** Resposta do resgate do QR Code. Tudo vem do ponto de coleta (peso, material, qualidade, pontos). */
export type ResultadoRegistro = {
  id: number;
  codigo: string;
  material: string;
  quantidade: string; // ex.: "2,5 kg"
  pontos: string;
  pontosGanhos: number;
  totalPontos: number;
  local: string;
  qualidade: number; // 1, 0.5 ou 0
};

export type Material = {
  id: string;
  nome: string;
  cor: string;
  pontos_por_kg: number;
  reciclavel: boolean;
  tipo_lixo: string | null;
  como_descartar: string | null;
};

export type PontoColeta = {
  id: number;
  nome: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  horario_funcionamento: string | null;
  status: 'ativo' | 'indisponivel';
  materiais_aceitos: string[];
  distancia_km: number | null;
};

export type DadosCadastro = { nome: string; cpf: string; telefone: string; senha: string };
