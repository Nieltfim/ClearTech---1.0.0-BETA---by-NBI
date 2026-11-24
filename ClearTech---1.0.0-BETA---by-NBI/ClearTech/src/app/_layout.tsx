import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { cores } from '../constants/clearTheme';

// Mantém a tela de abertura até sabermos se existe um login salvo (evita "piscar" a tela de login).
SplashScreen.preventAutoHideAsync();

const PUBLICAS = ['', 'login', 'cadastro', 'esqueci-senha', 'termos']; // '' = tela inicial (index)
const SO_PARA_DESLOGADO = ['', 'login', 'cadastro', 'esqueci-senha'];

function Navegacao() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const raiz = (useSegments() as string[])[0] ?? '';

  // GUARDA DE ROTAS: redireciona conforme existir (ou não) um usuário logado.
  useEffect(() => {
    if (carregando) return;
    if (!usuario && !PUBLICAS.includes(raiz)) router.replace('/');
    else if (usuario && SO_PARA_DESLOGADO.includes(raiz)) router.replace('/dashboard');
  }, [usuario, carregando, raiz, router]);

  useEffect(() => {
    if (!carregando) SplashScreen.hideAsync();
  }, [carregando]);

  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: cores.fundo } }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <Navegacao />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
