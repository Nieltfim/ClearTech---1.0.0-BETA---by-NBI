import { router } from 'expo-router';
import { NAV } from '../constants/navegacao';
import { alerta } from './dialogo';

export function emBreve(nome: string) {
  alerta('Em construção', `A tela "${nome}" ainda será criada.`);
}

/** Navega para um item de NAV; se a tela ainda não existe, avisa o usuário. */
export function irPara(key: string, modo: 'push' | 'replace' = 'push') {
  const item = NAV.find((n) => n.key === key);
  if (!item) return;
  if (!item.pronto) return emBreve(item.label);
  // "as never" evita erro de tipo com typedRoutes enquanto as rotas são geradas
  router[modo](item.rota as never);
}
