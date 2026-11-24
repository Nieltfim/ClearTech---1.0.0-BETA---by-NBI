import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Botao } from '../components/clear/Botao';
import { cores, raio, sombra } from '../constants/clearTheme';

const dois = (n: number) => String(n).padStart(2, '0');

export default function RegistroSucesso() {
  // Os params chegam sempre como texto (string)
  const { material = 'Material', quantidade = '-', pontos = '0', local = '-' } = useLocalSearchParams<{
    material?: string;
    quantidade?: string;
    pontos?: string;
    local?: string;
  }>();

  const [quando] = useState(() => {
    const d = new Date();
    return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} - ${dois(d.getHours())}:${dois(d.getMinutes())}`;
  });

  const detalhes = [
    ['Material', material],
    ['Quantidade', quantidade],
    ['Pontos recebidos', pontos],
    ['Data', quando],
    ['Local', local],
  ];

  return (
    <SafeAreaView style={s.tela}>
      <ScrollView contentContainerStyle={s.conteudo} showsVerticalScrollIndicator={false}>
        <View style={s.selo}>
          <Ionicons name="checkmark" size={44} color={cores.branco} />
        </View>
        <Text style={s.titulo}>Material registrado com sucesso!</Text>
        <Text style={s.subtitulo}>Seus pontos foram adicionados.</Text>

        <View style={s.card}>
          <View style={s.foto}>
            <MaterialCommunityIcons name="bottle-soda-outline" size={52} color={cores.verdeClaro} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            {detalhes.map(([rotulo, valor]) => (
              <Text key={rotulo} style={s.detalhe}>
                <Text style={s.rotulo}>{rotulo}: </Text>
                <Text style={rotulo === 'Pontos recebidos' ? s.pontos : undefined}>{valor}</Text>
              </Text>
            ))}
          </View>
        </View>

        <Botao titulo="Registrar outro material" onPress={() => router.replace('/registrar-material')} estilo={{ alignSelf: 'stretch' }} />
        <Botao titulo="Ver meu histórico" variante="contorno" onPress={() => router.replace('/historico')} estilo={{ alignSelf: 'stretch' }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 20, paddingTop: 48, paddingBottom: 32, gap: 16, alignItems: 'center' },
  selo: { width: 84, height: 84, borderRadius: 42, backgroundColor: cores.verde, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.texto, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: cores.textoSuave, marginBottom: 8 },
  card: { flexDirection: 'row', gap: 16, alignItems: 'center', alignSelf: 'stretch', backgroundColor: cores.branco, borderRadius: raio.g, padding: 16, ...sombra },
  foto: { width: 84, height: 108, borderRadius: raio.m, backgroundColor: cores.verdeFundo, alignItems: 'center', justifyContent: 'center' },
  detalhe: { fontSize: 14, color: cores.texto },
  rotulo: { fontWeight: '800' },
  pontos: { fontWeight: '800', color: cores.verde },
});
