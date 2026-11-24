import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, raio } from '../../constants/clearTheme';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'contorno';
  icone?: keyof typeof Ionicons.glyphMap;
  carregando?: boolean;
  desabilitado?: boolean;
  pequeno?: boolean;
  estilo?: ViewStyle;
};

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  carregando,
  desabilitado,
  pequeno,
  estilo,
}: Props) {
  const primario = variante === 'primario';
  const inativo = desabilitado || carregando;
  const corTexto = primario ? cores.branco : cores.verdeEscuro;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.base,
        pequeno && s.pequeno,
        primario ? s.primario : s.contorno,
        (pressed || inativo) && { opacity: 0.75 },
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {icone && <Ionicons name={icone} size={18} color={corTexto} />}
          <Text style={[s.texto, pequeno && { fontSize: 13 }, { color: corTexto }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: raio.m,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pequeno: { minHeight: 38, borderRadius: raio.p, paddingHorizontal: 12 },
  primario: { backgroundColor: cores.verde },
  contorno: { backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.borda },
  texto: { fontSize: 16, fontWeight: '700' },
});
