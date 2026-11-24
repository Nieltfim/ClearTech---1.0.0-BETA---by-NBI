import { Ionicons } from '@expo/vector-icons';

export type ItemNav = {
  key: string;
  label: string;
  icone: keyof typeof Ionicons.glyphMap;
  rota: string;
  /** true quando a tela existe em src/app */
  pronto: boolean;
  naBarra: boolean;
};

export const NAV: ItemNav[] = [
  { key: 'inicio', label: 'Início', icone: 'home-outline', rota: '/dashboard', pronto: true, naBarra: true },
  { key: 'pontos', label: 'Meus Pontos', icone: 'leaf-outline', rota: '/historico', pronto: true, naBarra: true },
  { key: 'registrar', label: 'Registrar', icone: 'qr-code-outline', rota: '/registrar-material', pronto: true, naBarra: true },
  { key: 'beneficios', label: 'Benefícios', icone: 'gift-outline', rota: '/beneficios', pronto: true, naBarra: true },
  { key: 'historico', label: 'Histórico', icone: 'time-outline', rota: '/historico', pronto: true, naBarra: false },
  { key: 'perfil', label: 'Perfil', icone: 'person-outline', rota: '/perfil', pronto: true, naBarra: true },
  { key: 'ajuda', label: 'Ajuda', icone: 'help-circle-outline', rota: '/ajuda', pronto: true, naBarra: false },
  { key: 'T-login', label: 'Tela inicial', icone: 'leaf', rota: '/index-logada', pronto: true, naBarra: false },
];
