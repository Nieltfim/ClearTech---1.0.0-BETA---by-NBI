import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Logo } from '../components/clear/Logo';
import { Botao } from '../components/clear/Botao';
import { BottomNav } from '../components/clear/BottomNav';
import { cores, raio, sombra } from '../constants/clearTheme';
import { irPara } from '../utils/navegacao';
import { useAuth } from '../contexts/AuthContext';

const ACOES = [
  { titulo: 'Registrar Material', destino: 'registrar', cor: cores.verdeClaro, icone: <MaterialCommunityIcons name="recycle" size={30} color={cores.verdeClaro} /> },
  { titulo: 'Meus Pontos', destino: 'pontos', cor: cores.amarelo, icone: <MaterialCommunityIcons name="star-circle" size={30} color={cores.amarelo} /> },
  { titulo: 'Resgatar Benefícios', destino: 'beneficios', cor: cores.vermelho, icone: <Ionicons name="gift" size={28} color={cores.vermelho} /> },
  { titulo: 'Ver Histórico', destino: 'historico', cor: cores.azul, icone: <Ionicons name="document-text" size={28} color={cores.azul} /> },
  { titulo: 'Ver Tela Inicial', destino: 'T-login', cor: cores.verdeClaro, icone: <Ionicons name="leaf" size={28} color={cores.verdeEscuro} /> },
  { titulo: 'Alterar Perfil', destino: 'perfil', cor: cores.roxo, icone: <Ionicons name="information" size={28} color={cores.branco} /> }
];

export default function Dashboard() {
  const { usuario, atualizarUsuario } = useAuth();

  // Ao voltar para esta tela, busca o saldo atualizado no servidor.
  useFocusEffect(
    useCallback(() => {
      atualizarUsuario();
    }, [atualizarUsuario]),
  );

  if (!usuario) return null; // sempre DEPOIS de todos os hooks

  const primeiroNome = usuario.nome.split(' ')[0];
  const iniciais = usuario.nome.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <SafeAreaView style={s.tela} edges={['top']}>
      <View style={s.topo}>
        <Logo />
        <View style={s.topoDireita}>
          <View>
            <Ionicons name="notifications-outline" size={24} color={cores.texto} />
            <View style={s.ponto} />
          </View>
          <View style={s.usuario}>
            <View style={s.avatar}><Text style={s.avatarTexto}>{iniciais}</Text></View>
            <Text style={s.usuarioNome}>{primeiroNome}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.conteudo} showsVerticalScrollIndicator={false}>
        <View style={s.linhaCards}>
          <View style={[s.card, { flex: 1.2 }]}>
            <Text style={s.ola}>Olá, {primeiroNome}!</Text>
            <View style={s.linhaCurta}>
              <Text style={s.continue}>Continue fazendo a diferença!</Text>
              <Ionicons name="heart" size={14} color={cores.verdeClaro} />
            </View>
          </View>

          <View style={[s.card, { flex: 1 }]}>
            <Text style={s.pontosRotulo}>Seus pontos</Text>
            <View style={s.linhaCurta}>
              <Ionicons name="leaf" size={22} color={cores.verdeClaro} />
              <Text style={s.pontos}>{usuario.pontos}</Text>
            </View>
          </View>
        </View>

        <Botao titulo="Resgatar benefícios" pequeno onPress={() => irPara('beneficios')} />

        <View style={s.banner}>
          <MaterialCommunityIcons name="recycle" size={140} color="rgba(255,255,255,0.12)" style={s.bannerIcone} />
          <Text style={s.bannerTexto}>Recicle hoje.{'\n'}Ganhe benefícios.{'\n'}Construa um amanhã melhor!</Text>
        </View>

        <Text style={s.secao}>Ações rápidas</Text>
        <View style={s.grade}>
          {ACOES.map((a) => (
            <Pressable key={a.titulo} style={({ pressed }) => [s.acao, pressed && { opacity: 0.8 }]}
              onPress={() => irPara(a.destino)} accessibilityRole="button">
              <View style={[s.acaoIcone, { backgroundColor: a.cor + '22' }]}>{a.icone}</View>
              <Text style={s.acaoTexto}>{a.titulo}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <BottomNav ativo="inicio" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  topoDireita: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ponto: { position: 'absolute', top: 1, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: cores.vermelho },
  usuario: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: cores.verde, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: cores.branco, fontWeight: '800', fontSize: 13 },
  usuarioNome: { fontSize: 13, fontWeight: '600', color: cores.texto },
  conteudo: { padding: 20, paddingTop: 8, paddingBottom: 28, gap: 16 },
  linhaCards: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: cores.branco, borderRadius: raio.g, padding: 16, gap: 6, justifyContent: 'center', ...sombra },
  ola: { fontSize: 22, fontWeight: '800', color: cores.texto },
  continue: { fontSize: 12, color: cores.textoSuave, flexShrink: 1 },
  linhaCurta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pontosRotulo: { fontSize: 13, color: cores.textoSuave },
  pontos: { fontSize: 34, fontWeight: '800', color: cores.texto },
  banner: { backgroundColor: cores.verde, borderRadius: raio.g, padding: 22, minHeight: 130, justifyContent: 'center', overflow: 'hidden' },
  bannerIcone: { position: 'absolute', right: -20, bottom: -24 },
  bannerTexto: { fontSize: 20, lineHeight: 27, fontWeight: '800', color: cores.branco },
  secao: { fontSize: 17, fontWeight: '800', color: cores.texto, marginTop: 4 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  acao: { width: '47.8%', backgroundColor: cores.branco, borderRadius: raio.g, padding: 16, gap: 12, alignItems: 'center', ...sombra },
  acaoIcone: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  acaoTexto: { fontSize: 13, fontWeight: '700', color: cores.texto, textAlign: 'center' },
});
