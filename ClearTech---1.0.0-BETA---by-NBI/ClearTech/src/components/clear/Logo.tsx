import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores } from '../../constants/clearTheme';

export function Logo({ grande = false }: { grande?: boolean }) {
  const tam = grande ? 30 : 22;
  return (
    <View style={s.linha}>
      <Ionicons name="leaf" size={tam} color={cores.verdeClaro} />
      <Text style={[s.texto, { fontSize: grande ? 26 : 19 }]}>ClearTech</Text>
    </View>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  texto: { fontWeight: '800', color: cores.verdeEscuro, letterSpacing: -0.3 },
});
