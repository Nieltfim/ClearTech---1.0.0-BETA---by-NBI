import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Logo } from '../components/clear/Logo';
import { Botao } from '../components/clear/Botao';
import { CampoTexto } from '../components/clear/CampoTexto';
import { cores, raio, sombra } from '../constants/clearTheme';
import { cpfValido, mascaraCPF, mascaraTelefone, soDigitos } from '../utils/mascaras';
import { alerta } from '../utils/dialogo';
import { useAuth } from '../contexts/AuthContext';

type Erros = Partial<Record<'nome' | 'cpf' | 'telefone' | 'senha' | 'confirmar' | 'termos', string>>;

export default function Cadastro() {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [aceito, setAceito] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [carregando, setCarregando] = useState(false);

  function validar() {
    const e: Erros = {};
    if (nome.trim().split(' ').filter(Boolean).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (!cpfValido(cpf)) e.cpf = 'CPF inválido.';
    if (soDigitos(telefone).length < 10) e.telefone = 'Informe um telefone com DDD.';
    if (senha.length < 8) e.senha = 'A senha precisa ter ao menos 8 caracteres.';
    if (confirmar !== senha) e.confirmar = 'As senhas não conferem.';
    if (!aceito) e.termos = 'Aceite os termos para continuar.';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function criarConta() {
    if (!validar()) return;
    setCarregando(true);
    try {
      // O cadastro já deixa o usuário logado; o guarda de rotas leva ao dashboard.
      await cadastrar({ nome, cpf, telefone, senha });
    } catch (err) {
      alerta('Não foi possível criar a conta', err instanceof Error ? err.message : 'Erro inesperado.');
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

          <View style={s.card}>
            <View style={s.cabecalho}>
              <Logo />
              <Text style={s.titulo}>Crie sua conta</Text>
              <Text style={s.subtitulo}>Faça parte dessa mudança!</Text>
            </View>

            <CampoTexto rotulo="Nome completo" icone="person-outline" placeholder="Digite seu nome completo"
              value={nome} onChangeText={setNome} autoCapitalize="words" erro={erros.nome} />
            <CampoTexto rotulo="CPF" icone="card-outline" placeholder="000.000.000-00" keyboardType="number-pad"
              value={cpf} onChangeText={(v) => setCpf(mascaraCPF(v))} erro={erros.cpf} />
            <CampoTexto rotulo="Telefone" icone="call-outline" placeholder="(00) 00000-0000" keyboardType="phone-pad"
              value={telefone} onChangeText={(v) => setTelefone(mascaraTelefone(v))} erro={erros.telefone} />
            <CampoTexto rotulo="Senha" icone="lock-closed-outline" placeholder="Crie uma senha" senha
              value={senha} onChangeText={setSenha} erro={erros.senha} />
            <CampoTexto rotulo="Confirmar senha" icone="lock-closed-outline" placeholder="Confirme sua senha" senha
              value={confirmar} onChangeText={setConfirmar} erro={erros.confirmar} />

            <View style={{ gap: 4 }}>
              <Pressable style={s.termos} onPress={() => setAceito((v) => !v)} accessibilityRole="checkbox"
                accessibilityState={{ checked: aceito }}>
                <Ionicons name={aceito ? 'checkbox' : 'square-outline'} size={22}
                  color={aceito ? cores.verde : cores.textoSuave} />
                <Text style={s.termosTexto}>
                  Li e aceito os{' '}
                  <Text style={s.link} onPress={() => router.push('/termos')}>Termos de Uso e a Política de Privacidade</Text>
                </Text>
              </Pressable>
              {!!erros.termos && <Text style={s.erro}>{erros.termos}</Text>}
            </View>

            <Botao titulo="Criar conta" onPress={criarConta} carregando={carregando} />

            <Text style={s.rodape}>
              Já tem uma conta?{' '}
              <Text style={s.link} onPress={() => router.replace('/login')}>Entrar</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 20, paddingBottom: 40, gap: 12 },
  voltar: { width: 36, height: 36, justifyContent: 'center' },
  card: { backgroundColor: cores.branco, borderRadius: raio.g, padding: 20, gap: 16, ...sombra },
  cabecalho: { alignItems: 'center', gap: 6, marginBottom: 4 },
  titulo: { fontSize: 24, fontWeight: '800', color: cores.texto, marginTop: 8 },
  subtitulo: { fontSize: 14, color: cores.textoSuave },
  termos: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  termosTexto: { flex: 1, fontSize: 13, lineHeight: 19, color: cores.textoSuave },
  link: { color: cores.verde, fontWeight: '700' },
  erro: { fontSize: 12, color: cores.erro },
  rodape: { textAlign: 'center', fontSize: 14, color: cores.textoSuave },
});
