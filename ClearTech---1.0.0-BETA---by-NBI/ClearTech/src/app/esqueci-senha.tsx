import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Logo } from '../components/clear/Logo';
import { Botao } from '../components/clear/Botao';
import { CampoTexto } from '../components/clear/CampoTexto';
import { cores, raio, sombra } from '../constants/clearTheme';
import { cpfValido, mascaraCPF } from '../utils/mascaras';
import { alerta } from '../utils/dialogo';
import { esqueciSenha } from '../services/auth';

export default function EsqueciSenha() {
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!cpfValido(cpf)) {
      setErro('CPF inválido.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      await esqueciSenha(cpf);
      alerta('Instruções enviadas', 'Se o CPF estiver cadastrado, você receberá as instruções de recuperação.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado.');
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

          <View style={s.logo}><Logo grande /></View>

          <View style={s.card}>
            <View style={s.cabecalho}>
              <Text style={s.titulo}>Recuperar senha</Text>
              <Text style={s.subtitulo}>Informe seu CPF para receber as instruções de recuperação de senha.</Text>
            </View>

            <CampoTexto rotulo="CPF" icone="person-outline" placeholder="000.000.000-00" keyboardType="number-pad"
              value={cpf} onChangeText={(v) => setCpf(mascaraCPF(v))} erro={erro} />
            <Botao titulo="Enviar instruções" onPress={enviar} carregando={carregando} />
          </View>

          <Text style={s.rodape} onPress={() => router.replace('/login')}>Voltar para o login</Text>
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
  subtitulo: { fontSize: 14, color: cores.textoSuave, textAlign: 'center', lineHeight: 20 },
  rodape: { textAlign: 'center', fontSize: 14, color: cores.verde, fontWeight: '700' },
});
