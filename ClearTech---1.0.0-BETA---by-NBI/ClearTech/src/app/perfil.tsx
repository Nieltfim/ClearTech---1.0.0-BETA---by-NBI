import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TelaInterna } from '../components/clear/TelaInterna';
import { Botao } from '../components/clear/Botao';
import { CampoTexto } from '../components/clear/CampoTexto';
import { cores, raio, sombra } from '../constants/clearTheme';
import { mascaraCPF, mascaraTelefone } from '../utils/mascaras';
import { useAuth } from '../contexts/AuthContext';
import { atualizarPerfil } from '../services/perfil';
import { emBreve } from '../utils/navegacao';
import { alerta } from '../utils/dialogo';

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function LinhaMenu({ icone, texto, onPress, perigo }: { icone: keyof typeof Ionicons.glyphMap; texto: string; onPress: () => void; perigo?: boolean }) {
  const cor = perigo ? cores.vermelho : cores.texto;
  return (
    <Pressable onPress={onPress} style={s.linhaMenu} accessibilityRole="button">
      <Ionicons name={icone} size={20} color={cor} />
      <Text style={[s.linhaTexto, { color: cor }]}>{texto}</Text>
      <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
    </Pressable>
  );
}

export default function Perfil() {
  const { usuario, definirUsuario, sair: encerrarSessao } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [telefone, setTelefone] = useState(mascaraTelefone(usuario?.telefone ?? ''));
  const [email, setEmail] = useState(usuario?.email ?? '');
  const iniciais = (usuario?.nome ?? '').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const [erros, setErros] = useState<{ nome?: string; telefone?: string; email?: string }>({});

  async function salvar() {
    const e: typeof erros = {};
    if (nome.trim().split(' ').filter(Boolean).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (telefone.replace(/\D/g, '').length < 10) e.telefone = 'Informe um telefone com DDD.';
    if (!emailValido(email)) e.email = 'E-mail inválido.';
    setErros(e);
    if (Object.keys(e).length) return;
    try {
      definirUsuario(await atualizarPerfil({ nome, telefone, email }));
      alerta('Pronto!', 'Suas alterações foram salvas.');
    } catch (err) {
      alerta('Não foi possível salvar', err instanceof Error ? err.message : 'Erro inesperado.');
    }
  }

  function sair() {
    alerta('Sair', 'Deseja realmente sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      // Encerrar a sessão limpa o usuário; o guarda de rotas (_layout.tsx) leva ao /login.
      { text: 'Sair', style: 'destructive', onPress: () => { encerrarSessao(); } },
    ]);
  }

  return (
    <TelaInterna titulo="Meu Perfil" subtitulo="Gerencie suas informações pessoais." ativo="perfil">
      <View style={s.avatarLinha}>
        <View style={s.avatar}><Text style={s.avatarTexto}>{iniciais}</Text></View>
        <Botao titulo="Alterar foto" variante="contorno" pequeno onPress={() => emBreve('Alterar foto')} />
      </View>

      <View style={s.card}>
        <CampoTexto rotulo="Nome completo" icone="person-outline" value={nome} onChangeText={setNome} autoCapitalize="words" erro={erros.nome} />
        <CampoTexto rotulo="CPF" icone="card-outline" value={mascaraCPF(usuario?.cpf ?? '')} editable={false} />
        <CampoTexto rotulo="Telefone" icone="call-outline" value={telefone} onChangeText={(v) => setTelefone(mascaraTelefone(v))}
          keyboardType="phone-pad" erro={erros.telefone} />
        <CampoTexto rotulo="E-mail" icone="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address"
          autoCapitalize="none" erro={erros.email} />
        <CampoTexto rotulo="Senha" icone="lock-closed-outline" value="********" editable={false} />
        <Botao titulo="Alterar senha" variante="contorno" pequeno onPress={() => emBreve('Alterar senha')} estilo={{ alignSelf: 'flex-start' }} />
        <Botao titulo="Salvar alterações" onPress={salvar} />
      </View>

      <View style={s.card}>
        <LinhaMenu icone="time-outline" texto="Histórico de atividades" onPress={() => router.push('/historico')} />
        <LinhaMenu icone="help-circle-outline" texto="Ajuda e suporte" onPress={() => router.push('/ajuda')} />
        <LinhaMenu icone="shield-checkmark-outline" texto="Termos e Política de Privacidade" onPress={() => router.push('/termos')} />
        <LinhaMenu icone="log-out-outline" texto="Sair" perigo onPress={sair} />
      </View>
    </TelaInterna>
  );
}

const s = StyleSheet.create({
  avatarLinha: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: cores.verde, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: cores.branco, fontSize: 22, fontWeight: '800' },
  card: { backgroundColor: cores.branco, borderRadius: raio.g, padding: 16, gap: 14, ...sombra },
  linhaMenu: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  linhaTexto: { flex: 1, fontSize: 15, fontWeight: '600' },
});
