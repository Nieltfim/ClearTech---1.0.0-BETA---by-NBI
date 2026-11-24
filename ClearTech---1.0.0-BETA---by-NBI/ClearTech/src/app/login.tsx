import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Logo } from '../components/clear/Logo';
import { Botao } from '../components/clear/Botao';
import { CampoTexto } from '../components/clear/CampoTexto';
import { cores, raio, sombra } from '../constants/clearTheme';
import { emBreve } from '../utils/navegacao';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { entrar: fazerLogin } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<{ usuario?: string; senha?: string }>({});
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    const e: typeof erros = {};
    if (!usuario.trim()) e.usuario = 'Informe seu CPF ou nome de usuário.';
    if (!senha) e.senha = 'Informe sua senha.';
    setErros(e);
    if (Object.keys(e).length) return;

    setCarregando(true);
    try {
      // O guarda de rotas (_layout.tsx) leva ao dashboard assim que o usuário existir.
      await fazerLogin(usuario, senha);
    } catch (err) {
      setErros({ senha: err instanceof Error ? err.message : 'Erro inesperado.' });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={s.tela}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={s.voltar} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={22} color={cores.texto} />
          </Pressable>

          <View style={s.logo}>
            <Logo grande />
          </View>

          <View style={s.card}>
            <View style={s.cabecalho}>
              <Text style={s.titulo}>Bem-vindo de volta!</Text>
              <Text style={s.subtitulo}>Acesse sua conta para continuar.</Text>
            </View>

            <CampoTexto rotulo="CPF ou nome de usuário" icone="person-outline" placeholder="Digite seu CPF ou nome"
              value={usuario} onChangeText={setUsuario} autoCapitalize="none" autoCorrect={false} erro={erros.usuario} />
            <CampoTexto rotulo="Senha" icone="lock-closed-outline" placeholder="Digite sua senha" senha
              value={senha} onChangeText={setSenha} erro={erros.senha} />

            <Text style={s.esqueci} onPress={() => router.push('/esqueci-senha')}>Esqueceu sua senha?</Text>

            <Botao titulo="Entrar" onPress={entrar} carregando={carregando} />

            <View style={s.divisor}>
              <View style={s.linha} />
              <Text style={s.ou}>ou</Text>
              <View style={s.linha} />
            </View>

            <Botao titulo="Entrar com Google" variante="contorno" icone="logo-google" onPress={() => emBreve('Login com Google')} />
          </View>

          <Text style={s.rodape}>
            Não tem uma conta?{' '}
            <Text style={s.link} onPress={() => router.replace('/cadastro')}>Criar conta</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 20, paddingBottom: 40, gap: 16 },
  voltar: { width: 36, height: 36, justifyContent: 'center' },
  logo: { alignItems: 'center', marginTop: 8 },
  card: { backgroundColor: cores.branco, borderRadius: raio.g, padding: 20, gap: 16, ...sombra },
  cabecalho: { alignItems: 'center', gap: 6, marginBottom: 4 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto },
  subtitulo: { fontSize: 14, color: cores.textoSuave },
  esqueci: { alignSelf: 'flex-end', fontSize: 13, color: cores.verde, fontWeight: '600' },
  divisor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linha: { flex: 1, height: 1, backgroundColor: cores.borda },
  ou: { fontSize: 13, color: cores.textoSuave },
  rodape: { textAlign: 'center', fontSize: 14, color: cores.textoSuave },
  link: { color: cores.verde, fontWeight: '700' },
});
