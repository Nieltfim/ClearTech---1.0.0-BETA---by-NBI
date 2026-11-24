import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// O token fica no armazenamento seguro do aparelho (Keychain no iOS, Keystore no Android).
// Na web o SecureStore não existe; usamos localStorage (menos seguro, aceitável para testes).
const CHAVE = 'cleartech.token';
const web = Platform.OS === 'web';

export async function salvarToken(token: string) {
  if (web) {
    try { localStorage.setItem(CHAVE, token); } catch {}
    return;
  }
  await SecureStore.setItemAsync(CHAVE, token);
}

export async function lerToken(): Promise<string | null> {
  if (web) {
    try { return localStorage.getItem(CHAVE); } catch { return null; }
  }
  return SecureStore.getItemAsync(CHAVE);
}

export async function apagarToken() {
  if (web) {
    try { localStorage.removeItem(CHAVE); } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(CHAVE);
}
