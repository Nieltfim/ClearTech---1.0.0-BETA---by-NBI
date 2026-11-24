import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../components/clear/Botao';
import { Logo } from '../components/clear/Logo';
import { cores, raio } from '../constants/clearTheme';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

const BENEFICIOS = [
  { icone: 'earth-outline', titulo: 'Mais sustentabilidade', texto: 'em cada etapa da nossa jornada. Acreditamos que o crescimento responsável caminha junto com o respeito à natureza, por isso incentivamos a reciclagem e o reaproveitamento consciente de materiais para reduzir nossa pegada ecológica.' },
  { icone: 'cash-outline', titulo: 'Cashbacks', texto: 'que fazem bem para o seu bolso e para o planeta. Aqui, o seu material reciclável não vai para o lixo: ele volta para você em forma de dinheiro e benefícios. Separe, entregue nos pontos de coleta e transforme atitudes sustentáveis em recompensas reais.' },
  { icone: 'business-outline', titulo: 'Cidades', texto: 'mais limpas começam com a atitude de quem vive nelas. Cuidar de Manaus é respeitar nossas ruas, nossos igarapés e a floresta que nos cerca. Quando cada cidadão faz o descarte correto e apoia a reciclagem, transformamos o visual da nossa capital e garantimos mais saúde e bem-estar para todos.' },
] as const;



export default function TelaInicial_logada() {
  const scroll = useRef<ScrollView>(null);
  const [yBeneficios, setYBeneficios] = useState(0);
  const videoRef = require('../assets/Videos/Guia.mp4');
  const player = useVideoPlayer(videoRef, (p) => {
    p.loop = false;
  });
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
        <View style={s.usuario}>
              <View style={s.avatar}><Text style={s.avatarTexto}>{iniciais}</Text></View>
              <Text style={s.usuarioNome}>{primeiroNome}</Text>
        </View>
      </View>

      <ScrollView ref={scroll} contentContainerStyle={s.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={s.titulo}>
          Recilando para um futuro<Text style={s.tituloVerde}> Sustentável.</Text>
        </Text>
        <Text style={s.subtitulo}>
          Transforme atitudes sustentáveis em recompensas: recicle na ClearTech seus materiais, e ganhe cashbacks exclusivos e cuide do meio ambiente.
        </Text>

        <View style={s.ilustracaoWrap}>
          <View style={s.circuloGrande}>
            <View style={s.circuloMedio}>
              <MaterialCommunityIcons name="recycle" size={120} color={cores.verdeClaro} />
            </View>
          </View>
          <Ionicons name="leaf" size={34} color={cores.verdeClaro} style={s.folhaA} />
          <Ionicons name="leaf" size={22} color={cores.verde} style={s.folhaB} />
        </View>

        <View style={s.botoes}>
          <Botao titulo=" Ir DashBoard" onPress={() => router.push('./dashboard')} estilo={{ flex: 1 }} />
          <Botao
            titulo="Saiba mais"
            variante="contorno"
            onPress={() => scroll.current?.scrollTo({ y: yBeneficios, animated: true })}
            estilo={{ flex: 1 }}
          />
        </View>

        <Text style={s.titulo}>
          Nossos objetivos para o <Text style={s.tituloVerde}>cuidado do meio ambiente.</Text>
        </Text>

        <View style={s.beneficios} onLayout={(e) => setYBeneficios(e.nativeEvent.layout.y)}>
          {BENEFICIOS.map((b) => (
            <View key={b.titulo} style={s.beneficio}>
              <View style={s.beneficioIcone}>
                <Ionicons name={b.icone} size={24} color={cores.verde} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.beneficioTitulo}>{b.titulo}</Text>
                <Text style={s.beneficioTexto}>{b.texto}</Text>
              </View>
            </View>
          ))}
        </View>

        
        <View style={s.footer_}>
          <Text style={s.VideoExplicativo}>Guia</Text>
          <Text style={s.VideoExplicativoMenor}>Audio-Explicativo</Text>
          <View style={s.ConteinerVideo}>
            <VideoView
              player={player}
              style={s.video}
              nativeControls
              contentFit='contain'
            />
          </View>
        </View>


        <View style={s.footer_}>
            <Text style={s.TextoFooterCréditos}>Copyright 2026© NBI®</Text>

            <View style={s.DivFooterQuebrada}>
              <Text style={s.TextoFooter}>Termos de serviço</Text>
              <Text style={s.TextoFooter}>Cookies</Text>
              <Text style={s.TextoFooter}>Aviso de Privacidade</Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topoAcoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnEntrar: {
    minHeight: 38,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: raio.p,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.branco,
  },
  btnEntrarTexto: { fontSize: 13, fontWeight: '700', color: cores.verdeEscuro },
  conteudo: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 18 },
  titulo: { fontSize: 40, lineHeight: 46, fontWeight: '800', color: cores.texto, letterSpacing: -1 },
  VideoExplicativo: { fontSize: 40, lineHeight: 46, fontWeight: '800', color: cores.texto, letterSpacing: -1, textAlign: 'center'},
  VideoExplicativoMenor: { fontSize: 35, lineHeight: 46, fontWeight: '800', color: cores.texto, letterSpacing: -1, textAlign: 'center'},
  tituloVerde: { color: cores.verdeClaro },
  subtitulo: { fontSize: 16, lineHeight: 24, color: cores.textoSuave },
  ilustracaoWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  circuloGrande: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: cores.verdeFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloMedio: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: cores.branco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folhaA: { position: 'absolute', top: 10, right: 40, transform: [{ rotate: '25deg' }] },
  folhaB: { position: 'absolute', bottom: 30, left: 40, transform: [{ rotate: '-30deg' }] },
  botoes: { flexDirection: 'row', gap: 12 },
  beneficios: {
    marginTop: 12,
    backgroundColor: cores.branco,
    borderRadius: raio.g,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  beneficio: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  beneficioIcone: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: cores.verdeFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beneficioTitulo: { fontSize: 15, fontWeight: '700', color: cores.texto },
  beneficioTexto: { fontSize: 13, color: cores.textoSuave },

  footer_: {
    marginTop: 10,
    backgroundColor: cores.branco,
    borderRadius: raio.g,
    padding: 30,
    gap: 10,
    borderWidth: 1,
    borderColor: cores.borda,
  },

  TextoFooter: {
    fontSize: 9,
    fontWeight: 'bold',
  },

  TextoFooterCréditos:{
    fontWeight: 'bold',
    textAlign: 'center',
  },

  DivFooterQuebrada: {
    gap: 10,
    display: 'flex', 
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'center', 
  },

  ConteinerVideo:{
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
    alignItems: 'center'
  },

  video:{
    borderRadius: 8,
    borderWidth: 2,
    width: '108%',
    height: 180,
    aspectRatio: 16 / 9,
  },

  usuario: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: cores.verde, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: cores.branco, fontWeight: '800', fontSize: 13 },
  usuarioNome: { fontSize: 13, fontWeight: '600', color: cores.texto },
});
