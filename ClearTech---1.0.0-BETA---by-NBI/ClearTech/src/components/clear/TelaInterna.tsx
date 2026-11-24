import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BottomNav } from './BottomNav';
import { cores } from '../../constants/clearTheme';

type Props = {
  titulo: string;
  subtitulo?: string;
  /** chave do item de NAV a destacar na barra inferior; sem ela, a barra não aparece */
  ativo?: string;
  voltar?: boolean;
  children: ReactNode;
};

export function TelaInterna({ titulo, subtitulo, ativo, voltar, children }: Props) {
  function aoVoltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/dashboard');
  }

  return (
    <SafeAreaView style={s.tela} edges={ativo ? ['top'] : ['top', 'bottom']}>
      <View style={s.topo}>
        {voltar && (
          <Pressable onPress={aoVoltar} hitSlop={10} style={s.voltar} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={22} color={cores.texto} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.titulo}>{titulo}</Text>
          {!!subtitulo && <Text style={s.subtitulo}>{subtitulo}</Text>}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {ativo ? <BottomNav ativo={ativo} /> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  voltar: { width: 36, height: 36, justifyContent: 'center' },
  titulo: { fontSize: 24, fontWeight: '800', color: cores.texto },
  subtitulo: { fontSize: 14, color: cores.textoSuave, marginTop: 2 },
  conteudo: { padding: 20, paddingTop: 12, paddingBottom: 32, gap: 16 },
});
