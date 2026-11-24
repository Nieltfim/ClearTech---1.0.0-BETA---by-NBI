import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../../constants/clearTheme';
import { NAV } from '../../constants/navegacao';
import { irPara } from '../../utils/navegacao';

export function BottomNav({ ativo }: { ativo: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.barra, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {NAV.filter((n) => n.naBarra).map((item) => {
        const on = item.key === ativo;
        return (
          <Pressable
            key={item.key}
            style={s.item}
            onPress={() => !on && irPara(item.key, 'replace')}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Ionicons name={item.icone} size={22} color={on ? cores.verde : cores.textoSuave} />
            <Text style={[s.label, on && s.labelAtivo]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 11, color: cores.textoSuave },
  labelAtivo: { color: cores.verde, fontWeight: '700' },
});
